import React, { useState, useEffect } from 'react';
import { User2, Calendar as CalendarIcon, Clock, Activity } from 'lucide-react';
import DoctorSchedule from './DoctorSchedule/DoctorSchedule';
import './DoctorPanel.css';

const DoctorPanel = ({ doctor }) => {
  // Remove "Dr." prefix if present for the welcome message
  // const doctorName = doctor.name.replace(/^Dr\.\s*/i, '');
  const currentTime = new Date();
  const hours = currentTime.getHours();
  
  // Stats state
  const [dashboardData, setDashboardData] = useState({
    totalAppointments: 0,
    todayAppointments: [],
    completedAppointments: 0,
    upcomingAppointments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine greeting based on time of day
  let greeting = "Good Morning";
  if (hours >= 12 && hours < 17) {
    greeting = "Good Afternoon";
  } else if (hours >= 17) {
    greeting = "Good Evening";
  }

  // Fetch appointments data for stats
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!doctor?.id) {
          throw new Error('Doctor ID is not available');
        }

        const response = await fetch(`https://medical-assistant1.onrender.com/appointments?doctor_id=${doctor.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch appointments: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        // Process the data for dashboard
        const today = new Date().toISOString().split('T')[0];
        const allAppointments = data.appointments || [];
        const todayAppts = allAppointments.filter(apt => apt.appointment_time.startsWith(today));
        
        // Count completed and upcoming appointments
        const now = new Date();
        let completed = 0;
        let upcoming = 0;
        
        allAppointments.forEach(apt => {
          const aptDate = new Date(apt.appointment_time);
          if (aptDate < now) {
            completed++;
          } else {
            upcoming++;
          }
        });

        setDashboardData({
          totalAppointments: allAppointments.length,
          todayAppointments: todayAppts,
          completedAppointments: completed,
          upcomingAppointments: upcoming
        });
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (doctor?.id) {
      fetchAppointments();
    }
  }, [doctor?.id]);

  return (
    <>
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
      
      {/* Stats Overview Section */}
      {loading ? (
        <div className="loading-stats">Loading statistics...</div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card completed">
            <div className="stat-top">
              <div className="stat-icon">
                <Activity size={24} />
              </div>
              <div className="stat-number completed">{dashboardData.completedAppointments}</div>
            </div>
            <h3 className="stat-label">Completed Appointments</h3>
          </div>
          
          <div className="stat-card today">
            <div className="stat-top">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-number">{dashboardData.todayAppointments.length}</div>
            </div>
            <h3 className="stat-label">Today's Appointments</h3>
          </div>
          
          <div className="stat-card upcoming">
            <div className="stat-top">
              <div className="stat-icon">
                <CalendarIcon size={24} />
              </div>
              <div className="stat-number upcoming">{dashboardData.upcomingAppointments}</div>
            </div>
            <h3 className="stat-label">Upcoming Appointments</h3>
          </div>
          
          <div className="stat-card total">
            <div className="stat-top">
              <div className="stat-icon">
                <CalendarIcon size={24} />
              </div>
              <div className="stat-number">{dashboardData.todayAppointments.length + dashboardData.upcomingAppointments}</div>
            </div>
            <h3 className="stat-label">Total Appointments</h3>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="panel-content">
        <DoctorSchedule doctor={doctor} />
      </div>
    </>
  );
};

export default DoctorPanel; 