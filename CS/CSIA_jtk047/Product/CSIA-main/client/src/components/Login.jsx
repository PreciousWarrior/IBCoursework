import BuildingSelector from "./BuildingSelector";
import "../styles/Login.css";

export default function Login({ onLogin }) {
  return (
    <div className="picker">
      <h1 className="heading">Login</h1>
      <div className="buildings">
        <BuildingSelector onLogin={() => onLogin()} buildingName="rosewood" />
        <BuildingSelector onLogin={() => onLogin()} buildingName="chestnut" />
      </div>
    </div>
  );
}
