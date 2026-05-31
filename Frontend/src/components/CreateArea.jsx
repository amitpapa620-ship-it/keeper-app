import React from "react";
import AddIcon from '@mui/icons-material/Add';
import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';
function CreateArea(props) {
    const [isExpanded, setExpanded] = React.useState(false);
    const [note, setNote] = React.useState({
        title: "",
        content: "",
        reminder: "",
        labelIds: []
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
            labelIds: props.selectedLabel && typeof props.selectedLabel !== "string"? [props.selectedLabel] : []
        };
        fetch("/addNote", {

            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(noteToAdd)
        })
        .then(response => response.text())
        
        .then( () =>{

           props.onAdd(note);
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
  return (
    <div>
      <form className="create-note">
       {isExpanded && <input
          name="title"
          placeholder="Title"
          value={note.title}
          onChange={handleChange}
          onClick={expand}
        />} 
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
            <Fab onClick={handleSubmit}>
                <AddIcon />
            </Fab>
        </Zoom>
      </form>
    </div>
  );
}

export default CreateArea;