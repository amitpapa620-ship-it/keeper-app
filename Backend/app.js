
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import path from "path";
import session from "express-session";
import passport from "passport";

import MongoStore from "connect-mongo";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
import dotenv from "dotenv";
dotenv.config();
import Groq from "groq-sdk";
import nodemailer from "nodemailer";
import { Resend } from 'resend';
import crypto from "crypto";


const __dirname = path.resolve();//Global path where javascript is runing.
// const saltRounds = 10;


const app = express();
const port = process.env.PORT ||3000;


app.set("view engine", "ejs");// take care of my ejs file. when we use the ejs file don't need to write the .ejs extension.
app.use(express.json());// it is express middleware.
app.use(bodyParser.urlencoded({ extended: true }));// help to take html form data in javascript object. it is middleware.
app.use(session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,// don't save untill user login.
  store: MongoStore.create({ // it is use to store session in mongoDB. it means no loose of data when sudden shutdown of server.
    mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/userDB"
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days life span.
  }
}));

const resend = new Resend(process.env.RESEND_API_KEY);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  family: 4,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify()
    .then(() => console.log("SMTP server is ready"))
    .catch((error) => console.log("SMTP verification skipped/failed (using Resend fallback)"));
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}
const OTP_SALT = process.env.OTP_SALT || "keeper-otp-secret";
function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(otp+ OTP_SALT) // otp + salt for strong hash function.
    .digest("hex");
}

// Updated OTP Email function using Resend API first
async function sendOtpEmail(email, otp) {
  try {
    // If Resend API Key is available, use Resend HTTP API (bypasses Render SMTP port blocking)
    if (process.env.RESEND_API_KEY) {
      const data = await resend.emails.send({
        from: 'Keeper App <onboarding@resend.dev>', // Default testing address for Resend
        to: email,
        subject: 'Verify your email - Keeper App',
        html: `
          <h2>Email Verification</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP expires in 10 minutes.</p>
        `
      });
      console.log("OTP email sent via Resend API:", data);
      return data;
    }

    // Fallback: Nodemailer for local development
    const info = await transporter.sendMail({
      from: `"Keeper App" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify your email",
      text: `Your OTP is ${otp}. It expires in 10 minutes.`,
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
      `
    });

    console.log("OTP email sent via Nodemailer:", info.messageId);
    return info;
  } catch (error) {
    console.error("OTP email sending failed:", error);
    throw error;
  }
}


app.use(passport.initialize());// it is use to initialize the passport.
app.use(passport.session());// it attached the session with passport.

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/userDB");// connect mongodb with server.



const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // here we user ObjectId of User in userId to make each note of same user.
    ref: "User"
  },
  title: String,
  content: String,
  reminder: Date,
  //adding open ai schema in noteschema summary, ailabels, priority.
  summary: String,
  aiLabels: [String],
  priority: {
    type: String,
    enum: ["low", "normal", "high"],
    default: "normal"
  },
  labels: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Label"
    }
  ],
  isArchived: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });// timestamps add two field that when notes was createAt and UpdateAt which time.

const Note = mongoose.model("Note", noteSchema);// this create noteSchema into working javaScript as class of note.
// we apply javaScript operation on it.
const labelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  name: String
});

const Label = mongoose.model("Label", labelSchema);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
    
});

userSchema.plugin(passportLocalMongoose.default || passportLocalMongoose);//this plugin use for authenication by passport.js
userSchema.plugin(findOrCreate.default || findOrCreate);// help to find id in google sign in or sign up.
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser((user, cb) => {
  cb(null, user.id); // store only user id in session
});

passport.deserializeUser(async (id, cb) => {
  try {
    const user = await User.findById(id);
    cb(null, user);
  } catch (err) {
    cb(err, null);
  }
});


// OAuth Authentication passport-google-oauth20
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL||"http://localhost:3000/auth/google/secrets"
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      const email = profile.emails[0].value;

      let user = await User.findOne({
        $or: [
          { googleId: profile.id },
          { email: email }
        ]
      });

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          email: email,
          username: email
        });
      } else if (!user.googleId) {
        // link existing account
        user.googleId = profile.id;
        await user.save();
      }

      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  }
));

app.use(express.static(path.join(__dirname, "public")));

//genAi
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

