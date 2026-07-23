import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import CreateArea from "./CreateArea";
import Note from "./Note";

function App() {

    const [searchText, setSearchText] = React.useState("");
    const [sortType, setSortType] = React.useState("newest");       
    const [notes, setNotes] = React.useState([]);
    

   

    React.useEffect(() => {
        const bc = new BroadcastChannel("auth");

        bc.onmessage = (event) => {
            if (event.data === "logout") {
            console.log("🔥 Logout from another tab");

            // clear UI state (optional but good)
            setNotes([]);

            // force logout
            window.location.href = "/login";
            }
        };

        return () => {
            bc.close(); // cleanup
        };
    }, []);
         
    const [labels, setLabels] = React.useState([]);
React.useEffect(() => {
    // load labels
    fetch("/labels", {
        credentials: "include"
    })
    .then(res => {
        if (res.status === 401) {
            window.location.href = "/login";
            return;
        }
        return res.json();
    })
    .then(data => {
        if (data) setLabels(data);
    });

    // load notes
    fetch("/notes", {
        method: "POST",
        credentials: "include"
    })
    .then(res => res.json())
    .then(data => setNotes(data));

}, []);

   const fetchNotes = () => {
    fetch("/notes", {
        method: "POST",
        credentials: "include",
        cache: "no-store"
    })
        .then(res => res.json())
        .then(data => {
        console.log("Fetched notes:", data);
        setNotes(data);
        });
    };

    React.useEffect(() =>{
        fetch("/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        })
        .then(res => {
            if (res.status === 401) {
                window.location.href = "/login"; // 🔥 force logout
                return;
            }
            return res.json();
        })
        .then(data => {
            if (data) setNotes(data);
        });
    }, []);

    // add auth-check polling
    React.useEffect(() => {
        const interval = setInterval(() => {
            fetch("/check-auth", {
            credentials: "include",
            cache: "no-store"
            })
            .then(res => {
            if (res.status === 401) {
                window.location.href = "/login";
            }
            });
        }, 5000); // every 5 sec

        return () => clearInterval(interval);
    }, []);

    function addNote(newNote) {
    fetch("/addNote", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(newNote)
    })
    .then(res => res.json())
    .then(() => {
        fetchNotes(); // 🔥 refresh from DB (correct state)
    });
}


 async function editNote(id, updatedNote) {
  const res = await fetch("/updateNote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      id,
      title: updatedNote.title,
      content: updatedNote.content,
      reminder: updatedNote.reminder
    })
  });

  const data = await res.json();

  if (!res.ok) {
    console.log("Update error:", data);
    alert(data.error || "Note update failed");
    return false;
  }

  await fetchNotes();

  return true;
}


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
                return prevNotes.map(note =>
                    note._id === id
                    ? { ...note, isDeleted: true, isArchived: false }
                    : note
                )
            });
            fetchNotes();
        });
    };
    const [active , setActive] = React.useState({
        type: "Notes",
        value: null
    });

    function pinNote(id, isPinned) {
        fetch("/pinNote", {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ id, isPinned })
        }).then(() => {
            setNotes(prevNotes =>
            prevNotes.map(note =>
                note._id === id
                ? { ...note, isPinned: !isPinned }
                : note
            )
            );

            fetchNotes();
        });
        }

    function archiveNote(id) {
        fetch("/archiveNote", {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ id })
        }).then(() => fetchNotes());
     }

    function restoreNote(id) {
    fetch("/restoreNote", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ id })
    }).then(() => fetchNotes());
    }

    function permanentDeleteNote(id) {
    fetch("/permanentDeleteNote", {
        method: "POST",
        headers: {
        "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ id })
    }).then(() => fetchNotes());
    }

    const filteredNotes = notes
  .filter(note => {
    if (active.type === "Notes") {
      return !note.isDeleted && !note.isArchived;
    }

    if (active.type === "Archive") {
      return !note.isDeleted && note.isArchived;
    }

    if (active.type === "Trash") {
      return note.isDeleted;
    }

    if (active.type === "Reminders") {
      return !note.isDeleted && !note.isArchived && note.reminder;
    }

    if (active.type === "label") {
      return (
        !note.isDeleted &&
        !note.isArchived &&
        note.labels?.some(l =>
          (l._id ? l._id : l).toString() === active.value
        )
      );
    }

    return true;
  })
  .filter(note => {
    const text = searchText.toLowerCase();

   return (
  note.title?.toLowerCase().includes(text) ||
  note.content?.toLowerCase().includes(text) ||
  note.summary?.toLowerCase().includes(text) ||
  note.labels?.some(label =>
    label.name?.toLowerCase().includes(text)
  ) ||
  note.aiLabels?.some(label =>
    label.toLowerCase().includes(text)
  ) ||
  note.priority?.toLowerCase().includes(text)
);
  })
  .sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
        return b.isPinned - a.isPinned;
    }
    if (sortType === "newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    if (sortType === "oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }

    if (sortType === "titleAZ") {
      return a.title.localeCompare(b.title);
    }

    if (sortType === "titleZA") {
      return b.title.localeCompare(a.title);
    }

    if (sortType === "reminder") {
      return new Date(a.reminder || 8640000000000000) - new Date(b.reminder || 8640000000000000);
    }
    if (sortType === "priority") {
      const order = {
        high: 3,
        normal: 2,
        low: 1
      };

      return (order[b.priority] || 0) - (order[a.priority] || 0);
    }
    return 0;
  });

  

    const pinnedNotes = filteredNotes.filter(note => note.isPinned);
    const otherNotes = filteredNotes.filter(note => !note.isPinned);

  return (
    <div >
        <Header
    active={active}
    setActive={setActive}
    refetchNotes={fetchNotes}
    searchText={searchText}
    setSearchText={setSearchText}
    sortType={sortType}
    setSortType={setSortType}
/>
       <CreateArea
  onAdd={addNote}
  selectedLabel={active.value}
   refetchNotes={fetchNotes}
/>
        <div className="notes-area">
  {pinnedNotes.length > 0 && (
    <section className="note-section pinned-section">
      <h3 className="section-title">PINNED</h3>

      <div className="pinned-container">
        {pinnedNotes.map(noteItem => (
          <Note
            key={noteItem._id}
            id={noteItem._id}
            title={noteItem.title}
            content={noteItem.content}
            reminder={noteItem.reminder}
            labels={active.type === "Notes" ? noteItem.labels : []}
            isPinned={noteItem.isPinned}
            onPin={pinNote}
            activeType={active.type}
            onDelete={deleteNote}
            onArchive={archiveNote}
            onRestore={restoreNote}
            onPermanentDelete={permanentDeleteNote}
            onEdit={editNote}
          />
        ))}
      </div>
    </section>
  )}

  {otherNotes.length > 0 && (
    <section className="note-section others-section">
      <h3 className="section-title">OTHERS</h3>

      <div className="others-container">
        {otherNotes.map(noteItem => (
          <Note
            key={noteItem._id}
            id={noteItem._id}
            title={noteItem.title}
            content={noteItem.content}
            reminder={noteItem.reminder}
            labels={active.type === "Notes" ? noteItem.labels : []}
            isPinned={noteItem.isPinned}
            onPin={pinNote}
            activeType={active.type}
            onDelete={deleteNote}
            onArchive={archiveNote}
            onRestore={restoreNote}
            onPermanentDelete={permanentDeleteNote}
            onEdit={editNote}
          />
        ))}
      </div>
    </section>
  )}
</div>
        <Footer />
    </div>
  );
}

export default App;