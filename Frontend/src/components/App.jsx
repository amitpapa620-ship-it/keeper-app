import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import CreateArea from "./CreateArea";
import Note from "./Note";
function App() {

    const [notes, setNotes] = React.useState([]);
    
    React.useEffect(() =>{
        fetch("/notes",{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        })
        .then(res => res.json())
        .then(data => setNotes(data));
    }, []);

    function addNote(newNote) {
            // 1. instantly update UI
    setNotes(prev => [newNote, ...prev]);

    // 2. send to backend
    fetch("/addNote", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(newNote)
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Failed to save note");
        }
        return res.text();
    })
    .catch(err => {
        console.log(err);

        // rollback if failed
        setNotes(prev =>
            prev.filter(note => note !== newNote)
        );
    });
    };

    function deleteNote(id) {
        fetch("/deleteNote", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({id})
        })
        .then( () => {
            setNotes(prevNotes => {
                return prevNotes.filter( noteItem=> {
                    return noteItem._id !== id;
                });
            });
        });
    };
    const [active , setActive] = React.useState({
        type: "Notes",
        value: null
    });

    const filteredNotes = notes.filter(note => {
    // ALL notes
    if (active.type === "Notes") return true;

    // reminders only
    if (active.type === "Reminders") return !!note.reminder;

    // label filter (IMPORTANT FIX)
    if (active.type === "label") {
        return note.labels?.some(id => id.toString() === active.value);
    }

    return true;
});

  return (
    <div>
        <Header active = {active} setActive = {setActive} />
       <CreateArea onAdd={addNote} selectedLabel={active} />
        {
            filteredNotes.map(noteItem => (
                <Note
                    key={noteItem._id}
                    id={noteItem._id}
                    title={noteItem.title}
                    content={noteItem.content}
                    reminder={noteItem.reminder}
                    onDelete={deleteNote}
                />
                ))
        }
        
        <Footer />
    </div>
  );
}

export default App;