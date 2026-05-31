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

function EditLabelsDialog({ open, handleClose, labels, setLabels }) {
  const [newLabel, setNewLabel] = React.useState("");

  

  // Delete label
  const deleteLabel = async (index) => {
  const labelToDelete = labels[index];

  await fetch("/deleteLabel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: labelToDelete._id || index
    })
  });

  const updated = labels.filter((_, i) => i !== index);
  setLabels(updated);
};

  // Edit label
  const editLabel = async (index, value) => {
  const label = labels[index];

  const updated = [...labels];
  updated[index] = { ...label, name: value };
  setLabels(updated);

  await fetch("/updateLabel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: label._id,
      name: value
    })
  });
  refreshLabels();
};

  const addLabel = async () => {
  if (newLabel.trim() === "") return;

  const res = await fetch("/addLabel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newLabel })
  });

  const savedLabel = await res.json();

  setLabels(prev => [...prev, savedLabel]);
  setNewLabel("");
  refreshLabels();
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
                    value={label.name || label}
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