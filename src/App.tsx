import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation, useParams, useNavigate  } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MedicalLoginDashboard from './components/loginrightsidebar';
import Topbar from './components/Topbar';
import DoctorsGrid from './pages/Doctors/DocView';
import AppointmentsPage from './pages/Appointments/Appointments';
import PatientsPage from './pages/Patients/patients';
import DepartmentAppointments from './pages/Appointments/AppointmetDepa';
import ChatWidgetLauncher from './components/Button';
import DoctorAppointmentsPage from './pages/Appointments/DoctorAppointmentsPage';

function AppLayout() {
  const location = useLocation();
  const hideTopbar = location.pathname === '/' || location.pathname === '/chatWidget';

  return (
    <div className="w-screen h-screen bg-[#F4F8FB] overflow-x-hidden">
      {!hideTopbar && <Topbar />}

      <Routes>
        <Route path="/" element={<MedicalLoginDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/doctor" element={<DoctorsGrid />} />
        <Route path="/appointment" element={<AppointmentsPage />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/appointments/department/:deptName" element={<DepartmentAppointments/>} />
        <Route path="/" element={<DepartmentAppointments/>} />
        <Route path="/appointments/:doctorName" element={<DoctorAppointmentsRoute />} />
        <Route path="/chatWidget" element={<ChatWidgetLauncher/>} />
      </Routes>
    </div>
  );
}
function DoctorAppointmentsRoute() {
  const { doctorName } = useParams<{ doctorName: string }>(); 
  const navigate = useNavigate();  
  
  const handleCloseSidebar = () => {
    navigate(-1);  
  };

  return (
    <DoctorAppointmentsPage
      doctorName={doctorName || ""}  
      onClose={handleCloseSidebar}   
    />
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
