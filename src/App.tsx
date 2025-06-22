import './App.css';
import { useParams } from 'react-router-dom';

import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MedicalLoginDashboard from './components/loginrightsidebar';
import Topbar from './components/Topbar';
import DoctorsGrid from './pages/AdminPage/Doctors/DocView';
import AppointmentsPage from './pages/AdminPage/Appointments/Appointments';
import PatientsPage from './pages/AdminPage/Patients/patients';
import DepartmentAppointments from './pages/AdminPage/Appointments/AppointmetDepa';
import ChatWidgetLauncher from './components/Button';
import DoctorAppointmentsPage from './pages/AdminPage/Appointments/DoctorAppointmentsPage';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorTopbar from './components/DoctorTopbar'; // Import DoctorTopbar
import TodaysAppointment from './components/TodaysAppointments';
import PatientData from './components/PatientsData';
function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Check the user role from localStorage (if available)
  const userRole = localStorage.getItem('userRole');
  
  console.log('User Role:', userRole);  // Debugging: Check what value is in localStorage

  // If no role is found, we redirect to login page
  if (!userRole && location.pathname !== "/") {
    navigate('/'); // Redirect to login if no user role is found
    return null;
  }

  // Hide topbar on login or chat widget page
  const hideTopbar = location.pathname === '/' || location.pathname === '/chatWidget';

  // Conditionally render Topbar or DoctorTopbar based on the user role
  const renderTopbar = () => {
    if (userRole === 'admin') {
      return <Topbar />;
    } else if (userRole === 'doctor') {
      return <DoctorTopbar />;
    }
    return null; // If no role, you could return a default topbar or a login screen.
  };

  return (
    <div className="w-screen h-screen bg-[#F4F8FB] overflow-x-hidden">
      {!hideTopbar && renderTopbar()}

      <Routes>
        <Route path="/" element={<MedicalLoginDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/doctor" element={<DoctorsGrid />} />
        <Route path="/appointment" element={<AppointmentsPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/appointments/department/:deptName" element={<DepartmentAppointments />} />
        <Route path="/appointments/:doctorName" element={<DoctorAppointmentsRoute />} />
        <Route path="/chatWidget" element={<ChatWidgetLauncher />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="todaysAppointments" element={<TodaysAppointment/>}/>
        <Route path="patientData" element={<PatientData/>}/>
      </Routes>
    </div>
  );
}



function DoctorAppointmentsRoute() {
  const { doctorName } = useParams<{ doctorName: string }>();
  const navigate = useNavigate();

  const handleCloseSidebar = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <DoctorAppointmentsPage doctorName={doctorName || ""} onClose={handleCloseSidebar} />
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
