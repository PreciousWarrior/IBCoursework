import Button from "react-bootstrap/Button";

// https://stackoverflow.com/a/8888498
function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? "0" + minutes : minutes;
  var strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
}

//https://stackoverflow.com/a/12409344
function formatDDMMYY(date) {
  const yyyy = date.getFullYear();
  const yy = parseInt(yyyy.toString().slice(-2));
  let mm = date.getMonth() + 1;
  let dd = date.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  return `${dd}/${mm}/${yy}`;
}
export default function LateArrival({ arrival, onDelete }) {
  const arrivalDateTime = new Date(arrival.arrivalTime);
  return (
    <h5 style={{ marginBottom: 15 }}>
      {" "}
      Arrived late into <b>{arrival.building}</b> at{" "}
      <b>{formatAMPM(arrivalDateTime)}</b> on{" "}
      <b>{formatDDMMYY(arrivalDateTime)}</b> because of <b>{arrival.reason}</b>.{" "}
      <Button onClick={onDelete} variant="link">
        Remove
      </Button>
    </h5>
  );
}
