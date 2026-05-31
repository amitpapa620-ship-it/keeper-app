import React from "react";
import {
  
    dividerClasses,
  ListItem,
  ListItemButton,
  ListItemText
} from "@mui/material";

function DrawerItem({ icon, text, open , action}) {

    function handleClick() {
        
            action();
        
    }

  return (
    <div className="drawer-item">
      <ListItem disablePadding>
        <ListItemButton
          onClick={handleClick}
         
        sx={{
          justifyContent: open ? "initial" : "center",
          px: 2
        }}
      >
        {icon}
        {open && <ListItemText primary={text} sx={{ ml: 2 }} />}
      </ListItemButton>
    </ListItem>
    </div>
    );
};

export default DrawerItem;