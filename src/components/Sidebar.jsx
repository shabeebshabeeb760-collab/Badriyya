import "./Sidebar.css";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

import {
  FaHome,
  FaMoneyBillWave,
  FaWallet,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTimes,
} from "react-icons/fa";

function Sidebar({ open, setOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    {
      name: "Dashboard",
      icon: <FaHome />,
      path: "/dashboard",
    },
    {
      name: "Income",
      icon: <FaMoneyBillWave />,
      path: "/income",
    },
    {
      name: "Expense",
      icon: <FaWallet />,
      path: "/expense",
    },
    {
      name: "Reports",
      icon: <FaChartBar />,
      path: "/reports",
    },
    {
      name: "Settings",
      icon: <FaCog />,
      path: "/settings",
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);

    if (window.innerWidth <= 768) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${open ? "open" : ""}`}>

        {/* Mobile Close Button */}
        <button
          className="close-btn"
          onClick={() => setOpen(false)}
        >
          <FaTimes />
        </button>

        {/* Logo */}
        <div className="logo">
          <img
            src={logo}
            alt="BADRIYYA"
            className="sidebar-logo"
          />

          <h2>BADRIYYA</h2>

          <p>Finance Management System</p>
        </div>

        {/* Menu */}
        <ul>
          {menu.map((item) => (
            <li
              key={item.path}
              className={
                location.pathname === item.path
                  ? "active"
                  : ""
              }
              onClick={() => handleNavigate(item.path)}
            >
              {item.icon}
              <span>{item.name}</span>
            </li>
          ))}
        </ul>

        {/* Logout */}
        <button
          className="logout"
          onClick={() => {
            navigate("/");

            if (window.innerWidth <= 768) {
              setOpen(false);
            }
          }}
        >
          <FaSignOutAlt />
          Logout
        </button>

      </div>
    </>
  );
}

export default Sidebar;