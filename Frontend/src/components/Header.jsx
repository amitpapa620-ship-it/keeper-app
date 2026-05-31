// import React from "react";
// import HighlightIcon from '@mui/icons-material/Highlight';
// import MenuIcon from '@mui/icons-material/Menu';

// function Header() {
//   return (
//     <header>
//       <h1> <MenuIcon /> <HighlightIcon /> 
//       Keeper</h1>
//     </header>
//   );
// }

// export default Header;

import React from "react";
import DrawerItem from "./DrawerItem";
import EditLabelsDialog from "./EditLabelsDialog";
import HighlightIcon from "@mui/icons-material/Highlight";
import MenuIcon from "@mui/icons-material/Menu";
import LabelIcon from '@mui/icons-material/Label';
import EditIcon from '@mui/icons-material/Edit';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  Drawer,
  IconButton,
  List
  
} from "@mui/material";

function Header({ active, setActive }) {
  const [open, setOpen] = React.useState(false);

  const [openLabels, setOpenLabels] = React.useState(false);
  const [labels, setLabels] = React.useState([]);

  const fetchLabels = () => {
    fetch("/labels")
      .then(res => res.json())
      .then(data => setLabels(data));
  };

  React.useEffect(() => {
    fetchLabels();
  }, []);

  React.useEffect(() => {
    localStorage.setItem("labels", JSON.stringify(labels));
  }, [labels]);


  const toggleDrawer = (state) => {
    setOpen(state);
  };

  const drawerWidth = 240;
  const collapsedWidth = 60;

  

  const mainItems = [
    { icon: <LightbulbIcon />, text: "Notes", action: () => setActive("Notes") },
    { icon: <NotificationsActiveIcon />, text: "Reminders", action: () => setActive("Reminders") },
    
  ];
  const bottomItems = [
    { icon: <EditIcon />, text: "Edit labels", action: () => setOpenLabels(true) },
    { icon: <ArchiveIcon />, text: "Archive", action: () => setActive("Archive") },
    { icon: <DeleteIcon />, text: "Trash", action: () => setActive("Trash") }
  ];

  return (
    <>
      <header style={{ display: "flex", alignItems: "center", padding: "10px" }}>
        <IconButton onClick={() => setOpen(!open)}>
          <MenuIcon />
        </IconButton>

        <h1 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <HighlightIcon />
          Keeper
        </h1>
      </header>

      {/* Sliding Drawer */}
      <Drawer
        variant="permanent"
        onMouseEnter={() => toggleDrawer(true)}
        onMouseLeave={() => toggleDrawer(false)}
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: open ? drawerWidth : collapsedWidth,
            transition: "0.3s",
            overflowX: "hidden",
            top: "60px", 
            height: "calc(100% - 60px)"
          }
        }}
      >
        <List>
         
          {/* STATIC MENU */}
          {mainItems.map((item, index) => (
            <DrawerItem
              key={index}
              icon={item.icon}
              text={item.text}
              open={open}
              action={item.action}
            />
          ))}

          {/* LABELS SECTION HEADER */}
          {labels.length > 0 && (
            <>
              {/* DYNAMIC LABELS */}
              {labels.map((label, index) => (
                <DrawerItem
                  key={`label-${index}`}
                  icon={<LabelIcon />}
                  text={label.name || label}
                  open={open}
                  action={() => setActive({ type: "label", value: label._id })}
                />
              ))}
            </>
          )}
            {bottomItems.map((item, index) => (
            <DrawerItem
              key={`bottom-${index}`}
              icon={item.icon}
              text={item.text}
              open={open}
              action={item.action}
            />
          ))}
        </List>
      </Drawer>
              <EditLabelsDialog
                
                open={openLabels}
                handleClose={() => setOpenLabels(false)}
                labels={labels}
                setLabels={setLabels}
                refetchLabels={fetchLabels}
              />
    </>
  );
}



export default Header;