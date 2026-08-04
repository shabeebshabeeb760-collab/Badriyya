import "./Header.css";
import { FaBars, FaBell, FaUserCircle } from "react-icons/fa";

function Header({ setOpen }) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="header">

      {/* Hamburger Menu */}
      <button
        className="menu-btn"
        onClick={() => setOpen(true)}
      >
        <FaBars />
      </button>

      {/* Title */}
      <div className="header-left">
        <h1>Finance Dashboard</h1>
        <p>{today}</p>
      </div>

      {/* Search */}
      <div className="header-search">
        <input
          type="text"
          placeholder="Search..."
        />
      </div>

      {/* Right */}
      <div className="header-right">

        <div className="notification">
          <FaBell />
          <span>3</span>
        </div>

        <div className="admin">

          <FaUserCircle className="admin-icon" />

          <div>
            <h4>Admin</h4>
            <p>Finance Manager</p>
          </div>

        </div>

      </div>

    </header>
  );
}

export default Header;