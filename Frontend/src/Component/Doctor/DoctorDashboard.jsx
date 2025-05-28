import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock } from 'lucide-react';
import Calendar from 'react-calendar';
import './Doctor.css'

const formatTimeSlot = (timeStr) => {
  try {
    const [startTime, endTime] = timeStr.split('-');
    if (!startTime || !endTime) throw new Error('Invalid time slot format');

    const [sH, sM] = startTime.split(':');
    const [eH, eM] = endTime.split(':');
    const startHourNum = +sH;
    const endHourNum = +eH;

    const to12 = (h, m) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${m.padStart(2,'0')} ${ampm}`;
    };

    const start12 = to12(startHourNum, sM);
    const end12 = to12(endHourNum, eM);

    const startPeriod = startHourNum >= 12 ? 'PM' : 'AM';
    const endPeriod = endHourNum >= 12 ? 'PM' : 'AM';
    if (startPeriod === endPeriod) {
      const [sh] = start12.split(' ');
      return `${sh}-${end12}`;
    }
    return `${start12}-${end12}`;
  } catch {
    return timeStr;
  }
};

export const DoctorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  
  // Get doctor info from navigation state or localStorage
  const [doctorInfo, setDoctorInfo] = useState(null);

  useEffect(() => {
    // Get doctor info from navigation state
    if (state && state.doctorName) {
      setDoctorInfo({
        name: state.doctorName,
        id: state.doctorId,
        department: state.doctorDepartment,
        email: state.doctorEmail
      });
    } else {
      // Fallback: try to get from localStorage if navigation state is lost
      const currentDoctor = localStorage.getItem('currentDoctor');
      const loggedInUser = localStorage.getItem('loggedInUser');
      
      if (currentDoctor) {
        const doctor = JSON.parse(currentDoctor);
        setDoctorInfo(doctor);
      } else if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        if (user.name) {
          setDoctorInfo({
            name: user.name,
            id: user.id,
            department: user.department,
            email: user.email
          });
        }
      } else {
        // If no doctor info available, redirect to login
        navigate('/');
      }
    }
  }, [state, navigate]);

  const doctorName = doctorInfo?.name;
  const doctorId = doctorInfo?.id;

  const [dashboardData, setDashboardData] = useState({ totalAppointments: 0, todayAppointments: [] });
  const [loading, setLoading] = useState({ appointments: true, slots: false });
  const [appointmentsCache, setAppointmentsCache] = useState({});
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    if (!doctorId) return;
    setLoading(prev => ({ ...prev, appointments: true }));
    setError(null);
    try {
      const res = await fetch(`https://medical-assistant1.onrender.com/appointments?doctor_id=${doctorId}`);
      if (!res.ok) throw new Error(res.statusText);
      const { appointments, error: apiErr } = await res.json();
      if (apiErr) throw new Error(apiErr);

      const byDate = {};
      appointments.forEach(apt => {
        const dt = new Date(apt.appointment_time);
        const dateStr = dt.toISOString().split('T')[0];
        const hh = dt.getHours().toString().padStart(2,'0');
        const mm = dt.getMinutes().toString().padStart(2,'0');
        const timeStr = `${hh}:${mm}`;
        const period = dt.getHours() >= 12 ? 'PM' : 'AM';
        const h12 = dt.getHours() % 12 || 12;
        const formatted = `${h12}:${mm} ${period}`;

        const obj = { ...apt, appointment_date: dateStr, formatted_time: formatted, time_for_comparison: timeStr, patient_name: apt.patient_name || 'Patient' };
        byDate[dateStr] = byDate[dateStr] || [];
        byDate[dateStr].push(obj);
      });
      setAppointmentsCache(byDate);

      const today = new Date().toISOString().split('T')[0];
      setDashboardData({ totalAppointments: appointments.length, todayAppointments: byDate[today] || [] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, appointments: false }));
    }
  }, [doctorId]);

  const fetchSlots = useCallback(async date => {
    if (!doctorId || !doctorName) return;
    if (date.getDay() === 0) {
      setTimeSlots([]);
      return;
    }
    setLoading(prev => ({ ...prev, slots: true }));
    setError(null);
    try {
      const res = await fetch('https://medical-assistant1.onrender.com/Bland/time-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ d_name: doctorName, date: date.toISOString().split('T')[0] })
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setTimeSlots(Array.isArray(data.response) ? data.response : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(prev => ({ ...prev, slots: false }));
    }
  }, [doctorId, doctorName]);

  useEffect(() => { 
    if (doctorId) {
      fetchAppointments(); 
    }
  }, [fetchAppointments, doctorId]);

  useEffect(() => { 
    if (doctorId && doctorName) {
      fetchSlots(selectedDate); 
    }
  }, [selectedDate, fetchSlots, doctorId, doctorName]);

  const selectedDateAppointments = useMemo(() => appointmentsCache[selectedDate.toISOString().split('T')[0]] || [], [selectedDate, appointmentsCache]);

  if (!doctorInfo) {
    return <div className="loading-doctor">Loading doctor information...</div>;
  }

  return (
    <div className="doctor-dashboard">
      <h1 className="welcome-text">Welcome, Dr. {doctorName}</h1>
      <div className="stats-row">
        {loading.appointments ? (
          <div className="loading-stats">Loading statistics...</div>
        ) : (
          <>
            <div className="stat-card">
              <CalendarDays size={24} />
              <div><h3>Total Appointments</h3><p className="stat-number">{dashboardData.totalAppointments}</p></div>
            </div>
            <div className="stat-card">
              <Clock size={24} />
              <div><h3>Today's Appointments</h3><p className="stat-number">{dashboardData.todayAppointments.length}</p></div>
            </div>
          </>
        )}
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="schedule-container">
        <div className="schedule-left">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileDisabled={({ date }) => date.getDay() === 0}
            tileContent={({ date }) => appointmentsCache[date.toISOString().split('T')[0]]?.length > 0 && <div className="calendar-dot" />}
          />
        </div>
        <div className="schedule-right">
          <h2>Schedule for {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
          {selectedDate.getDay() === 0 ? (
            <div className="sunday-message">Not available on Sundays</div>
          ) : loading.slots ? (
            <div className="loading-slots">Loading time slots...</div>
          ) : timeSlots.length === 0 ? (
            <div className="no-slots-message">No time slots available for this date</div>
          ) : (
            <div className="time-slots-grid">
              {timeSlots.map((slot, i) => (
                <div key={i} className={`time-slot ${selectedDateAppointments.some(a => a.time_for_comparison === slot) ? 'booked' : 'available'}`}>
                  {formatTimeSlot(slot)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};