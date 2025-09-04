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
import Dashboardemp from './component/employeepage/dashboard_employee';
import Listcustomer from './component/employeepage/listcustomer';
import Listemployee from './component/employeepage/listemployee';
import Mailbox from './component/pages/usermailbox';
import Infopage from './component/pages/userInfo';



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
        <Route path="/login/mailbox" element={<Mailbox />} />
        <Route path="/auth/employee/menu" element={<Managemenu />} />
        <Route path="/auth/employee/managepoint" element={<ManagePoint />} />
        <Route path="/login/profile" element={<Infopage />} />
        <Route path="/auth/employee/dashboard" element={<Dashboardemp />} />
        <Route path="/auth/employee/customers" element={<Listcustomer />} />
        <Route path="/auth/employee/employees" element={<Listemployee />} />
      </Routes>

  );
}

export default App;
