import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AdminDashboard } from './Component/Admin/AdminDashboard'
import { DoctorDashboard } from './Component/Doctor/DoctorDashboard'
import { Loginpage } from './Component/Login/LoginPage';
import DoctorPanel from './Component/DoctorPanel/DoctorPanel';


const App = () => {
  const handleLogin = ({ type, user }) => {
  // Save to local/session storage
  localStorage.setItem('loggedIn', 'true');
  localStorage.setItem('userRole', type);
  localStorage.setItem('loggedInUser', JSON.stringify(user));
  sessionStorage.setItem('lastActivity', new Date().getTime());
};


  return (
    <Router>
      <Routes>
         <Route path="/" element={<Loginpage onLogin={handleLogin} />} />
         <Route path="/Admin" element={<AdminDashboard/>}/>
          <Route path="/Doctor" element={<DoctorDashboard/>}/>
          <Route path="/doctor2" element={<DoctorPanel/>}/>
      </Routes>
    </Router>
    )
}

export default App