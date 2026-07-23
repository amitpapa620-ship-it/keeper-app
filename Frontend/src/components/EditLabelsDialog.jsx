import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  List,
  ListItem
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

function EditLabelsDialog({ open, handleClose, labels, setLabels, refetchNotes }) {
  const [newLabel, setNewLabel] = React.useState("");

  

  // Delete label
  const deleteLabel = async (index) => {
        const labelToDelete = labels[index];

        await fetch("/deleteLabel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: labelToDelete._id })
      });

      setLabels(prev => prev.filter((_, i) => i !== index));

      // 🔥 refresh notes after label deletion
      refetchNotes();
 };

  // Edit label
  const editLabel = async (index, value) => {
    const label = labels[index];

    setLabels(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: value };
      return updated;
    });

    await fetch("/updateLabel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: label._id,
        name: value
      })
    });
  };

  const addLabel = async () => {
  if (!newLabel.trim()) return;

  const res = await fetch("/addLabel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newLabel })
  });

  const savedLabel = await res.json();

  setLabels(prev => [...prev, savedLabel]);
  setNewLabel("");
  
};

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Edit Labels</DialogTitle>

      <DialogContent>
        {/* Create new label */}
        <TextField
          label="Create new label"
          fullWidth
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addLabel()}
        />

        {/* Existing labels */}
        <List>
          {(labels || []).map((label, index) => (
            <ListItem key={label._id || index}>
                <TextField
                    value={label.name}
                    onChange={(e) => editLabel(index, e.target.value)}
                    
                />
                <IconButton onClick={() => deleteLabel(index)}>
                    <DeleteIcon />
                </IconButton>
                </ListItem>
            ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}

export default EditLabelsDialog;