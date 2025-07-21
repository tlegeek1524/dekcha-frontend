// App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import UserProfile from './component/pages/UserProfile';
import Login from './component/auth/login';
import Adminlogin from './component/auth/adminlogin';
import Employeeindex from './component/employeepage/employeeindex'
import Usermenu from './component/pages/usermenu';
import Register from './component/auth/resgister';
import Managemenu from './component/employeepage/managemenu';
import ManagePoint from './component/employeepage/managePoint';

function App() {
  return (

      <Routes>
]]
        <Route path="/" element=  {<Login />} />
        <Route path="/login/userlogin" element={<UserProfile />} />
        <Route path="/auth/employee" element={<Employeeindex />} />
        <Route path="/auth/login" element={<Adminlogin />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/login/menu" element={<Usermenu />} />
        <Route path="/auth/employee/menu" element={<Managemenu />} />
        <Route path="/auth/employee/managepoint" element={<ManagePoint />} />
      </Routes>

  );
}

export default App;
