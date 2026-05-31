# 📝 Keeper App

A full-stack note-taking web application inspired by Google Keep, built with the **MERN-adjacent stack** (React + Node.js + Express). Users can create, edit, label, and delete notes in a clean, responsive interface.

---

## 🚀 Live Demo

> https://keeper-app-backend-usfg.onrender.com

---

## ✨ Features

- **Create Notes** — Add title + content notes instantly via the `CreateArea` component
- **Edit Notes** — Update existing notes through a dialog-based edit interface (`EditLabelsDialog`)
- **Delete Notes** — Remove notes with a single click
- **Label / Drawer System** — Organize notes by category using the `DrawerItem` sidebar
- **Responsive UI** — Clean layout with Header and Footer for full-page structure
- **REST API Backend** — Express.js server handles all CRUD operations
- **Persistent Storage** — Notes served and stored via the backend

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React (Vite) | Component-based UI framework |
| JSX | Templating and component structure |
| CSS3 | Styling and responsive layout |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API server |
| EJS / public | Server-side views and static assets |

---

## 📁 Project Structure

```
MY-APP/
├── Backend/
│   ├── app.js              # Express server entry point
│   ├── public/             # Static assets
│   ├── views/              # EJS templates (if SSR used)
│   └── package.json
│
└── Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── App.jsx             # Root component
    │   │   ├── CreateArea.jsx      # Note creation form
    │   │   ├── Note.jsx            # Individual note card
    │   │   ├── Header.jsx          # Top navigation bar
    │   │   ├── Footer.jsx          # Footer component
    │   │   ├── DrawerItem.jsx      # Sidebar label/drawer item
    │   │   └── EditLabelsDialog.jsx # Edit note dialog
    │   └── index.jsx               # React entry point
    ├── index.html
    └── vite.config.js
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation

```bash
# Clone the repo
git clone https://github.com/amitpapa620-ship-it/keeper-app.git
cd keeper-app

# Install Backend dependencies
cd Backend
npm install

# Install Frontend dependencies
cd ../Frontend
npm install
```

### Running the App

```bash
# Start Backend (from /Backend)
node app.js
# Server runs on http://localhost:3000

# Start Frontend (from /Frontend)
npm run dev
# React app runs on http://localhost:5173
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notes` | Fetch all notes |
| POST | `/notes` | Create a new note |
| PUT | `/notes/:id` | Update a note |
| DELETE | `/notes/:id` | Delete a note |

---

## 🙌 Author

**Amit Kumar**
- GitHub: [@amitpapa620-ship-it](https://github.com/amitpapa620-ship-it)
- Email: amitk.ug23.ee@nitp.ac.in

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
