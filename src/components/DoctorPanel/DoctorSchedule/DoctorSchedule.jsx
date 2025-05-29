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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const fetchAppointmentsAndSlots = async (startDate, endDate, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      
      // Fetch booked appointments with date range
      const appointmentsResponse = await fetch(
        `https://medical-assistant1.onrender.com/appointments?doctor_id=${doctor.id}&start_date=${startDate.toISOString()}&end_date=${adjustedEndDate.toISOString()}`
      );
      
      if (!appointmentsResponse.ok) {
        throw new Error(`Failed to fetch appointments: ${appointmentsResponse.statusText}`);
      }
      
      const appointmentsData = await appointmentsResponse.json();

      if (appointmentsData.error) {
        throw new Error(appointmentsData.error);
      }

      // Only fetch time slots if they haven't been loaded yet
      if (!availableSlots.length) {
        const timeSlotsResponse = await fetch('https://medical-assistant1.onrender.com/Bland/time-slot', {
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
        setAvailableSlots(timeSlotsData.response || []);
      }

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

      setAppointments(appointmentsByDate);
      if (isInitialLoad) {
        setInitialLoadComplete(true);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // Initial load effect
  useEffect(() => {
    if (doctor?.id && !initialLoadComplete) {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      fetchAppointmentsAndSlots(start, end, true);
    }
  }, [doctor?.id]);

  // Month change effect
  useEffect(() => {
    if (doctor?.id && initialLoadComplete) {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      fetchAppointmentsAndSlots(start, end, false);
    }
  }, [currentMonth]);

  useEffect(() => {
    // Debug log when appointments or selected date changes
    const selectedDateStr = selectedDate.toLocaleDateString('en-CA');
    console.log('Current state:', {
      selectedDate: selectedDateStr,
      appointments: appointments[selectedDateStr],
      allAppointments: appointments
    });
  }, [selectedDate, appointments]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date.getMonth() !== currentMonth.getMonth() || 
        date.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(date);
    }
  };

  const handleMonthChange = (date) => {
    setCurrentMonth(date);
    if (selectedDate.getMonth() !== date.getMonth() || 
        selectedDate.getFullYear() !== date.getFullYear()) {
      setSelectedDate(date);
    }
  };

  // Helper function to check if a time slot is booked on the selected date
  const isSlotBooked = (timeSlot) => {
    const [startTime] = timeSlot.split(' - ');
    const selectedDateStr = selectedDate.toLocaleDateString('en-CA');
    const dateAppointments = appointments[selectedDateStr] || [];

    console.log('Checking slot:', {
      timeSlot,
      startTime,
      selectedDate: selectedDateStr,
      appointments: dateAppointments
    });

    return dateAppointments.some(apt => {
      const aptDate = new Date(apt.appointment_time);
      const aptHours = aptDate.getHours();
      const aptMinutes = aptDate.getMinutes();
      
      // Parse the slot time
      const [time, period] = startTime.split(' '); // e.g., "9:00 AM"
      const [hours, minutes] = time.split(':').map(Number);
      const is12Hour = period.toUpperCase() === 'PM';
      
      // Convert 12-hour slot time to 24-hour for comparison
      let slotHours = hours;
      if (is12Hour && hours !== 12) {
        slotHours += 12;
      } else if (!is12Hour && hours === 12) {
        slotHours = 0;
      }

      console.log('Time comparison:', {
        appointmentTime: `${aptHours}:${aptMinutes}`,
        slotTime: `${slotHours}:${minutes}`,
        matches: aptHours === slotHours && aptMinutes === minutes
      });

      return aptHours === slotHours && aptMinutes === minutes;
    });
  };

  // Helper function to get booked appointment for a slot
  const getBookedAppointment = (timeSlot) => {
    const [startTime] = timeSlot.split(' - ');
    const selectedDateStr = selectedDate.toLocaleDateString('en-CA');
    const dateAppointments = appointments[selectedDateStr] || [];

    return dateAppointments.find(apt => {
      const aptDate = new Date(apt.appointment_time);
      const aptHours = aptDate.getHours();
      const aptMinutes = aptDate.getMinutes();
      
      // Parse the slot time
      const [time, period] = startTime.split(' '); // e.g., "9:00 AM"
      const [hours, minutes] = time.split(':').map(Number);
      const is12Hour = period.toUpperCase() === 'PM';
      
      // Convert 12-hour slot time to 24-hour for comparison
      let slotHours = hours;
      if (is12Hour && hours !== 12) {
        slotHours += 12;
      } else if (!is12Hour && hours === 12) {
        slotHours = 0;
      }

      return aptHours === slotHours && aptMinutes === minutes;
    });
  };

  if (!initialLoadComplete && loading) {
    return <div className="loading-state">Loading schedule...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="doctor-schedule">
      <div className="schedule-container">
        <div className="calendar-section">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            onActiveStartDateChange={({ activeStartDate }) => handleMonthChange(activeStartDate)}
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
            view="month"
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