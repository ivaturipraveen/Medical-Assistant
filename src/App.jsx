import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarDays,
  Users,
  Stethoscope,
  LogOut,
  User2,
  LayoutDashboard,
  ArrowLeft,
  Search,
  Heart,
  Activity,
  Brain,
  Cross,
  UserRound,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
} from 'chart.js';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import './App.css';
import DoctorPanel from './components/DoctorPanel/DoctorPanel';
import AdminPanel from './components/AdminPanel/AdminPanel';
import LoginPage from './components/LoginPage/LoginPage';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const fetchWithRetry = async (url, retries = MAX_RETRIES) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
};

// Update department icons mapping
const departmentIcons = {
  'Cardiology': <Heart size={24} />,
  'Pulmonology': <Activity size={24} />,
  'Neurology': <Brain size={24} />,
  'Orthopedics': <Cross size={24} />,
  'Pediatrics': <UserRound size={24} />,
  'Ophthalmology': <Eye size={24} />,
};

// Add mock doctor data
const MOCK_DOCTORS = {
  'DOC001': {
    id: 'DOC001',
    name: 'John Smith',
    password: 'doc123',
    department: 'Cardiology',
    specialization: 'Cardiologist'
  }
};

export default function App() {
  const [categories, setCategories] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [loading, setLoading] = useState({ categories: true, doctors: false, appointments: false });
  const [error, setError] = useState('');

  const [showLogin, setShowLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [patientsCount, setPatientsCount] = useState(null);
  const [patientRateData, setPatientRateData] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [view, setView] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [patients, setPatients] = useState([]);

  // Add error handling state
  const [errors, setErrors] = useState({
    doctors: null,
    patients: null,
    appointments: null,
    dashboard: null
  });

  const [allDoctors, setAllDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [showTodayAppointments, setShowTodayAppointments] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    departmentStats: null,
    weeklyDistribution: null,
    doctorWorkload: null,
    ageDistribution: null,
  });

  const [loadingDashboardData, setLoadingDashboardData] = useState({
    departmentStats: false,
    weeklyDistribution: false,
    doctorWorkload: false,
    ageDistribution: false,
  });

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const [allAppointments, setAllAppointments] = useState([]);
  const [loadingAllAppointments, setLoadingAllAppointments] = useState(false);

  const [selectedDepartmentDoctor, setSelectedDepartmentDoctor] = useState('');

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState({
    morning: ['9:00 AM', '10:00 AM', '11:00 AM'],
    afternoon: ['2:00 PM', '3:00 PM', '4:00 PM']
  });

  // Add state for booking form visibility
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Add necessary states
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(16);
  const [morningSlots] = useState([
    { status: 'booked' },
    { status: 'unavailable' },
    { status: 'available' },
    { status: 'booked' }
  ]);
  const [afternoonSlots] = useState([
    { status: 'available' },
    { status: 'booked' },
    { status: 'available' },
    { status: 'unavailable' }
  ]);

  const [selectedViewDate, setSelectedViewDate] = useState(null);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);

  // Add new state for login management
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'doctor'
  const [userRole, setUserRole] = useState(null); // 'admin' or 'doctor'
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [doctorId, setDoctorId] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');

  const [doctorsList, setDoctorsList] = useState([]);

  // Add state for doctor profile modal
  const [selectedDoctorProfile, setSelectedDoctorProfile] = useState(null);

  // Add mock professional details for doctors
  const getDoctorProfessionalDetails = (doctor) => {
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

  // Add doctor profile modal component
  const DoctorProfileModal = ({ doctor, onClose }) => {
    if (!doctor) return null;
    
    const professionalDetails = getDoctorProfessionalDetails(doctor);
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="doctor-profile-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose}>×</button>
          
          <div className="doctor-profile-header">
            <div className="doctor-profile-avatar">
              <User2 size={48} />
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

  const [expandedDoctorId, setExpandedDoctorId] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  useEffect(() => {
    if (view === 'doctors') {
      const fetchDoctors = async () => {
        setLoading(prev => ({ ...prev, doctors: true }));
        setErrors(prev => ({ ...prev, doctors: null }));
        
        try {
          const data = await fetchWithRetry('https://medical-assistant1.onrender.com/doctors');
          // Filter out temp doctors
          const filteredDoctors = (data.doctors || []).filter(doctor => 
            !doctor.department.toLowerCase().includes('temp') && 
            !doctor.name.toLowerCase().includes('temp')
          );
          setAllDoctors(filteredDoctors);
          setFilteredDoctors(filteredDoctors);
        } catch (error) {
          console.error('Error loading doctors:', error);
          setErrors(prev => ({ ...prev, doctors: error.message }));
        } finally {
          setLoading(prev => ({ ...prev, doctors: false }));
        }
      };

      fetchDoctors();
      
      // Fetch departments for doctors
      const fetchDepartments = async () => {
        setLoadingDepartments(true);
        try {
          const response = await fetchWithRetry('https://medical-assistant1.onrender.com/categories');
          if (response.categories) {
            // Filter out temp departments
            const filteredDepartments = response.categories.filter(dept => 
              !dept.toLowerCase().includes('temp')
            );
            setDepartments(filteredDepartments);
          }
        } catch (error) {
          console.error('Error fetching departments:', error);
        } finally {
          setLoadingDepartments(false);
        }
      };
      
      fetchDepartments();
    }
  }, [view]);

  useEffect(() => {
    if (view === 'patients') {
      const fetchPatients = async () => {
        setLoadingPatients(true);
        setErrors(prev => ({ ...prev, patients: null }));

        try {
          const data = await fetchWithRetry('https://medical-assistant1.onrender.com/patients');
          setPatients(data.patients || []);
        } catch (error) {
          console.error('Error loading patients:', error);
          setErrors(prev => ({ ...prev, patients: error.message }));
        } finally {
          setLoadingPatients(false);
        }
      };

      fetchPatients();
    }
  }, [view]);

  useEffect(() => {
    if (!selectedDoctor) {
      setAppointments([]);
      return;
    }

    setLoading(prev => ({ ...prev, appointments: true }));
    fetch(`https://medical-assistant1.onrender.com/appointments?doctor_id=${selectedDoctor}`)
      .then(res => res.json())
      .then(data => setAppointments(data.appointments))
      .catch(() => setError('Failed to load appointments.'))
      .finally(() => setLoading(prev => ({ ...prev, appointments: false })));
  }, [selectedDoctor]);

  useEffect(() => {
    if (showLogin) return;
    if (selectedCategory || selectedDoctor) return;

    setLoadingPatients(true);
    setError('');
    
    // Fetch patients count
    const fetchPatientsCount = async () => {
      try {
        const data = await fetchWithRetry('https://medical-assistant1.onrender.com/patients/count');
        setPatientsCount(data.patients_count);
      } catch (error) {
        console.error('Error loading patients count:', error);
        setError('Failed to load patients count.');
      } finally {
        setLoadingPatients(false);
      }
    };

    // Fetch patient rate data - removed as endpoint doesn't exist
    const fetchPatientRate = async () => {
      try {
        // Set default data if endpoint is not available
        setPatientRateData({
          dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          counts: [5, 8, 6, 9, 7, 4, 6]
        });
      } catch (error) {
        console.error('Error loading patient rate data:', error);
      }
    };

    fetchPatientsCount();
    fetchPatientRate();
  }, [showLogin, selectedCategory, selectedDoctor]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (view === 'dashboard' && !showLogin) {
      const fetchDashboardStats = async () => {
        setLoadingStats(true);
        try {
          const data = await fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/stats');
          setDashboardStats(data.stats);
        } catch (error) {
          console.error('Error loading dashboard stats:', error);
          setErrors(prev => ({ ...prev, dashboard: error.message }));
        } finally {
          setLoadingStats(false);
        }
      };

      fetchDashboardStats();
    }
  }, [view, showLogin]);

  useEffect(() => {
    if (view === 'dashboard' && !showLogin) {
      const fetchDashboardData = async () => {
        setLoadingDashboardData(prev => ({
          ...prev,
          departmentStats: true,
          weeklyDistribution: true,
          doctorWorkload: true,
          ageDistribution: true,
        }));

        try {
          const [
            departmentRes,
            weeklyRes,
            workloadRes,
            ageRes
          ] = await Promise.all([
            fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/appointments-by-department'),
            fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/weekly-distribution'),
            fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/doctor-workload'),
            fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/age-distribution'),
          ]);

          setDashboardData({
            departmentStats: departmentRes.data,
            weeklyDistribution: weeklyRes.data,
            doctorWorkload: workloadRes.data,
            ageDistribution: ageRes.data,
          });
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setLoadingDashboardData({
            departmentStats: false,
            weeklyDistribution: false,
            doctorWorkload: false,
            ageDistribution: false,
          });
        }
      };

      fetchDashboardData();
    }
  }, [view, showLogin]);

  useEffect(() => {
    if (patients.length > 0) {
      let filtered = [...patients];

      // Filter by search term
      if (patientSearch) {
        filtered = filtered.filter(patient =>
          patient.full_name.toLowerCase().includes(patientSearch.toLowerCase())
        );
      }

      // Filter by department
      if (selectedDepartmentFilter) {
        filtered = filtered.filter(patient =>
          patient.department === selectedDepartmentFilter
        );
      }

      setFilteredPatients(filtered);
    } else {
      setFilteredPatients([]);
    }
  }, [patients, patientSearch, selectedDepartmentFilter]);

  useEffect(() => {
    const fetchAllAppointments = async () => {
      setLoadingAllAppointments(true);
      try {
        const response = await fetchWithRetry('https://medical-assistant1.onrender.com/appointments');
        setAllAppointments(response.appointments || []);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Failed to load appointments.');
      } finally {
        setLoadingAllAppointments(false);
      }
    };

    if (view === 'appointments') {
      fetchAllAppointments();
    }
  }, [view]);

  useEffect(() => {
    // Update useEffect for session check
    const checkSession = () => {
      const lastActivity = sessionStorage.getItem('lastActivity');
      const currentTime = new Date().getTime();
      const savedUserRole = localStorage.getItem('userRole');
      const savedUser = localStorage.getItem('loggedInUser');
      
      if (!lastActivity) {
        // New session, force login
        setShowLogin(true);
        localStorage.removeItem('loggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loggedInUser');
      } else {
        // Update last activity
        sessionStorage.setItem('lastActivity', currentTime);
        setShowLogin(!localStorage.getItem('loggedIn'));
        if (savedUserRole) {
          setUserRole(savedUserRole);
          setLoggedInUser(savedUser ? JSON.parse(savedUser) : null);
        }
      }
    };

    checkSession();

    const activityInterval = setInterval(() => {
      if (localStorage.getItem('loggedIn')) {
        sessionStorage.setItem('lastActivity', new Date().getTime());
      }
    }, 60000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(activityInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('https://medical-assistant1.onrender.com/doctors');
        const data = await response.json();
        console.log('Raw doctors data:', data.doctors);
        if (data.doctors) {
          const processedDoctors = data.doctors.map(doctor => {
            // Extract the name parts, skipping the 'Dr.' title
            const fullName = doctor.name;
            const nameParts = fullName.split(' ').filter(part => part !== 'Dr.');
            const firstName = nameParts[0].toLowerCase();
            console.log('Processing doctor:', {
              fullName,
              nameParts,
              firstName,
              email: `${firstName}@gmail.com`
            });
            return {
              ...doctor,
              id: doctor.id || doctor._id, // Ensure we have an ID
              email: `${firstName}@gmail.com`,
              password: firstName
            };
          });
          console.log('Final processed doctors:', processedDoctors);
          setDoctorsList(processedDoctors);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };

    fetchDoctors();
  }, []);

  const handleLogin = ({ type, user }) => {
      setShowLogin(false);
    setUserRole(type);
    setLoggedInUser(user);
      localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userRole', type);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
      sessionStorage.setItem('lastActivity', new Date().getTime());
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('lastActivity');
    setShowLogin(true);
    setUserRole(null);
    setLoggedInUser(null);
    setDropdownOpen(false);
    setView('dashboard');
  };

  const chartData = {
    labels: patientRateData?.dates || [],
    datasets: [
      {
        label: 'Patient Rate',
        data: patientRateData?.counts || [],
        fill: false,
        backgroundColor: 'rgb(59, 130, 246)',
        borderColor: 'rgba(59, 130, 246, 0.7)',
        tension: 0.3,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Patient Rate Over Time' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const handleDoctorFilters = (searchText, department) => {
    setSearchTerm(searchText);
    setSelectedDepartmentDoctor(department);

    let filtered = [...allDoctors];

    // Apply department filter
    if (department) {
      filtered = filtered.filter(doctor =>
        doctor.department.toLowerCase() === department.toLowerCase()
      );
    }

    // Apply text search
    if (searchText.trim()) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchText.toLowerCase()) ||
        doctor.department.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleResetFilters = () => {
    setPatientSearch('');
    setSelectedDepartmentFilter('');
    setIsFiltering(false);
  };

  const renderDashboard = () => (
    <div className="dashboard-container">
      <h2 className="content-title">Dashboard Overview</h2>
      
      {loadingStats ? (
        <div className="loading-state">Loading dashboard statistics...</div>
      ) : dashboardStats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Patients</h3>
              <p className="stat-number">{dashboardStats.total_patients}</p>
            </div>
          </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Stethoscope size={24} />
              </div>
              <div className="stat-content">
                <h3>Total Doctors</h3>
                <p className="stat-number">{dashboardStats.total_doctors}</p>
              </div>
            </div>

          <div className="stat-card appointments-card">
            <div className="stat-icon">
              <CalendarDays size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-header">
                <h3>Appointments</h3>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="appointment-toggle"
                    checked={showTodayAppointments}
                    onChange={() => setShowTodayAppointments(!showTodayAppointments)}
                  />
                  <label htmlFor="appointment-toggle">
                    <span className="toggle-label">
                      {showTodayAppointments ? "Today's" : 'Total'}
                    </span>
                  </label>
                </div>
              </div>
              <p className="stat-number">
                {showTodayAppointments 
                  ? dashboardStats.todays_appointments 
                  : dashboardStats.total_appointments}
              </p>
              <p className="stat-label">
                {showTodayAppointments ? "Today's Appointments" : 'Total Appointments'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="error-message">
          {errors?.dashboard || 'Failed to load dashboard statistics'}
        </div>
      )}

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Appointments by Department</h3>
          {loadingDashboardData.departmentStats ? (
            <div className="loading-state">Loading...</div>
          ) : dashboardData.departmentStats ? (
            <Doughnut
              data={{
                labels: dashboardData.departmentStats.map(item => item.department),
                datasets: [{
                  data: dashboardData.departmentStats.map(item => item.count),
                  backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                  ]
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                  }
                }
              }}
            />
          ) : null}
        </div>

        <div className="chart-container">
          <h3>Patient Age Distribution</h3>
          {loadingDashboardData.ageDistribution ? (
            <div className="loading-state">Loading...</div>
          ) : dashboardData.ageDistribution ? (
            <Pie
              data={{
                labels: dashboardData.ageDistribution.map(item => item.ageGroup),
                datasets: [{
                  data: dashboardData.ageDistribution.map(item => item.count),
                  backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF'
                  ]
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'right',
                  }
                }
              }}
            />
          ) : null}
        </div>

        <div className="chart-container">
          <h3>Weekly Appointment Distribution</h3>
          {loadingDashboardData.weeklyDistribution ? (
            <div className="loading-state">Loading...</div>
          ) : dashboardData.weeklyDistribution ? (
            <Bar
              data={{
                labels: dashboardData.weeklyDistribution.map(item => item.day),
                datasets: [{
                  label: 'Appointments',
                  data: dashboardData.weeklyDistribution.map(item => item.count),
                  backgroundColor: '#4BC0C0'
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  }
                }
              }}
            />
          ) : null}
        </div>

        <div className="chart-container">
          <h3>Doctor Workload Analysis</h3>
          {loadingDashboardData.doctorWorkload ? (
            <div className="loading-state">Loading...</div>
          ) : dashboardData.doctorWorkload ? (
            <Bar
              data={{
                labels: dashboardData.doctorWorkload.map(item => item.doctor),
                datasets: [{
                  label: 'Appointments',
                  data: dashboardData.doctorWorkload.map(item => item.appointments),
                  backgroundColor: '#FF9F40'
                }]
              }}
              options={{
                responsive: true,
                indexAxis: 'y',
                plugins: {
                  legend: {
                    position: 'top',
                  }
                }
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderAppointments = () => {
    if (!showLogin && view === 'appointments') {
      const departmentAppointments = selectedDepartment 
        ? allAppointments.filter(apt => apt.department === selectedDepartment)
        : [];

      // Group appointments by doctor and remove 'Dr.' prefix if 
      // 
      // it exists
      const appointmentsByDoctor = departmentAppointments.reduce((acc, apt) => {
        const cleanDoctorName = apt.doctor_name.replace(/^Dr\.\s*/i, '');
        if (!acc[cleanDoctorName]) {
          acc[cleanDoctorName] = {};
        }
        // Parse the appointment date and time
        const appointmentDateTime = new Date(apt.appointment_time);
        // Adjust for timezone to prevent date shifting
        const dateStr = new Date(appointmentDateTime.getTime() - (appointmentDateTime.getTimezoneOffset() * 60000))
          .toISOString().split('T')[0];
        
        if (!acc[cleanDoctorName][dateStr]) {
          acc[cleanDoctorName][dateStr] = [];
        }
        acc[cleanDoctorName][dateStr].push({
          ...apt,
          appointment_date: dateStr,
          appointment_time: appointmentDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        return acc;
      }, {});

      // Get current date info
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
      const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

      // Create calendar days array
      const calendarDays = Array.from({ length: 42 }, (_, i) => {
        const dayNumber = i - firstDayOfMonth + 1;
        return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
      });

      const handleDateClick = (doctorName, dateStr, appointments) => {
        if (appointments && appointments.length > 0) {
          setSelectedViewDate(dateStr);
          setSelectedDayAppointments(appointments);
        }
      };

      return (
        <div className="appointments-view">
          <div className="appointments-header">
            <h2 className="content-title">Appointments by Department</h2>
            {selectedDepartment && (
              <button 
                className="back-button"
                onClick={() => setSelectedDepartment('')}
                title="Back to departments"
              >
                <ArrowLeft size={20} />
              </button>
            )}
          </div>

          {error && <div className="error-alert">{error}</div>}
          
          {loadingAllAppointments ? (
            <div className="loading-state">Loading appointments...</div>
          ) : !selectedDepartment ? (
            <div className="departments-grid">
              {departments
                .filter(dept => !dept.toLowerCase().includes('temp'))
                .map((department) => {
                  const deptAppointments = allAppointments.filter(apt => apt.department === department);
                  return (
                  <div
                    key={department}
                    className="department-card"
                    onClick={() => setSelectedDepartment(department)}
                  >
                    <div className="department-icon">
                      {departmentIcons[department] || <Activity size={24} />}
                    </div>
                    <h3 className="department-name">{department}</h3>
                    <div className="appointment-count">
                        {deptAppointments.length} Appointments
                    </div>
                  </div>
                  );
                })}
            </div>
          ) : (
            <div className="department-appointments">
              <div className="department-header">
                <div className="department-info">
                  <div className="department-icon large">
                    {departmentIcons[selectedDepartment] || <Activity size={32} />}
                  </div>
                  <h3>{selectedDepartment}</h3>
                </div>
              </div>

              {Object.keys(appointmentsByDoctor).length > 0 ? (
                <div className="doctors-appointments">
                  {Object.entries(appointmentsByDoctor).map(([doctorName, dateAppointments]) => (
                    <div key={doctorName} className="doctor-calendar-section">
                      <div 
                        className="doctor-section-header"
                        onClick={() => setExpandedDoctorId(expandedDoctorId === doctorName ? null : doctorName)}
                      >
                        <div className="doctor-info">
                          <div className="doctor-avatar">
                            <User2 size={24} />
                          </div>
                          <h4>Dr. {doctorName}</h4>
                        </div>
                        <ChevronDown 
                          size={20} 
                          className={`chevron-icon ${expandedDoctorId === doctorName ? 'expanded' : ''}`} 
                        />
                      </div>

                      <div className={`calendar-container ${expandedDoctorId === doctorName ? 'expanded' : ''}`}>
                        <div className="calendar-header">
                          <button className="month-nav-btn" onClick={handlePrevMonth}>
                            <ChevronLeft size={20} />
                          </button>
                          <h3>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                          <button className="month-nav-btn" onClick={handleNextMonth}>
                            <ChevronRight size={20} />
                          </button>
                        </div>
                        <div className="calendar-weekdays">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <div key={index} className="weekday">{day}</div>
                          ))}
                        </div>
                        <div className="calendar-grid">
                          {calendarDays.map((day, index) => {
                            if (!day) return <div key={index} className="calendar-day empty"></div>;
                            
                            const date = new Date(
                              currentMonth.getFullYear(),
                              currentMonth.getMonth(),
                              day
                            );
                            // Adjust for timezone to prevent date shifting
                            const dateStr = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                              .toISOString().split('T')[0];
                            const dayAppointments = dateAppointments[dateStr] || [];
                            const hasAppointments = dayAppointments.length > 0;

                            return (
                              <div 
                                key={index} 
                                className={`calendar-day ${hasAppointments ? 'has-appointments' : ''}`}
                                onClick={() => handleDateClick(doctorName, dateStr, dayAppointments)}
                              >
                                <span className="day-number">{day}</span>
                                {hasAppointments && (
                                  <div className="appointment-indicators">
                                    <div className="appointment-count-badge">
                                      {dayAppointments.length}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-appointments">
                  No appointments found for {selectedDepartment}
                </div>
              )}

              {/* Appointment Details Modal */}
              {selectedViewDate && selectedDayAppointments.length > 0 && (
                <div className="modal-overlay" onClick={() => setSelectedViewDate(null)}>
                  <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>Appointments for {selectedViewDate}</h3>
                      <button 
                        className="close-modal-button"
                        onClick={() => setSelectedViewDate(null)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="modal-body">
                      <div className="appointments-list">
                        {selectedDayAppointments
                          .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                          .map((apt) => (
                          <div key={apt.appointment_id} className={`appointment-item ${apt.status?.toLowerCase()}`}>
                            <div className="appointment-time">{apt.appointment_time}</div>
                            <div className="appointment-details">
                              <div className="patient-name">{apt.patient_name}</div>
                              <div className="appointment-status">{apt.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderDoctors = () => {
    if (!showLogin && view === 'doctors') {
      // Filter out doctors with 'temp' in their name
      const displayDoctors = filteredDoctors.filter(doctor => !doctor.name.toLowerCase().includes('temp'));

  return (
        <div className="doctors-view">
          <h2 className="content-title">Doctors Directory</h2>
          
          <div className="doctors-header">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => handleDoctorFilters(e.target.value, selectedDepartmentDoctor)}
                className="search-input"
              />
        </div>

            <div className="filters-container">
              <select
                className="department-select"
                value={selectedDepartmentDoctor}
                onChange={(e) => handleDoctorFilters(searchTerm, e.target.value)}
              >
                <option value="">All Departments</option>
                {departments
                  .filter(dept => !dept.toLowerCase().includes('temp'))
                  .map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
                  </div>
                </div>

          {loading.doctors ? (
            <div className="loading-state">Loading doctors...</div>
          ) : errors.doctors ? (
            <div className="error-message">{errors.doctors}</div>
          ) : (
            <div className="doctors-grid">
              {displayDoctors.map(doctor => (
                <div key={doctor.id} className="doctor-card">
                  <div className="doctor-info">
                    <div className="doctor-avatar">
                      <User2 size={32} />
            </div>
                    <div className="doctor-details">
                      <h3 className="doctor-name">{doctor.name}</h3>
                      <p className="doctor-department">{doctor.department}</p>
                      <span className={`status-badge ${doctor.status?.toLowerCase() || 'active'}`}>
                        {doctor.status || 'Active'}
                      </span>
        </div>
            </div>
                  <button 
                    className="view-profile-btn"
                    onClick={() => setSelectedDoctorProfile(doctor)}
                  >
                    View Profile
                  </button>
            </div>
              ))}
              {displayDoctors.length === 0 && (
                <div className="no-results">
                  No doctors found matching your search criteria
            </div>
              )}
            </div>
          )}

          {selectedDoctorProfile && (
            <DoctorProfileModal 
              doctor={selectedDoctorProfile} 
              onClose={() => setSelectedDoctorProfile(null)}
            />
          )}
            </div>
      );
    }
    return null;
  };

  // Add renderPatients function
  const renderPatients = () => {
    if (!showLogin && view === 'patients') {
      return (
        <div className="patients-view">
          <h2 className="content-title">Patients Directory</h2>
          
              <div className="patients-header">
                  <div className="search-container">
                    <Search className="search-icon" size={20} />
                    <input
                      type="text"
                placeholder="Search patients..."
                      value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                      className="search-input"
                    />
                  </div>

            <div className="filters-container">
                  <select
                    className="department-select"
                    value={selectedDepartmentFilter}
                onChange={(e) => setSelectedDepartmentFilter(e.target.value)}
                  >
                    <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
                  </select>

              {isFiltering && (
                <button 
                  className="reset-filters-btn"
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </button>
              )}
                </div>
              </div>

          {loadingPatients ? (
                <div className="loading-state">Loading patients...</div>
          ) : errors.patients ? (
            <div className="error-message">{errors.patients}</div>
          ) : (
                <div className="patients-list">
                  <table className="patients-table">
                    <thead>
                      <tr>
                    <th>Name</th>
                        <th>Date of Birth</th>
                        <th>Phone Number</th>
                        <th>Department</th>
                          <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map(patient => (
                        <tr key={patient.id}>
                          <td>{patient.full_name}</td>
                          <td>{patient.dob}</td>
                          <td>{patient.phone_number}</td>
                          <td>
                        <span className={`department-badge ${patient.department === 'Not assigned' ? 'not-assigned' : ''}`}>
                          {patient.department}
                            </span>
                          </td>
                          <td>
                        <span className={`status-badge ${patient.status?.toLowerCase() || 'active'}`}>
                          {patient.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredPatients.length === 0 && (
                    <div className="no-results">
                      No patients found matching your search criteria
                    </div>
                  )}
                </div>
              )}
      </div>
      );
    }
    return null;
  };

  // Render main content based on user role and view
  const renderMainContent = () => {
    if (userRole === 'doctor') {
      return <DoctorPanel doctor={loggedInUser} />;
    } else {
      // Admin views
      switch (view) {
        case 'dashboard':
          return renderDashboard();
        case 'patients':
          return renderPatients();
        case 'doctors':
          return renderDoctors();
        case 'appointments':
          return renderAppointments();
        default:
          return renderDashboard();
      }
    }
  };

  if (showLogin) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <Stethoscope className="icon-header" size={33} />
          <h1 className="main-title">
            {userRole === 'admin' ? 'Medical Appointment Dashboard' : 'Doctor Portal'}
          </h1>
        </div>
        <div className="header-right">
          <div className="admin-dropdown" ref={dropdownRef}>
            <button 
              className="admin-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="User menu"
            >
              <User2 size={20} style={{ marginRight: 6 }} />
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="user-info">
                  <span>{userRole === 'admin' ? 'Administrator' : `Dr. ${loggedInUser?.name}`}</span>
                </div>
                <div className="dropdown-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`body-container ${userRole === 'doctor' ? 'no-sidebar' : ''}`}>
        {userRole === 'admin' && (
          <aside className="sidebar">
            <div className="sidebar-section">
              <div 
                className={`sidebar-link ${view === 'dashboard' ? 'active' : ''}`}
                onClick={() => setView('dashboard')}
              >
                <LayoutDashboard size={18} /> Dashboard
              </div>
              <div 
                className={`sidebar-link ${view === 'patients' ? 'active' : ''}`}
                onClick={() => {
                  setView('patients');
                  setSelectedDoctor('');
                }}
              >
                <Users size={18} /> Patients
              </div>
              <div 
                className={`sidebar-link ${view === 'doctors' ? 'active' : ''}`}
                onClick={() => {
                  setView('doctors');
                  setSelectedDoctor('');
                }}
              >
                <Stethoscope size={18} /> Doctors
              </div>
              <div 
                className={`sidebar-link ${view === 'appointments' ? 'active' : ''}`}
                onClick={() => setView('appointments')}
              >
                <CalendarDays size={18} /> Appointments
              </div>
            </div>
          </aside>
        )}

        <main className={`main-content ${userRole === 'doctor' ? 'full-width' : ''}`}>
          {error && <div className="error-alert">{error}</div>}
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}
