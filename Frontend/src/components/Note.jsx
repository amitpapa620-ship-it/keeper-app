import React from "react";
import DeleteIcon from '@mui/icons-material/Delete';
function Note(props) {

    function handleClick() {
        props.onDelete(props.id);
    }
  return (
    <div className="note">
      <h1>{props.title}</h1>
      <p>{props.content}</p>

      {props.reminder && (
        <p style={{ fontSize: "12px", color: "gray" }}>
          ⏰ {new Date(props.reminder).toLocaleString()}
        </p>
      )}

      <button onClick={handleClick}>
        <DeleteIcon />
      </button>

    </div>
  );
}

export default Note;