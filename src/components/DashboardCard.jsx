import { useNavigate } from "react-router-dom";
import "./DashboardCard.css";

function DashboardCard({ title, value, color, icon, path = "/dashboard" }) {
  const navigate = useNavigate();

  return (
    <div
      className="card"
      style={{ borderLeft: `6px solid ${color}` }}
      onClick={() => navigate(path)}
    >
      <div className="icon" style={{ background: color }}>
        {icon}
      </div>

      <div className="card-content">
        <h3>{title}</h3>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

export default DashboardCard;