app.post("/ai/suggest", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }
    const { title, content } = req.body;
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `
          You help organize notes.

          Title: ${title || ""}
          Content: ${content}

          Return ONLY valid JSON:

          {
            "title": "better short title",
            "summary": "short summary",
            "labels": ["label1", "label2"],
            "priority": "low"
          }
`
        }
      ],
      temperature: 0.3
    });

    const text = completion.choices[0].message.content;

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const aiData = JSON.parse(cleaned);

    res.json(aiData);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});




app.get("/", (req, res) => {
    res.render("home.ejs");
});


// trigger when user clicks on login with google button in login.ejs
app.get("/auth/google", 
        passport.authenticate('google',{scope: ["profile","email"]})
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home or note page.
    res.redirect('/secrets');
  });
app.get("/login", (req, res) => {
    res.render("login.ejs");
});
app.get("/register", (req, res) => {
    res.render("register.ejs");
});
app.use(express.static(path.join(__dirname, "../Frontend/dist")));

app.get("/secrets", (req, res) => {
   
    if(req.isAuthenticated()){
        res.sendFile(path.join(__dirname, "../Frontend/dist/index.html"));
    } else {
        res.redirect("/login");
    }
    
});

app.get("/check-auth", (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

app.get("/labels", async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).send("Unauthorized");
        }

        const labels = await Label.find({
            userId: req.user._id
        });

        res.json(labels);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.post("/addNote", async (req, res) => {
    try{
        if(!req.isAuthenticated()){
            return res.status(401).send("Unauthorized");
        }

        const { 
          title,
           content,
            reminder,
            summary,
            aiLabels,
            priority 
          } = req.body;

        if (!title || !content) {
            return res.status(400).send("empty note");
        }

       

       const user = req.user;
        const {labelIds} = req.body;
       const note = new Note({
            title,
            content,
            reminder,
            summary,
            aiLabels,
            priority,
            userId: req.user._id,
            labels: labelIds || []
          });
        await note.save();
        return res.status(201).json(note);

    } catch (error) {
        console.error("Error adding note:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/updateNote", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const { id, title, content, reminder } = req.body;

    const updatedNote = await Note.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { title, content, reminder: reminder || null },
      { new: true }
    ).populate("labels");

    res.json(updatedNote);
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).send("Server error");
  }
});

app.post("/deleteNote", async (req, res) => {
    try {
        const { id } = req.body;

        if (!req.isAuthenticated()) {
            return res.status(401).send("Unauthorized");
        }

        await Note.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { 
              isDeleted: true,
              isArchived: false
             }
        );

        res.status(200).send("Note deleted");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


app.post("/pinNote", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const { id, isPinned } = req.body;

    await Note.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isPinned: !isPinned },
      { new: true }
    );

    res.status(200).send("Pin updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/archiveNote", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const { id } = req.body;

    await Note.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isArchived: true }
    );

    res.status(200).send("Note archived");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/restoreNote", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const { id } = req.body;

    await Note.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        isArchived: false,
        isDeleted: false
      }
    );

    res.status(200).send("Note restored");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/permanentDeleteNote", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }

    const { id } = req.body;

    await Note.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    res.status(200).send("Note permanently deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/notes", async (req, res) => {
    if(!req.isAuthenticated()){
        return res.status(401).send("Not Logged in");
    }
    const notes = await Note.find({
    userId: req.user._id,
    // isDeleted: false
  }).populate("labels");
    res.json(notes);
});


