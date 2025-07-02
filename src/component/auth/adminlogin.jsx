import React, { useState } from "react";
import '../css/adminlogin.css'; // ปรับให้ตรงกับโฟลเดอร์ที่เก็บไฟล์ CSS
function AdminLogin() {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // เพิ่ม logic การ login ที่นี่
    alert(`User: ${user}\nPassword: ${password}`);
  };

  return (
    <form onSubmit={handleSubmit} className="admin-login-form">
      <h2>Admin Login</h2>
      <div>
        <label>Username:</label>
        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit">Login</button>
    </form>
  );
}

export default AdminLogin;