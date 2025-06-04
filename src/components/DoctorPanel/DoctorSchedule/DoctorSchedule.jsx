import React, { useState, useEffect, useCallback, useRef } from 'react';
import Calendar from 'react-calendar';
import { Clock, User2, X } from 'lucide-react';
import './DoctorSchedule.css';

const DoctorSchedule = ({ doctor }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingMonth, setIsLoadingMonth] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [datesWithAppointments, setDatesWithAppointments] = useState(new Set());
  const [showDoctorProfile, setShowDoctorProfile] = useState(false);
  
  // Cache for storing fetched slots data
  const [slotsCache, setSlotsCache] = useState(new Map());
  // Use ref for stable references to avoid circular dependencies
  const slotsCacheRef = useRef(slotsCache);
  // Ref to track initial render for month change effect
  const isInitialMonthRender = useRef(true);
  
  // Update ref when state changes
  useEffect(() => {
    slotsCacheRef.current = slotsCache;
  }, [slotsCache]);

  const formatDateForAPI = useCallback((date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return d.toISOString().split('T')[0];
  }, []);

  // Convert 24-hour time to 12-hour format
  const convertTo12Hour = (time) => {
    if (!time || typeof time !== 'string') {
      console.error('Invalid time format received:', time);
      return 'Invalid Time';
    }

    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const min = parseInt(minutes, 10);

      if (isNaN(hour) || isNaN(min)) {
        throw new Error('Invalid time format');
      }

      const date = new Date();
      date.setHours(hour, min, 0, 0);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).toUpperCase();
    } catch (error) {
      console.error('Error converting time:', error);
      return 'Invalid Time';
    }
  };

  // Convert 12-hour time to 24-hour format
  // Keeping this function for potential future use
  const _convertTo24Hour = (time12h) => {
    if (!time12h || typeof time12h !== 'string') {
      console.error('Invalid time format received:', time12h);
      return null;
    }

    try {
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);

      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid time format');
      }
      
      if (modifier === 'PM' && hours < 12) {
        hours += 12;
      }
      if (modifier === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('Error converting time:', error);
      return null;
    }
  };

  const processBookedSlots = useCallback((bookedSlotsList, appointmentsData) => {
    return bookedSlotsList.map(slot => {
      const appointments = appointmentsData.appointments || [];
      const appointment = appointments.find(apt => {
        const aptTime = apt.appointment_time.split(' ')[1];
        return aptTime === slot;
      });
          
      return {
        time: slot,
        patientName: appointment ? appointment.patient_name : 'Patient'
      };
    });
  }, []);

  // Function to get cached data or fetch if not available
  const getSlots = useCallback(async (date) => {
    if (!doctor?.id) return { availableSlots: [], bookedSlots: [] };
    
    const dateStr = formatDateForAPI(date);
    const cacheKey = `${doctor.id}-${dateStr}`;
    
    // Check cache first using ref to avoid dependency issues
    if (slotsCacheRef.current.has(cacheKey)) {
      return slotsCacheRef.current.get(cacheKey);
    }
    
    try {
      const [slotsResponse, appointmentsResponse] = await Promise.all([
        fetch(`https://medical-assistant1.onrender.com/slots?doctor_id=${doctor.id}&date=${dateStr}`),
        fetch(`https://medical-assistant1.onrender.com/appointments?doctor_id=${doctor.id}&date=${dateStr}`)
      ]);
      
      if (!slotsResponse.ok || !appointmentsResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [slotsData, appointmentsData] = await Promise.all([
        slotsResponse.json(),
        appointmentsResponse.json()
      ]);
      
      const result = {
        availableSlots: slotsData.available_slots || [],
        bookedSlots: processBookedSlots(slotsData.booked_slots || [], appointmentsData)
      };
      
      // Update cache
      setSlotsCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, result);
        // Keep cache size reasonable (store max 31 days)
        if (newCache.size > 31) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        return newCache;
      });
      
      return result;
    } catch (error) {
      console.error(`Error fetching slots for ${dateStr}:`, error);
      return { availableSlots: [], bookedSlots: [] };
    }
  }, [doctor?.id, formatDateForAPI, processBookedSlots]);

  // Function to check if a date is in the past (before today)
  const isDateInPast = useCallback((dateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for proper comparison
    
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate < today;
  }, []);

  // Optimized month appointments fetching
  const fetchMonthAppointments = useCallback(async () => {
    if (!doctor?.id) return;
    
    try {
      setIsLoadingMonth(true);
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      // Fetch first week immediately to show some data
      const firstWeekDates = [];
      const currentDate = new Date(startDate);
      for (let i = 0; i < 7 && currentDate <= endDate; i++) {
        firstWeekDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Process first week
      const appointmentDates = new Set();
      await Promise.all(
        firstWeekDates.map(async (date) => {
          const dateStr = formatDateForAPI(date);
          
          // Skip past dates
          if (isDateInPast(dateStr)) {
            return;
          }
          
          try {
            const slots = await getSlots(date);
            if (slots.bookedSlots.length > 0) {
              appointmentDates.add(dateStr);
            }
          } catch (error) {
            console.error(`Error fetching slots for ${dateStr}:`, error);
          }
        })
      );
      
      // Update UI with first week data
      setDatesWithAppointments(appointmentDates);
      
      // Then fetch the rest of the month in the background
      const remainingDates = [];
      while (currentDate <= endDate) {
        remainingDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Process remaining dates in batches of 5
      const batchSize = 5;
      for (let i = 0; i < remainingDates.length; i += batchSize) {
        const batch = remainingDates.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (date) => {
            const dateStr = formatDateForAPI(date);
            
            // Skip past dates
            if (isDateInPast(dateStr)) {
              return;
            }
            
            try {
              const slots = await getSlots(date);
              if (slots.bookedSlots.length > 0) {
                appointmentDates.add(dateStr);
                setDatesWithAppointments(new Set(appointmentDates));
              }
            } catch (error) {
              console.error(`Error fetching slots for ${dateStr}:`, error);
            }
          })
        );
      }
      
    } catch (err) {
      console.error('Error fetching month appointments:', err);
      setError(err.message);
    } finally {
      setIsLoadingMonth(false);
    }
  }, [currentMonth, doctor?.id, formatDateForAPI, getSlots, isDateInPast]);

  const handleDateChange = useCallback(async (date) => {
    setSelectedDate(date);
    setIsLoadingSlots(true);
    setError(null);
    
    try {
      const slots = await getSlots(date);
      
      // If the date is in the past, show no available slots
      const dateStr = formatDateForAPI(date);
      if (isDateInPast(dateStr)) {
        setAvailableSlots([]);
        // Still show booked slots for historical reference
        setBookedSlots(slots.bookedSlots);
      } else {
        setAvailableSlots(slots.availableSlots);
        setBookedSlots(slots.bookedSlots);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Failed to load slots. Please try again.');
    } finally {
      setIsLoadingSlots(false);
    }
  }, [getSlots, formatDateForAPI, isDateInPast]);

  const handleMonthChange = useCallback((date) => {
    // Check if month actually changed to avoid unnecessary updates
    if (currentMonth.getMonth() === date.getMonth() && 
        currentMonth.getFullYear() === date.getFullYear()) {
      return; // Skip if the month hasn't changed
    }
    
    const newDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      1
    ));
    setCurrentMonth(newDate);
  }, [currentMonth]);

  // Initial load effect - fetch current week's data first
  useEffect(() => {
    if (doctor?.id) {
      handleDateChange(new Date());
      fetchMonthAppointments();
    }
    // Only run this effect when doctor ID changes
  }, [doctor?.id, handleDateChange, fetchMonthAppointments]);

  // Effect to fetch new month data when month changes
  useEffect(() => {
    // Skip the initial render since the first effect already handles it
    if (isInitialMonthRender.current) {
      isInitialMonthRender.current = false;
      return;
    }
    
    if (doctor?.id && !isLoadingMonth) {
      fetchMonthAppointments();
    }
  }, [doctor?.id, currentMonth, fetchMonthAppointments, isLoadingMonth]);

  // Add doctor professional details
  const getDoctorProfessionalDetails = () => {
    return {
      ...doctor,
      qualification: "MD, MBBS",
      specialization: doctor.department,
      experience: "10+ years",
      languages: ["English", "Hindi"],
      education: [
        {
          degree: "MBBS",
          institution: "All India Institute of Medical Sciences",
          year: "2010"
        },
        {
          degree: "MD",
          institution: "Post Graduate Institute of Medical Education and Research",
          year: "2013"
        }
      ],
      certifications: [
        "Board Certified in Internal Medicine",
        "Advanced Cardiac Life Support (ACLS)",
        "Basic Life Support (BLS)"
      ],
      availableTimings: {
        monday: ["09:00 AM - 01:00 PM", "05:00 PM - 09:00 PM"],
        tuesday: ["09:00 AM - 01:00 PM", "05:00 PM - 09:00 PM"],
        wednesday: ["09:00 AM - 01:00 PM"],
        thursday: ["09:00 AM - 01:00 PM", "05:00 PM - 09:00 PM"],
        friday: ["09:00 AM - 01:00 PM", "05:00 PM - 09:00 PM"],
        saturday: ["09:00 AM - 02:00 PM"]
      },
      expertise: [
        "General Consultation",
        "Preventive Care",
        "Chronic Disease Management",
        "Emergency Medicine"
      ],
      registrationNumber: "MCI-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
      about: "A dedicated healthcare professional with extensive experience in providing comprehensive medical care. Committed to delivering patient-centered treatment and maintaining the highest standards of medical practice."
    };
  };

  // Doctor Profile Modal Component
  const DoctorProfileModal = () => {
    if (!showDoctorProfile) return null;
    
    const professionalDetails = getDoctorProfessionalDetails();
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    return (
      <div className="modal-overlay" onClick={() => setShowDoctorProfile(false)}>
        <div className="doctor-profile-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={() => setShowDoctorProfile(false)}>
            <X size={24} />
          </button>
          
          <div className="doctor-profile-header">
            <div className="doctor-profile-avatar">
              <User2 size={32} />
            </div>
            <div className="doctor-profile-info">
              <h2>{doctor.name}</h2>
              <p className="doctor-specialization">{professionalDetails.specialization}</p>
              <p className="doctor-qualification">{professionalDetails.qualification}</p>
            </div>
          </div>

          <div className="doctor-profile-content">
            <div className="profile-section">
              <h3>About</h3>
              <p>{professionalDetails.about}</p>
            </div>

            <div className="profile-section">
              <h3>Professional Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Experience</span>
                  <span className="detail-value">{professionalDetails.experience}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Registration No.</span>
                  <span className="detail-value">{professionalDetails.registrationNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Languages</span>
                  <span className="detail-value">{professionalDetails.languages.join(", ")}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Education & Training</h3>
              <div className="education-list">
                {professionalDetails.education.map((edu, index) => (
                  <div key={index} className="education-item">
                    <div className="education-degree">{edu.degree}</div>
                    <div className="education-institution">{edu.institution}</div>
                    <div className="education-year">{edu.year}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-section">
              <h3>Certifications</h3>
              <ul className="certifications-list">
                {professionalDetails.certifications.map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </div>

            <div className="profile-section">
              <h3>Areas of Expertise</h3>
              <div className="expertise-tags">
                {professionalDetails.expertise.map((exp, index) => (
                  <span key={index} className="expertise-tag">{exp}</span>
                ))}
              </div>
            </div>

            <div className="profile-section">
              <h3>Available Timings</h3>
              <div className="timings-grid">
                {weekDays.map(day => (
                  <div key={day} className="timing-item">
                    <div className="timing-day">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
                    <div className="timing-slots">
                      {professionalDetails.availableTimings[day]?.map((time, index) => (
                        <span key={index} className="timing-slot">{time}</span>
                      )) || <span className="timing-closed">Closed</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoadingMonth && datesWithAppointments.size === 0) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading schedule...</p>
      </div>
    );
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
              const dateStr = formatDateForAPI(date);
              const hasAppointments = datesWithAppointments.has(dateStr);
              const isSelected = dateStr === formatDateForAPI(selectedDate);
              const isPast = isDateInPast(dateStr);
              return `calendar-tile ${hasAppointments ? 'has-appointments' : ''} ${isSelected ? 'selected-date' : ''} ${isPast ? 'past-date' : ''}`;
            }}
            tileDisabled={() => {
              // Keep all dates enabled for viewing past appointments
              return false;
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
            {isDateInPast(formatDateForAPI(selectedDate)) && (
              <span className="past-date-indicator"> (Past Date)</span>
            )}
          </h3>

          {isLoadingSlots ? (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <p>Loading slots...</p>
            </div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : selectedDate.getDay() === 0 || selectedDate.getDay() === 6 ? (
            <div className="weekend-message">
              <div className="weekend-icon">
                <Clock size={24} />
              </div>
              <h4>Weekend - Day Off</h4>
              <p>No appointments are scheduled on weekends.</p>
              <p>Please select a weekday to view available slots.</p>
            </div>
          ) : isDateInPast(formatDateForAPI(selectedDate)) ? (
            <div className="time-slots">
              {bookedSlots.length > 0 ? (
                <>
                  {/* <div className="past-date-message">
                    <p>This is a past date. Showing historical appointments.</p>
                  </div> */}
                  {bookedSlots
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((slot, index) => {
                      const formattedTime = convertTo12Hour(slot.time);
                      return (
                        <div 
                          key={index} 
                          className="time-slot booked past"
                        >
                          <div className="time">
                            <Clock size={16} />
                            {formattedTime}
                          </div>
                          <div className="appointment-info">
                            <div className="patient-avatar">
                              <User2 size={16} />
                            </div>
                            <div className="patient-details">
                              <div className="patient-name">
                                {slot.patientName || 'Patient'}
                              </div>
                              <span className="status-badge completed">
                                Completed
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                  })}
                </>
              ) : (
                <div className="no-slots-message">
                  No appointment records on this  date.
                </div>
              )}
            </div>
          ) : (
          <div className="time-slots">
            {[...availableSlots, ...bookedSlots]
                .filter(slot => typeof slot === 'string' || (typeof slot === 'object' && slot.time))
                .sort((a, b) => {
                  const timeA = typeof a === 'string' ? a : a.time;
                  const timeB = typeof b === 'string' ? b : b.time;
                  return timeA.localeCompare(timeB);
                })
              .map((slot, index) => {
                  const isBooked = typeof slot === 'object';
                  const timeValue = isBooked ? slot.time : slot;
                  const formattedTime = convertTo12Hour(timeValue);

                return (
                  <div 
                    key={index} 
                    className={`time-slot ${isBooked ? 'booked' : 'available'}`}
                  >
                    <div className="time">
                      <Clock size={16} />
                      {formattedTime}
                    </div>
                    {isBooked && (
                      <div className="appointment-info">
                        <div className="patient-avatar">
                          <User2 size={16} />
                        </div>
                        <div className="patient-details">
                          <div className="patient-name">
                              {slot.patientName || 'Patient'}
                          </div>
                          <span className="status-badge scheduled">
                            Scheduled
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
            })}
            {availableSlots.length === 0 && bookedSlots.length === 0 && (
              <div className="no-slots-message">
                No available slots defined for this day.
              </div>
            )}
          </div>
          )}
        </div>
      </div>
      
      <DoctorProfileModal />
    </div>
  );
};

export default DoctorSchedule; 