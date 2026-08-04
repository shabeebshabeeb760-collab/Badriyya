import { useState } from "react";
import "./Settings.css";

function Settings() {
  const [schoolName, setSchoolName] = useState("DARUL ISLAM AL BADRIYYA");
  const [adminName, setAdminName] = useState("Admin");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const handleSave = () => {
    alert("Settings Saved Successfully");
  };

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h2>⚙️ Settings</h2>

        <label>Institution Name</label>
        <input
          type="text"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
        />

        <label>Admin Name</label>
        <input
          type="text"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
        />

        <label>Phone Number</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button onClick={handleSave}>Save Settings</button>
      </div>
    </div>
  );
}

export default Settings;