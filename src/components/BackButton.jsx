import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./BackButton.css";

function BackButton({ text = "Back" }) {
  const navigate = useNavigate();

  return (
    <button className="back-button" onClick={() => navigate(-1)}>
      <FaArrowLeft />
      <span>{text}</span>
    </button>
  );
}

export default BackButton;