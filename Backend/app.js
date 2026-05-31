
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
// import bcrypt from "bcrypt";
import path from "path";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

const __dirname = path.resolve();
const saltRounds = 10;


const app = express();
const port = 3000;


app.set("view engine", "ejs");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");
// mongoose.set("useCreateIndex", true); // this for older version now it get removed.


const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  title: String,
  content: String,
  reminder: Date,
  labels: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Label"
    }
  ],
  isArchived: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
});

const Note = mongoose.model("Note", noteSchema);

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
    
});

userSchema.plugin(passportLocalMongoose.default);
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());









app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("home.ejs");
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

app.get("/labels", async (req, res) => {
    if(!req.session.userId){
        return res.status(401).send("Unauthorized");
    }
    const labels = await Label.find({ userId: req.session.userId });
    res.json(labels);
});

app.post("/addNote", async (req, res) => {
    try{
        if(!req.session.userId){
            return res.status(401).send("Unauthorized");
        }

        const { title, content, reminder } = req.body;

        if (!title || !content) {
            return res.status(400).send("empty note");
        }

       

        const user = await User.findById(req.session.userId);
        const {labelIds} = req.body;
       const note = new Note({
            title,
            content,
            reminder,
            userId: req.session.userId,
            labels: labelIds || [] // notes can store multiple labels
       });
        await note.save();
        res.status(201).send("Note added");

    } catch (error) {
        console.error("Error adding note:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/deleteNote", async (req, res) => {
    try {
        const { id } = req.body;

        if (!req.session.userId) {
            return res.status(401).send("Unauthorized");
        }

        await Note.findOneAndUpdate(
            { _id: id, userId: req.session.userId },
            { isDeleted: true }
        );

        res.status(200).send("Note deleted");
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.post("/notes", async (req, res) => {
    if(!req.session.userId){
        return res.status(401).send("Not Logged in");
    }
    const notes = await Note.find({
        userId: req.session.userId,
        isDeleted: false
   });
    res.json(notes);
});


app.post("/addLabel", async (req, res) => {
    try{
        if(!req.session.userId){
            return res.status(401).send("Unauthorized");
        }

        const { name } = req.body;

        

        const label = new Label({
            name,
            userId: req.session.userId
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
        if(!req.session.userId){
            return res.status(401).send("Unauthorized");
        }
        const {id} = req.body;
        // 1. delete label
        await Label.findOneAndDelete({
            _id: id,
            userId: req.session.userId
        });

        // 2. remove label from all notes
        await Note.updateMany(
            { userId: req.session.userId },
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
        if (!req.session.userId) {
            return res.status(401).send("Unauthorized");
        }

        const { id, name } = req.body;

        const updated = await Label.findOneAndUpdate(
            { _id: id, userId: req.session.userId },
            { name },
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.post("/register", async (req, res) => {
    
    try {
        // const {username, password } = req.body;
        // bcrypt.hash(password, saltRounds, async (err, hash) => {

        //     if (!username|| !password) {
        //     console.log("Fields are empty");
        //     return res.redirect("/register");
        //     }
        
        //     const newUser = new User({
        //         email: username,
        //         password: hash
        //     });

        //     // No callback here! Just await the promise.
        //     await newUser.save(); 
        //     req.session.userId = newUser._id;
        //     res.redirect("/secrets");
        // });
        
        // User.register({ username: req.body.username }, req.body.password, (err, user) => {
        //     if (err) {
        //         console.error("Error during registration:", err);
        //         return res.redirect("/register");
        //     }
        //     passport.authenticate("local")(req, res, () => {
        //         req.session.userId = user._id;
                
        //         req.session.save(() => {
        //             res.redirect("/secrets");
        //         });
        //     });
        // });

        const user = await User.register(
            { username: req.body.username },
            req.body.password
        );

        req.login(user, (err) => {
            if (err) {
                console.error(err);
                return res.redirect("/login");
            }

            req.session.userId = user._id;

            req.session.save(() => {
                console.log("✅ Registered + logged in");
                res.redirect("/secrets");
            });
        });

        
        
    } catch (err) {
        console.error("Error during registration:", err);
        res.redirect("/register");
    }
});

app.post("/login", async (req, res) => {
    
    // const username = req.body.username;
    // const password = req.body.password;

    //     if (!username || !password) {
    //         console.log("Login fields are empty");
    //         return res.redirect("/login");
    //     }

    try {
        // const foundUser = await User.findOne({ email: username });

        // if (foundUser) {
        //     bcrypt.compare(password, foundUser.password, (err, result) => {
        //         if (err) {
        //             console.error("Error comparing passwords:", err);
        //             return res.status(500).send("Server Error");
        //         }
        //         if (result) {
        //             req.session.userId = foundUser._id;
        //             res.redirect("/secrets");
        //         } else {
        //             res.send("Password incorrect.");
        //         }
        //     });
        // } else {
        //     res.send("User not found.");
        // }


        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, (err) => {
            if (err) {
                console.error("Error during login:", err);
                return res.status(500).send("Server Error");
            }
            passport.authenticate("local")(req, res, () => {
                req.session.userId = user._id;
                res.redirect("/secrets");
            });
        }); 


    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 