app.post("/addLabel", async (req, res) => {
    try{
        if(!req.isAuthenticated()){
            return res.status(401).send("Unauthorized");
        }

        const { name } = req.body;

        

        const label = new Label({
            name,
            userId: req.user._id
        });

        await label.save();
        res.status(201).json(label);
    } catch (error) {
        console.error("Error adding label:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/deleteLabel", async (req, res) => {
    try{
        if(!req.isAuthenticated()){
            return res.status(401).send("Unauthorized");
        }
        const {id} = req.body;
        // 1. delete label
        await Label.findOneAndDelete({
            _id: id,
            userId: req.user._id
        });

        // 2. remove label from all notes
        await Note.updateMany(
            { userId: req.user._id },
            { $pull: { labels: id } }
        );
        res.json("Label deleted");
    } catch (error) {
        console.error("Error deleting label:", error);
        res.status(500).send("Internal Server Error");
    }
});
app.post("/updateLabel", async (req, res) => {
    try {
        if (!req.isAuthenticated()) {
            return res.status(401).send("Unauthorized");
        }

        const { id, name } = req.body;

        const updated = await Label.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { name },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});


app.post("/verify-otp", async (req, res, next) => {
  try {
    const pending = req.session.pendingRegistration;
    const enteredOtp = req.body.otp?.trim();

    if (!pending) {
      return res.redirect("/register");
    }

    if (!enteredOtp) {
      return res.status(400).render("verify-otp.ejs", {
        email: pending.email,
        error: "Please enter the OTP"
      });
    }

    if (Date.now() > pending.otpExpiresAt) {
      delete req.session.pendingRegistration;

      return res.status(400).send(
        "OTP has expired. Please register again."
      );
    }

    pending.attempts += 1;

    if (pending.attempts > 5) {
      delete req.session.pendingRegistration;

      return res.status(429).send(
        "Too many incorrect attempts. Please register again."
      );
    }

    if (hashOtp(enteredOtp) !== pending.otpHash) {
      return res.status(400).render("verify-otp.ejs", {
        email: pending.email,
        error: "Incorrect OTP"
      });
    }

    const alreadyExists = await User.findOne({
      username: pending.email
    });

    if (alreadyExists) {
      delete req.session.pendingRegistration;
      return res.redirect("/login");
    }

    const user = await User.register(
      {
        username: pending.email,
        email: pending.email
      },
      pending.password
    );

    delete req.session.pendingRegistration;

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }

      req.session.save((sessionError) => {
        if (sessionError) {
          return next(sessionError);
        }

        console.log("Email verified and user registered");
        res.redirect("/secrets");
      });
    });

  } catch (err) {
    console.error("OTP verification error:", err);
    next(err);
  }
});

app.get("/verify-otp", (req, res) => {
  if (!req.session.pendingRegistration) {
    return res.redirect("/register");
  }

  res.render("verify-otp.ejs", {
    email: req.session.pendingRegistration.email,
    error: null
  });
});

app.post("/resend-otp", async (req, res) => {
  try {
    const pending = req.session.pendingRegistration;

    if (!pending) {
      return res.redirect("/register");
    }

    const otp = generateOtp();

    pending.otpHash = hashOtp(otp);
    pending.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    pending.attempts = 0;

    await sendOtpEmail(pending.email, otp);

    req.session.save((err) => {
      if (err) {
        return res.status(500).send("Unable to save OTP");
      }

      res.render("verify-otp.ejs", {
        email: pending.email,
        error: "A new OTP has been sent"
      });
    });

  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).send("Unable to resend OTP");
  }
});

app.post("/register", async (req, res) => {
  try {
    const email = req.body.username?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).send("Email and password are required");
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return res.status(400).send("Enter a valid email address");
    }

    if (password.length < 6) {
      return res.status(400).send(
        "Password must contain at least 6 characters"
      );
    }

    const existingUser = await User.findOne({ username: email });

    if (existingUser) {
      return res.status(409).send("This email is already registered");
    }

    const otp = generateOtp();

    req.session.pendingRegistration = {
      email,
      password,
      otpHash: hashOtp(otp),
      otpExpiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0
    };

    await sendOtpEmail(email, otp);

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).send("Unable to start verification");
      }

      res.redirect("/verify-otp");
    });

  } catch (err) {
    console.error("Registration OTP error:", err);
    res.status(500).send("Unable to send OTP");
  }
});

app.post("/login", async (req, res, next) => {
    
   passport.authenticate("local", (err, user, info) => {
       if (err) {
           console.error("Auth error:", err);
           return next(err);
       }
       if (!user) {
           console.log("No user found:", info);
           return res.redirect("/login");
       }

       req.login(user, (err) => {
           if (err) {
               console.error("Login error:", err);
               return next(err);
           }

           
           req.session.save((err) => {
               if (err) return next(err);
               console.log("✅ Logged in, userId:", user._id);
               res.redirect("/secrets");
           });
       });
   })(req, res, next);
});

app.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) return next(err);

      res.clearCookie("connect.sid"); // important
      return res.json({ success: true });
    });
  });
});

    


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 



