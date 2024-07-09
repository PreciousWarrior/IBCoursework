import React from "react";
import Button from "react-bootstrap/Button";
import { raw } from "../api";
import { toast } from "react-toastify";

export default function BuildingSelector({ onLogin, buildingName }) {
  const url = `buildings/${buildingName}.webp`;
  const buildingCapitalized =
    buildingName.charAt(0).toUpperCase() + buildingName.slice(1);
  return (
    <Button
      style={{ flexGrow: 1, flexBasis: 0, marginLeft: "5%", marginRight: "5%" }}
      variant="light"
      onClick={async () => {
        const result = prompt("Enter passkey...");
        if (result === null) {
          // User cancelled the prompt
          return;
        }
        if (result === "") {
          // User didn't enter anything
          return toast.info("Please enter a passkey.");
        }
        try {
          const response = await raw.get("/ping", {
            headers: { passkey: result },
          });
          toast.success("Logged in successfully!");
          localStorage.setItem("passkey", result);
          localStorage.setItem("building", buildingCapitalized);
          onLogin();
        } catch (error) {
          const code = error.response.status;
          if (code === 401) {
            return toast.error("Invalid passkey!");
          }
          return toast.error("An error occoured. Please try again later.");
        }
      }}
    >
      <img
        style={{ maxWidth: "100%", aspectRatio: 1.4 }}
        src={url}
        alt={buildingName}
      ></img>
      <h2 className="title">{buildingCapitalized}</h2>
    </Button>
  );
}
