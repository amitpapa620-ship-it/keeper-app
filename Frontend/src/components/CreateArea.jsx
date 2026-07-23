import React from "react";
import AddIcon from '@mui/icons-material/Add';
import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';
import MicIcon from "@mui/icons-material/Mic";
function CreateArea(props) {
    const [isExpanded, setExpanded] = React.useState(false);
    const [loadingAI, setLoadingAI] = React.useState(false);
    const [listening, setListening] = React.useState(false);


    function startVoiceTyping() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice typing is not supported in this browser. Use Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.start();
  setListening(true);

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;

    setNote(prev => ({
      ...prev,
      content: prev.content + " " + transcript
    }));
  };

  recognition.onerror = () => {
    setListening(false);
  };

  recognition.onend = () => {
    setListening(false);
  };
}

const [note, setNote] = React.useState({
  title: "",
  content: "",
  reminder: "",
  labelIds: [],
  summary: "",
  aiLabels: [],
  priority: "normal"
});

    function handleChange(event) {
        const {name, value} = event.target;
        setNote( prevNote => {
            return {
                
                 ...prevNote,
                 [name]: value
            }
        });

    };
    function handleSubmit(event) {
        if(note.title.trim() === "" || note.content.trim() === "") {
            return;
        }

        const noteToAdd = {
                title: note.title,
                content: note.content,
                reminder: note.reminder,
                summary: note.summary,
                aiLabels: note.aiLabels,
                priority: note.priority,
                labelIds: props.selectedLabel ? [props.selectedLabel] : []
            };
        fetch("/addNote", {

            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(noteToAdd)
        })
        .then(res => res.json())
        .then(savedNote => {

            // optional: keep instant UI update
            
            // 🔥 IMPORTANT: sync with DB (fixes label issue instantly)
            setTimeout(() => {
                props.refetchNotes();
            }, 100);
            
            setNote({
                title: "",
                content: "",
                reminder: "",
                labelIds: []
            });
        })
        
        event.preventDefault();
    };

    function expand() {
        setExpanded(true);
    };

    //ai handle function
   async function handleAI() {
  try {
    if (!note.content.trim()) {
      alert("Write note content first");
      return;
    }

    setLoadingAI(true);

    const res = await fetch("/ai/suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        title: note.title,
        content: note.content
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.log("AI backend error:", data);
      alert(data.error || "AI Suggest failed");
      return;
    }

    setNote(prev => ({
  ...prev,
  title: data.title || prev.title,
  summary: data.summary || "",
  aiLabels: data.labels || [],
  priority: data.priority || "normal"
}));

    console.log("AI Response:", data);
  } catch (err) {
    console.error("Frontend AI error:", err);
    alert(err.message);
  } finally {
    setLoadingAI(false);
  }
}

  return (
    <div className="create-area-wrapper">
      <form className="create-note">
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px"
            }}>
            <input
                name="title"
                placeholder="Title"
                value={note.title}
                onChange={handleChange}
                style={{ flex: 1 }}
            />

            <button
                type="button"
                onClick={handleAI}
                disabled={loadingAI}
                className="ai-btn"
            >
                ✨ <h4>AI help</h4>
            </button>

            <button
              type="button"
              onClick={startVoiceTyping}
              className="voice-btn"
            >
              <MicIcon />
            </button>

        </div>
        
        
        <textarea
          name="content"
          placeholder="Take a note..."
          value={note.content}
          onChange={handleChange}
          onClick={expand}
          rows={isExpanded ? 3 : 1}
        />
       {isExpanded && <input
          name="reminder"
          type="datetime-local"
          value={note.reminder}
          onChange={handleChange}
          onClick={expand}
        />}
        
        <Zoom in={isExpanded}>
            <Fab onClick={handleSubmit}
                className="add-note-btn"
                size = "small"
            >
                <AddIcon />
            </Fab>
        </Zoom>
        
      </form>
      <div>
            {note.summary && (
        <div className="ai-summary-box">
            <h4>AI Summary</h4>
            <p>{note.summary}</p>

            {note.aiLabels?.length > 0 && (
            <>
                <h4>AI Labels</h4>
                <div className="ai-labels">
                {note.aiLabels.map(label => (
                    <span key={label}>{label}</span>
                ))}
                </div>
            </>
            )}

            <h4>Priority</h4>
            <p>{note.priority}</p>
        </div>
        )}
        </div>
    </div>
  );
}

export default CreateArea;