import "../styles/Dashboard.css";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { useState } from "react";
import { authenticated } from "../api";
import StudentDetails from "./StudentDetails";
import { toast } from "react-toastify";

export default function Dashboard({ buildingName, onLogout }) {
  const [students, setStudents] = useState([]);
  const [activeStudent, setActiveStudent] = useState(null);
  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="searchbar">
          <Form.Control
            onChange={async (event) => {
              const value = event.target.value; // Get the data entered in search bar
              if (value === "") {
                return setStudents([]);
              }
              const result = await authenticated.get("queryName", {
                params: { name: value }, // Make API request to get students matching name
              });
              setStudents(result.data); // Update the state with response data
            }}
            type="text"
            placeholder="Search name..."
          />
        </div>
        {students.map((student) => (
          <div key={student.id} className="student-name-container">
            <Button
              onClick={() => {
                // Update state when students elected
                setActiveStudent(student);
              }}
              className="student-button"
              variant="light"
            >
              {student.name}
            </Button>
          </div>
        ))}
        <div className="logout">
          <Button
            onClick={() => {
              if (!window.confirm("Are you sure?")) return;
              localStorage.removeItem("passkey");
              toast.success("Logged out successfully!");
              onLogout();
            }}
            variant="danger"
            className="logout-button"
          >
            Logout
          </Button>
        </div>
      </div>
      <div className="details">
        {activeStudent ? (
          <StudentDetails building={buildingName} id={activeStudent.id} />
        ) : (
          <h1 className="placeholder-text">
            Search and select a student to begin
          </h1>
        )}
      </div>
    </div>
  );
}
