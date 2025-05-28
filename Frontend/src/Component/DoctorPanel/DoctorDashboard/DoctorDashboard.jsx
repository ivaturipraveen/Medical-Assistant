import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import './DoctorDashboard.css';

const DoctorDashboard = ({ doctor }) => {
  const [dashboardData, setDashboardData] = useState({
    totalAppointments: 0,
    todayAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!doctor?.id) {
          throw new Error('Doctor ID is not available');
        }

        const response = await fetch(`http://localhost:8000/appointments?doctor_id=${doctor.id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch appointments: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        // Process the data for dashboard
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = (data.appointments || [])
          .filter(apt => apt.appointment_time.startsWith(today));

        setDashboardData({
          totalAppointments: data.appointments?.length || 0,
          todayAppointments: todayAppts
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

  if (!doctor?.id) {
    return <div className="error-message">Doctor information not available</div>;
  }

  return (
    <div className="doctor-dashboard">
      <div className="stats-grid">
        {loading ? (
          <div className="loading-stats">Loading statistics...</div>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon">
                <CalendarDays size={24} />
              </div>
              <div className="stat-content">
                <h3>Total Appointments</h3>
                <p className="stat-number">{dashboardData.totalAppointments}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Clock size={24} />
              </div>
              <div className="stat-content">
                <h3>Today's Appointments</h3>
                <p className="stat-number">{dashboardData.todayAppointments.length}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard; 