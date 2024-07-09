import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import "../styles/Warning.css";

export default function Warning({ timesLate, timePeriod }) {
  return (
    <div className="warning-container">
      <div className="warning-icon">
        <FontAwesomeIcon icon={faExclamationCircle} />
      </div>
      <div className="warning-content">
        <p>
          Student has already been late at least {timesLate} times this{" "}
          {timePeriod}
        </p>
      </div>
    </div>
  );
}
