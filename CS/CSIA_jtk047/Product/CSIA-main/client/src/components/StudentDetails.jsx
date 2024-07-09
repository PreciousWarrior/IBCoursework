import "../styles/StudentDetails.css";
import { useEffect, useState } from "react";
import Warning from "./Warning";
import { authenticated, getImage } from "../api";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import LateArrival from "./LateArrival";
import { toast } from "react-toastify";

export default function StudentDetails({ id, building }) {
  const [student, setStudent] = useState(null);
  const [recordsChanged, setRecordsChanged] = useState(false); // to update UI after records change
  useEffect(() => {
    async function getData() {
      const response = await authenticated.get("/queryID", {
        // Fetch data from API
        params: { studentID: id },
      });
      setStudent(response.data); // Update state
    }
    getData();
  }, [id, recordsChanged]); // Dependency on recordsChanged and ID to update details when they are changed
  let reversedArrivals = [];
  if (student) reversedArrivals = [...student.lateArrivals].reverse();
  return (
    <div>
      {student ? ( // When student details are fetched, show them
        <div className="student-details">
          <h1>{student.name}</h1>
          {student.wasLateThrice ? (
            <div className="student-detail">
              <Warning
                timesLate={3}
                timePeriod={student.grade >= 9 ? "semester" : "month"}
              />
            </div>
          ) : (
            <></>
          )}
          <div className="student-detail middle-details">
            <div className="image-container">
              {" "}
              <img className="student-image" src={getImage(student.id)}></img>
            </div>

            <div className="right-details-container">
              <h3>
                <b>ID: </b>
                {student.id}
              </h3>
              <h3>
                <b>Grade: </b>
                {student.grade}
              </h3>
              <h3>
                <b>Section: </b>
                {student.section}
              </h3>
            </div>
          </div>
          <div className="student-detail">
            <div className="icon-container">
              <FontAwesomeIcon className="icon" icon={faClock} />{" "}
              <h3 style={{ marginBottom: 0 }}>Late Arrivals</h3>
            </div>
            <Button
              className="add-arrival"
              onClick={async () => {
                const reason = prompt("Enter a reason:");
                if (!reason) return toast.error("Please enter a reason");
                const confirmation = window.confirm(
                  `Add late arrival entry for ${student.name} into ${building} with reason: ${reason}?`
                );
                if (!confirmation) return toast.info("Entry cancelled.");
                try {
                  await authenticated.post("/arrival", {
                    studentID: id,
                    building,
                    reason,
                  });
                  toast.success("Entry added successfully!");
                  setRecordsChanged(!recordsChanged); // run effect function to update records
                } catch (error) {
                  toast.error("An error occoured.");
                }
              }}
            >
              Add
            </Button>
            {student.lateArrivals.length === 0 ? (
              <p>No late arrivals yet!</p>
            ) : (
              reversedArrivals.map((arrival) => (
                <LateArrival
                  onDelete={async () => {
                    const confirmation = window.confirm(
                      "Are you sure you want to remove this entry?"
                    );
                    if (!confirmation) return toast.info("Removal aborted");
                    try {
                      await authenticated.delete("/arrival", {
                        params: { studentID: id, arrivalID: arrival._id },
                      });
                      toast.success("Record removed successfully!");
                      setRecordsChanged(!recordsChanged); // Run effect to update records
                    } catch (error) {
                      toast.error("An error occoured.");
                    }
                  }}
                  key={arrival._id}
                  arrival={arrival}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <p>Loading...</p> // Otherwise display loading
      )}
    </div>
  );
}
