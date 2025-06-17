import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MedicalLoginDashboard from './components/loginrightsidebar';
import ChatWidgetLauncher from './components/Button';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 relative">
        
        <Routes>
          <Route path="/" element={<MedicalLoginDashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>

        {/* Floating Chatbot launcher on all pages */}
        <ChatWidgetLauncher />
      </div>
    </Router>
  );
}

export default App;
