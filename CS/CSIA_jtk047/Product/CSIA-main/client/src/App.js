import "./App.css";
import "@fontsource-variable/montserrat";
import { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import { buildAuthenticated } from "./api";

export default function App() {
  useEffect(() => {
    document.body.style.backgroundColor = "#eeeeee";
    // stackoverflow.com/q/42464888
    // Background colour for app needs to be set here, when component mounts
  });
  const [loggedIn, setLoggedIn] = useState(
    Boolean(localStorage.getItem("passkey")) // Cast passkey to boolean to detect if user is logged in to initialize state
  );
  if (loggedIn) buildAuthenticated();
  return (
    <div className="App">
      {loggedIn ? (
        <Dashboard
          buildingName={localStorage.getItem("building")}
          onLogout={() => setLoggedIn(false)} // Toggle state when logging out
        /> // If logged in show dashboard
      ) : (
        // If not show login page
        <Login
          onLogin={() => {
            buildAuthenticated(); // add passkey to axios object
            setLoggedIn(true); // Toggle state when logging in
          }}
        />
      )}
      <ToastContainer />
    </div>
  );
}
