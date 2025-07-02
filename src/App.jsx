// App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserProfile from './component/pages/UserProfile';
import Login from './component/auth/login';
import Adminlogin from './component/auth/adminlogin';
import Employeeindex from './component/employeepage/employeeindex';
import Usermenu from './component/pages/usermenu';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login/userlogin" element={<UserProfile />} />
        <Route path="/auth/employee" element={<Employeeindex />} />
        <Route path="/auth/login" element={<Adminlogin />} />
        <Route path="/login/menu" element={<Usermenu />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
