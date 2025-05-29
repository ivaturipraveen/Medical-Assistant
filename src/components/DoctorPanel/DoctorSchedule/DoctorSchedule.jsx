import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { Clock, User2 } from 'lucide-react';
import './DoctorSchedule.css';

const DoctorSchedule = ({ doctor }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState({});
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointmentsAndSlots = async () => {
      try {
        setLoading(true);
        
        // Fetch booked appointments
        const appointmentsResponse = await fetch(
          `http://localhost:8000/appointments?doctor_id=${doctor.id}`
        );
        
        if (!appointmentsResponse.ok) {
          throw new Error(`Failed to fetch appointments: ${appointmentsResponse.statusText}`);
        }
        
        const appointmentsData = await appointmentsResponse.json();
        if (appointmentsData.error) {
          throw new Error(appointmentsData.error);
        }

        // Fetch available time slots
        const timeSlotsResponse = await fetch('http://localhost:8000/time-slot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            d_name: doctor.name
          })
        });

        if (!timeSlotsResponse.ok) {
          throw new Error(`Failed to fetch time slots: ${timeSlotsResponse.statusText}`);
        }

        const timeSlotsData = await timeSlotsResponse.json();

        // Group appointments by date
        const appointmentsByDate = {};
        (appointmentsData.appointments || []).forEach(apt => {
          const appointmentDate = new Date(apt.appointment_time);
          const dateStr = appointmentDate.toLocaleDateString('en-CA');
          
          if (!appointmentsByDate[dateStr]) {
            appointmentsByDate[dateStr] = [];
          }
          
          appointmentsByDate[dateStr].push({
            ...apt,
            status: apt.status || 'scheduled',
            patient_name: apt.patient_name || 'Patient',
            appointment_time: apt.appointment_time,
            formatted_time: appointmentDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          });
        });

        console.log('Appointments by date:', appointmentsByDate); // Debug log
        setAppointments(appointmentsByDate);
        setAvailableSlots(timeSlotsData.response || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (doctor?.id) {
      fetchAppointmentsAndSlots();
    }
  }, [doctor]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Helper function to check if a time slot is booked on the selected date
  const isSlotBooked = (timeSlot) => {
    const [startTime] = timeSlot.split(' - ');
    const selectedDateStr = selectedDate.toLocaleDateString('en-CA');
    const dateAppointments = appointments[selectedDateStr] || [];

    return dateAppointments.some(apt => {
      const aptDate = new Date(apt.appointment_time);
      const aptTime = aptDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return aptTime === startTime;
    });
  };

  // Helper function to get booked appointment for a slot
  const getBookedAppointment = (timeSlot) => {
    const [startTime] = timeSlot.split(' - ');
    const selectedDateStr = selectedDate.toLocaleDateString('en-CA');
    const dateAppointments = appointments[selectedDateStr] || [];

    return dateAppointments.find(apt => {
      const aptDate = new Date(apt.appointment_time);
      const aptTime = aptDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      return aptTime === startTime;
    });
  };

  if (loading) {
    return <div className="loading-state">Loading schedule...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Remove "Dr." prefix if present
  const doctorName = doctor.name.replace(/^Dr\.\s*/i, '');

  return (
    <div className="doctor-schedule">
      <div className="schedule-container">
        <div className="calendar-section">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            className="doctor-calendar"
            tileClassName={({ date }) => {
              const dateStr = date.toLocaleDateString('en-CA');
              const hasAppointments = appointments[dateStr]?.length > 0;
              return `calendar-tile ${hasAppointments ? 'has-appointments' : ''}`;
            }}
            showNeighboringMonth={true}
            minDetail="month"
            maxDetail="month"
            navigationLabel={({ date }) => 
              date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }
            formatShortWeekday={(locale, date) => 
              ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][date.getDay()]
            }
            formatDay={(locale, date) => date.getDate()}
          />
        </div>

        <div className="schedule-details">
          <h3>
            Schedule for {selectedDate.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>

          <div className="time-slots">
            {availableSlots.map((slot, index) => {
              const isBooked = isSlotBooked(slot);
              const bookedAppointment = isBooked ? getBookedAppointment(slot) : null;

              return (
                <div 
                  key={index} 
                  className={`time-slot ${isBooked ? 'booked' : 'available'}`}
                >
                  <div className="time">
                    <Clock size={16} />
                    {slot}
                  </div>
                  {isBooked && bookedAppointment && (
                    <div className="appointment-info">
                      <div className="patient-avatar">
                        <User2 size={16} />
                      </div>
                      <div className="patient-details">
                        <div className="patient-name">{bookedAppointment.patient_name}</div>
                        <span className={`status-badge ${bookedAppointment.status.toLowerCase()}`}>
                          {bookedAppointment.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedule; 