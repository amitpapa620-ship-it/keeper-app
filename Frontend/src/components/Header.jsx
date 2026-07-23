

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
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';

import {
  Drawer,
  IconButton,
  List
  
} from "@mui/material";

function Header({ active,
  setActive,
  refetchNotes,
  searchText,
  setSearchText,
  sortType,
  setSortType }) {


  
  

  const handleLogout = async () => {
    await fetch("/logout", {
      method: "POST",
      credentials: "include",
    });
    //broadcastChannel
     const bc = new BroadcastChannel("auth");
    bc.postMessage("logout");

    //  also clear immediately
    window.location.href = "/login";
   
    
  };
  const [open, setOpen] = React.useState(false);

  const [openLabels, setOpenLabels] = React.useState(false);
  const [labels, setLabels] = React.useState([]);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);

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
    { icon: <LightbulbIcon />, text: "Notes", action: () => setActive({ type: "Notes", value: null }) },
    { icon: <NotificationsActiveIcon />, text: "Reminders", action: () => setActive({ type: "Reminders", value: null }) },
    
  ];
  const bottomItems = [
    { icon: <EditIcon />, text: "Edit labels", action: () => setOpenLabels(true) },
    { icon: <ArchiveIcon />, text: "Archive", action: () => setActive({ type: "Archive", value: null }) },
    { icon: <DeleteIcon />, text: "Trash", action: () => setActive({ type: "Trash", value: null }) },
  ];

  return (
    <>
      <header className="flex items-center p-2 justify-between">
        <div className="flex items-center gap-4">

        <IconButton onClick={() => setOpen(!open)}>
          <MenuIcon />
        </IconButton>

        <h1 className="flex items-center gap-4"  >
          <HighlightIcon />
          <span className="text-3xl">Keeper</span>
        </h1>
        </div>
    <IconButton
  className="mobile-search-icon"
  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
>
  <SearchIcon />
</IconButton>
        {/* Search + Sort */}
  <div className={`header-tools flex items-center gap-6 ${mobileSearchOpen ? "mobile-search-open" : ""}`}>
    <div className="
      flex 
      items-center
      
      w-40
      sm:w-56
      md:w-72
      lg:w-120
      h-11
      
      rounded-full
      bg-[#ffd84d]
      shadow-md
      transition-all
      duration-200
      focus-within:bg-white
      focus-within:shadow-lg
    ">
    
  <div className= "flex items-center justify-center w-15"><SearchIcon className= " text-gray-600  " /></div>

    
    <input
      type="text"
      placeholder="Search notes..."
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      className="flex
        w-full
        h-full
        bg-transparent
        outline-none
        text-gray-700
        placeholder:text-gray-500"
    />
    </div>
    
      <div className="p-4 h-11 w-30 md:w-25 sm:w-20 flex items-center justify-center rounded-full bg-[#ffd84d] shadow-md transition-all duration-200 hover:shadow-lg">
        <select
      value={sortType}
      onChange={(e) => setSortType(e.target.value)}
      className="outline-none w-20 md:w-15 sm:w-10 bg-transparent text-gray-700 placeholder:text-gray-500"
      
    >
      <option value="" disabled>
        Filter
      </option>
      <option value="priority">Priority</option>
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="titleAZ">Title A-Z</option>
      <option value="titleZA">Title Z-A</option>
      <option value="reminder">Reminder Time</option>
    </select>
      </div>
  </div>

        <IconButton onClick={handleLogout}>
          <LogoutIcon />
        </IconButton>

      </header>

      {/* Sliding Drawer */}
      {/* <Drawer
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
      > */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 240,
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
                  refetchNotes={refetchNotes}
              />
    </>
  );
}



export default Header;