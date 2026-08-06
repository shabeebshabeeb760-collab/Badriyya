import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSignInAlt,
  FaShieldAlt
} from "react-icons/fa";

import "../App.css";
import logo from "../assets/logo.png";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const login = () => {
    if (username === "Badriyya26" && password === "Badriyya99") {
      navigate("/dashboard");
    } else {
      alert("Invalid Username or Password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <img src={logo} alt="Logo" className="logo" />

        <div className="title">
          FINANCE MANAGEMENT SYSTEM
        </div>

        <div className="input-box">
          <FaUser className="icon" />
          <input
            type="text"
            placeholder="Username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="input-box">
          <FaLock className="icon" />

          <input
            type={show ? "text" : "password"}
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <span className="eye" onClick={() => setShow(!show)}>
            {show ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button className="login-btn" onClick={login}>
          <FaSignInAlt /> &nbsp; LOGIN
        </button>

        <div className="or">OR</div>

        <div className="secure">
          <FaShieldAlt />
          &nbsp; Secure Login | Your data is safe with us
        </div>

        <div className="footer">
          © 2026 DARUL ISLAM AL BADRIYYA. All rights reserved.
        </div>

      </div>
    </div>
  );
}

export default Login;