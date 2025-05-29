import React from 'react';
import { User2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import DoctorDashboard from './DoctorDashboard/DoctorDashboard';
import DoctorSchedule from './DoctorSchedule/DoctorSchedule';
import './DoctorPanel.css';

const DoctorPanel = ({ doctor }) => {
  // Remove "Dr." prefix if present for the welcome message
  const doctorName = doctor.name.replace(/^Dr\.\s*/i, '');
  const currentTime = new Date();
  const hours = currentTime.getHours();
  
  // Determine greeting based on time of day
  let greeting = "Good Morning";
  if (hours >= 12 && hours < 17) {
    greeting = "Good Afternoon";
  } else if (hours >= 17) {
    greeting = "Good Evening";
  }

  return (
    <div className="doctor-panel">
      <div className="welcome-section">
        <div className="welcome-content">
          <div className="doctor-avatar">
            <User2 size={40} />
          </div>
          <div className="welcome-text">
            <h1>{greeting}</h1>
          </div>
        </div>
        <div className="quick-info">
          <div className="info-card">
            <CalendarIcon size={20} />
            <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="info-card">
            <Clock size={20} />
            <span>{currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
          </div>
        </div>
      </div>
      
      <div className="panel-content">
        <DoctorDashboard doctor={doctor} />
        <DoctorSchedule doctor={doctor} />
      </div>
    </div>
  );
};

export default DoctorPanel; 