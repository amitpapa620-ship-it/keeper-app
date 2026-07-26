import React from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import UnarchiveIcon from "@mui/icons-material/Unarchive";
import PushPinIcon from "@mui/icons-material/PushPin";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";



function formatForInput(mongoDateString) {
  if (!mongoDateString) return "";
  const date = new Date(mongoDateString);
  const localOffset = date.getTimezoneOffset() * 60000;
  const localTime = new Date(date.getTime() - localOffset);
  return localTime.toISOString().slice(0, 16);
}

function Note(props) {
  const [isEditing, setIsEditing] = React.useState(false);

  const [editData, setEditData] = React.useState({
    title: props.title,
    content: props.content,
    reminder: formatForInput(props.reminder)|| ""
  });

  function handleChange(e) {
    const { name, value } = e.target;

    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function saveEdit() {
  if (!editData.title.trim() || !editData.content.trim()) {
    alert("Title and content cannot be empty");
    return;
  }

    let finalReminder = editData.reminder;
    if (editData.reminder) {
      finalReminder = new Date(editData.reminder).toISOString();
    }

    const success = await props.onEdit(props.id, {
      ...editData,
      reminder: finalReminder
    });

    if (success) {
      setIsEditing(false);
    }
}

  function cancelEdit() {
    setEditData({
      title: props.title,
      content: props.content,
      reminder: formatForInput(props.reminder) || ""
    });

    setIsEditing(false);
  }

  return (
    <div className="note">
      {isEditing ? (
        <>
          <input
            name="title"
            value={editData.title}
            onChange={handleChange}
            className="edit-note-title"
          />

          <textarea
            name="content"
            value={editData.content}
            onChange={handleChange}
            className="edit-note-content"
          />

          <input
            name="reminder"
            type="datetime-local"
            value={editData.reminder}
            onChange={handleChange}
            className="edit-note-reminder"
          />

          <button  type ="button" onClick={saveEdit}>
            <SaveIcon />
          </button>

          <button onClick={cancelEdit}>
            <CloseIcon />
          </button>
        </>
      ) : (
        <>
          <h1>
            <span>{props.title}</span>
          </h1>

          <p>{props.content}</p>

          {props.reminder && (
            <p style={{ fontSize: "12px", color: "gray" }}>
              ⏰ {new Date(props.reminder).toLocaleString()}
            </p>
          )}

          {props.labels?.length > 0 && (
            <div>
              {props.labels.map(label => (
                <span
                  key={label._id}
                  className="border rounded-full"
                  style={{ padding: "5px" }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {props.activeType !== "Trash" && props.activeType !== "Archive" && (
            <button onClick={() => setIsEditing(true)}>
              <EditIcon  />
            </button>
          )}

          {props.activeType === "Trash" ? (
            <>
              <button onClick={() => props.onRestore(props.id)}>
                <RestoreFromTrashIcon />
              </button>

              <button onClick={() => props.onPermanentDelete(props.id)}>
                <DeleteForeverIcon />
              </button>
            </>
          ) : props.activeType === "Archive" ? (
            <>
              <button onClick={() => props.onRestore(props.id)}>
                <UnarchiveIcon />
              </button>

              <button onClick={() => props.onDelete(props.id)}>
                <DeleteIcon />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => props.onPin(props.id, props.isPinned)}>
                <PushPinIcon color={props.isPinned ? "warning" : "inherit"} />
              </button>

              <button onClick={() => props.onArchive(props.id)}>
                <ArchiveIcon />
              </button>

              <button onClick={() => props.onDelete(props.id)}>
                <DeleteIcon />
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default Note;