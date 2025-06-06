import React, { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
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
  ChevronRight,
  X,
  Bell,
  BellOff,
  RefreshCw
} from 'lucide-react';

// Lazy load chart components
const LazyLine = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const LazyBar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const LazyPie = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));
const LazyDoughnut = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })));

// Replace the regular imports with direct imports for initial rendering
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import './App.css';
import DoctorPanel from './components/DoctorPanel/DoctorPanel';
import AdminPanel from './components/AdminPanel/AdminPanel';
import LoginPage from './components/LoginPage/LoginPage';
import { FaUserMd } from 'react-icons/fa';

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
const FETCH_TIMEOUT = 8000; // 8 seconds timeout

// Add a simple cache for API responses
const apiCache = {
  data: {},
  set: function(url, data, ttl = 60000) { // Default TTL: 1 minute
    this.data[url] = {
      data: data,
      expiry: Date.now() + ttl
    };
  },
  get: function(url) {
    const cached = this.data[url];
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  },
  clear: function() {
    this.data = {};
  }
};

const fetchWithRetry = async (url, retries = MAX_RETRIES) => {
  // Check cache first
  const cachedData = apiCache.get(url);
  if (cachedData) {
    console.log(`Using cached data for ${url}`);
    return cachedData;
  }
  
  try {
    // Create an abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Cache the successful response
    apiCache.set(url, data);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`Request timed out for ${url}`);
      if (retries > 0) {
        console.log(`Retrying... ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(url, retries - 1);
      }
      throw new Error(`Request timed out after ${MAX_RETRIES} retries`);
    }
    
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

// Mock doctor data
const MOCK_DOCTORS = {
  'DOC001': {
    id: 'DOC001',
    name: 'John Smith',
    password: 'doc123',
    department: 'Cardiology',
    specialization: 'Cardiologist'
  }
};

const LoadingSpinner = () => (
  <div className="loading-spinner-container">
    <div className="loading-spinner"></div>
    <p>Loading data...</p>
  </div>
);

export default function App() {
  const [, _setCategories] = useState([]);
  const [_doctors, _setDoctors] = useState([]);
  const [selectedCategory, _setSelectedCategory] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState({ categories: true, doctors: false });
  const [error, setError] = useState('');

  const [showLogin, setShowLogin] = useState(false);
  const [_username, _setUsername] = useState('');
  const [_password, _setPassword] = useState('');
  const [_loginError, _setLoginError] = useState('');

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [_patientsCount, setPatientsCount] = useState(null);
  const [_patientRateData, setPatientRateData] = useState(null);
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

  const [_showTodayAppointments, _setShowTodayAppointments] = useState(false);

  const [_dashboardData, setDashboardData] = useState({
    departmentStats: null,
    weeklyDistribution: null,
    doctorWorkload: null,
    ageDistribution: null,
  });

  const [_loadingDashboardData, setLoadingDashboardData] = useState({
    departmentStats: false,
    weeklyDistribution: false,
    doctorWorkload: false,
    ageDistribution: false,
  });

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [_isFiltering, _setIsFiltering] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [_loadingDepartments, _setLoadingDepartments] = useState(false);

  const [allAppointments, setAllAppointments] = useState([]);
  const [loadingAllAppointments, setLoadingAllAppointments] = useState(false);

  const [selectedDepartmentDoctor, setSelectedDepartmentDoctor] = useState('');

  const [_selectedDate, setSelectedDate] = useState(new Date());
  const [_selectedTimeSlot, _setSelectedTimeSlot] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [_availableTimeSlots, _setAvailableTimeSlots] = useState({
    morning: ['9:00 AM', '10:00 AM', '11:00 AM'],
    afternoon: ['2:00 PM', '3:00 PM', '4:00 PM']
  });

  // Add state for booking form visibility
  const [_showBookingForm, _setShowBookingForm] = useState(false);

  // Add necessary states
  const [_appointmentSearch, _setAppointmentSearch] = useState('');
  const [_selectedCalendarDay, _setSelectedCalendarDay] = useState(16);
  const [_morningSlots] = useState([
    { status: 'booked' },
    { status: 'unavailable' },
    { status: 'available' },
    { status: 'booked' }
  ]);
  const [_afternoonSlots] = useState([
    { status: 'available' },
    { status: 'booked' },
    { status: 'available' },
    { status: 'unavailable' }
  ]);

  const [selectedViewDate, setSelectedViewDate] = useState(null);
  const [selectedDayAppointments, _setSelectedDayAppointments] = useState([]);

  // Add new state for login management
  const [_loginType, _setLoginType] = useState('admin'); // 'admin' or 'doctor'
  const [userRole, setUserRole] = useState(null); // 'admin' or 'doctor'
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [_doctorId, _setDoctorId] = useState('');
  const [_doctorPassword, _setDoctorPassword] = useState('');

  const [_doctorsList, setDoctorsList] = useState([]);

  // Add state for doctor profile modal
  const [_selectedDoctorProfile, _setSelectedDoctorProfile] = useState(null);

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

  const [expandedDoctorId, setExpandedDoctorId] = useState(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [doctorAvailability, setDoctorAvailability] = useState(null);

  // Updated to use a ref map instead of a single ref
  const calendarRefs = useRef({});

  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef(null);
  const notificationRef = useRef(null);

  // Add a new state for appointments status at the top of the component where other states are defined
  const [appointmentsStatus, setAppointmentsStatus] = useState({
    completed: 0,
    upcoming: 0
  });

  // Add state for appointment trends
  const [appointmentTrends, setAppointmentTrends] = useState({
    labels: [],
    completed: [],
    upcoming: []
  });

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Add new useEffect for fetching departments
  useEffect(() => {
    const fetchDepartments = async () => {
      _setLoadingDepartments(true);
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
        _setLoadingDepartments(false);
      }
    };

    // Fetch departments on app load and when switching to appointments
    if (!showLogin && (view === 'appointments' || departments.length === 0)) {
      fetchDepartments();
    }
  }, [view, showLogin, departments.length]);

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
    }
  }, [view]);

  useEffect(() => {
    if (view === 'patients') {
      const fetchPatients = async () => {
        setLoadingPatients(true);
        setErrors(prev => ({ ...prev, patients: null }));

        try {
          const data = await fetchWithRetry('https://medical-assistant1.onrender.com/patients');
          
          // Log the first patient object to see its structure
          if (data.patients && data.patients.length > 0) {
            console.log('Patient data structure:', data.patients[0]);
          }
          
          const patientsData = data.patients || [];
          setPatients(patientsData);
          setFilteredPatients(patientsData); // Initialize filteredPatients with all patients
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
    if (showLogin) return;
    if (selectedCategory) return;

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

    // Fetch patient rate data
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
  }, [showLogin, selectedCategory]);

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
      // Consolidated dashboard data fetching
      const fetchDashboardData = async () => {
        setLoadingStats(true);
        
        try {
          // Use Promise.all to fetch all dashboard data in parallel
          const [
            statsData,
            patientsData,
            appointmentsData,
            doctorsData
          ] = await Promise.all([
            fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/stats'),
            fetchWithRetry('https://medical-assistant1.onrender.com/patients'),
            fetchWithRetry('https://medical-assistant1.onrender.com/appointments'),
            fetchWithRetry('https://medical-assistant1.onrender.com/doctors')
          ]);
          
          // Process dashboard stats
          if (statsData && statsData.stats) {
            setDashboardStats(statsData.stats);
          }
          
          // Process patients data (total patients, distribution, recent)
          if (patientsData && patientsData.patients) {
            const allPatients = patientsData.patients;
            const totalCount = allPatients.length;
            
            // Set patient stats
            setPatientStats({
              total: totalCount,
              new: totalCount,
              old: totalCount
            });
            
            // Calculate age distribution
            const distribution = {
              child: 0,
              teen: 0,
              adult: 0,
              older: 0
            };
            
            const currentYear = new Date().getFullYear();
            allPatients.forEach(patient => {
              if (!patient.dob) return;
              
              try {
                const birthYear = new Date(patient.dob).getFullYear();
                const age = currentYear - birthYear;
                
                if (age >= 0 && age <= 12) distribution.child++;
                else if (age > 12 && age <= 19) distribution.teen++;
                else if (age > 19 && age <= 59) distribution.adult++;
                else if (age > 59) distribution.older++;
              } catch (e) {
                console.error('Error parsing patient DOB:', e);
              }
            });
            
            setPatientDistribution(distribution);
            
            // Set recent patients
            const recentPatients = allPatients.slice(0, 4);
            setMyPatients(recentPatients);
          }
          
          // Process appointments data (today's appointments, status counts)
          if (appointmentsData && appointmentsData.appointments) {
            const allAppointments = appointmentsData.appointments;
            
            // Sort appointments by time
            const sortedAppointments = [...allAppointments].sort((a, b) => 
              new Date(a.appointment_time) - new Date(b.appointment_time)
            );
            
            setTodayAppointments(sortedAppointments);
            
            // Calculate appointment status counts
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let completedCount = 0;
            let upcomingCount = 0;
            
            allAppointments.forEach(appointment => {
              const appointmentDate = new Date(appointment.appointment_time);
              appointmentDate.setHours(0, 0, 0, 0);
              
              if (appointmentDate < today) {
                completedCount++;
              } else {
                upcomingCount++;
              }
            });
            
            setAppointmentsStatus({
              completed: completedCount,
              upcoming: upcomingCount
            });
          }
          
          // Process doctors data (count by department)
          if (doctorsData && doctorsData.doctors) {
            const allDocs = doctorsData.doctors;
            
            // Count doctors by department
            const departmentCounts = {};
            allDocs.forEach(doctor => {
              const dept = doctor.department;
              if (
                dept &&
                !dept.toLowerCase().includes('temp') &&
                !doctor.name.toLowerCase().includes('temp')
              ) {
                departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
              }
            });
            
            // Sort departments by count
            const sortedDepartments = Object.entries(departmentCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([name, count]) => ({ name, count }));
            
            setDoctorsByDepartment(sortedDepartments);
          }
          
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          setErrors(prev => ({ ...prev, dashboard: error.message }));
        } finally {
          setLoadingStats(false);
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

  // ----------------------------
  // Modified Stat Card Section
  // ----------------------------
  const [patientStats, setPatientStats] = useState({
    total: 0,
    new: 0,
    old: 0
  });
  const [patientDistribution, setPatientDistribution] = useState({
    child: 0,
    teen: 0,
    adult: 0,
    older: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [_visitorStats, setVisitorStats] = useState([]);
  const [_appointmentStats, _setAppointmentStats] = useState({
    offline: [],
    online: []
  });
  const [myPatients, setMyPatients] = useState([]);
  const [loadingNewDashboard, setLoadingNewDashboard] = useState({
    patientStats: true,
    patientDistribution: true,
    appointments: true,
    visitors: true,
    appointmentStats: true,
    myPatients: true
  });

  // Fetch patient stats
  useEffect(() => {
    const fetchPatientStats = async () => {
      setLoadingNewDashboard(prev => ({ ...prev, patientStats: true }));
      try {
        // Fetch all patients from the database
        const patientsData = await fetchWithRetry('https://medical-assistant1.onrender.com/patients');
        
        if (patientsData && patientsData.patients) {
          const allPatients = patientsData.patients;
          const totalCount = allPatients.length;
          
          // Determine new patients (registered in the last 30 days)
          setPatientStats({
            total: totalCount,
            new: totalCount,
            old: totalCount
          });
        } else {
          // Fallback to the existing approach if the patients endpoint doesn't work
          const totalData = await fetchWithRetry('https://medical-assistant1.onrender.com/patients/count');
          setPatientStats({
            total: totalData.patients_count || 0,
            new: totalData.new_patients_count || 0,
            old: totalData.patients_count || 0
          });
        }
      } catch (error) {
        console.error('Error fetching patient stats:', error);
        // Fallback values if all APIs fail
        setPatientStats({
          total: 0,
          new: 0,
          old: 0
        });
      } finally {
        setLoadingNewDashboard(prev => ({ ...prev, patientStats: false }));
      }
    };

    if (view === 'dashboard' && !showLogin) {
      fetchPatientStats();
    }
  }, [view, showLogin]);

  // Fetch patient distribution by age
  useEffect(() => {
    const fetchPatientDistribution = async () => {
      setLoadingNewDashboard(prev => ({ ...prev, patientDistribution: true }));
      try {
        const patientsData = await fetchWithRetry('https://medical-assistant1.onrender.com/patients');
        
        // Initialize distribution object
        const distribution = {
          child: 0,
          teen: 0,
          adult: 0,
          older: 0
        };
        
        if (patientsData && patientsData.patients && patientsData.patients.length > 0) {
          const allPatients = patientsData.patients;
          const currentYear = new Date().getFullYear();
          
          // Count patients by age groups
          allPatients.forEach(patient => {
            if (!patient.dob) return;
            try {
              const birthYear = new Date(patient.dob).getFullYear();
              const age = currentYear - birthYear;
              
              if (age >= 0 && age <= 12) distribution.child++;
              else if (age > 12 && age <= 19) distribution.teen++;
              else if (age > 19 && age <= 59) distribution.adult++;
              else if (age > 59) distribution.older++;
            } catch (e) {
              console.error('Error parsing patient DOB:', e);
            }
          });
          
          // If no age data was found in patients, try distribution API as fallback
          if (Object.values(distribution).every(v => v === 0)) {
            await fetchDistributionFromAPI(distribution);
          }
        } else {
          // Fallback to API if patients data not available
          await fetchDistributionFromAPI(distribution);
        }
        
        setPatientDistribution(distribution);
      } catch (error) {
        console.error('Error fetching patient distribution:', error);
        // Set fallback data
        setPatientDistribution({
          child: 170,
          teen: 457,
          adult: 298,
          older: 525
        });
      } finally {
        setLoadingNewDashboard(prev => ({ ...prev, patientDistribution: false }));
      }
    };
    
    // Helper function to get distribution data from API
    const fetchDistributionFromAPI = async (distribution) => {
      try {
        const data = await fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/age-distribution');
        
        if (data.data) {
          data.data.forEach(item => {
            if (item.ageGroup === '0-12') distribution.child = item.count;
            else if (item.ageGroup === '13-19') distribution.teen = item.count;
            else if (item.ageGroup === '20-59') distribution.adult = item.count;
            else if (item.ageGroup === '60+') distribution.older = item.count;
          });
        }
        
        return distribution;
      } catch (error) {
        console.error('Error fetching age distribution from API:', error);
        return distribution;
      }
    };

    if (view === 'dashboard' && !showLogin) {
      fetchPatientDistribution();
    }
  }, [view, showLogin]);

  // Fetch today's appointments
  useEffect(() => {
    const fetchTodayAppointments = async () => {
      setLoadingNewDashboard(prev => ({ ...prev, appointments: true }));
      try {
        // Fetch all appointments instead of filtering by date in the API call
        const data = await fetchWithRetry('https://medical-assistant1.onrender.com/appointments');
        
        if (!data.appointments || !Array.isArray(data.appointments)) {
          throw new Error('No appointment data available');
        }
        
        // Sort appointments by time
        const sortedAppointments = [...data.appointments].sort((a, b) => 
          new Date(a.appointment_time) - new Date(b.appointment_time)
        );
        
        // Store all appointments for access by date selector
        setTodayAppointments(sortedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setTodayAppointments([]);
      } finally {
        setLoadingNewDashboard(prev => ({ ...prev, appointments: false }));
      }
    };

    if (view === 'dashboard' && !showLogin) {
      fetchTodayAppointments();
    }
  }, [view, showLogin]);

  // Fetch visitor stats
  useEffect(() => {
    const fetchVisitorStats = async () => {
      setLoadingNewDashboard(prev => ({ ...prev, visitors: true }));
      try {
        const data = await fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/daily-visitors');
        
        if (!data.data || data.data.length === 0) {
          throw new Error('No visitor stats data available');
        }
        
        setVisitorStats(data.data);
      } catch (error) {
        console.error('Error fetching visitor stats:', error);
        // No fallback static data - show error in UI
        setVisitorStats([]);
      } finally {
        setLoadingNewDashboard(prev => ({ ...prev, visitors: false }));
      }
    };

    if (view === 'dashboard' && !showLogin) {
      fetchVisitorStats();
    }
  }, [view, showLogin]);

  // Fetch my patients
  useEffect(() => {
    const fetchMyPatients = async () => {
      setLoadingNewDashboard(prev => ({ ...prev, myPatients: true }));
      try {
        // Fetch patients from main patients table instead of using /patients/recent endpoint
        const patientsData = await fetchWithRetry('https://medical-assistant1.onrender.com/patients');
        
        if (!patientsData.patients || !Array.isArray(patientsData.patients)) {
          throw new Error('Invalid patient data from API');
        }

        // Get patients with their appointments data
        const recentPatients = patientsData.patients.slice(0, 4);
        
        // Fetch appointments to get the most recent appointment for each patient
        const appointmentsData = await fetchWithRetry('https://medical-assistant1.onrender.com/appointments');
        
        if (appointmentsData.appointments && Array.isArray(appointmentsData.appointments)) {
          // Create a map of patient appointments
          const patientAppointments = {};
          
          appointmentsData.appointments.forEach(appointment => {
            const patientId = appointment.patient_id;
            if (!patientAppointments[patientId]) {
              patientAppointments[patientId] = [];
            }
            patientAppointments[patientId].push(appointment);
          });
          
          // Enhance patients with their appointment data
          const enhancedPatients = recentPatients.map(patient => {
            const patientAppts = patientAppointments[patient.id] || [];
            // Sort appointments by date (newest first)
            patientAppts.sort((a, b) => new Date(b.appointment_time) - new Date(a.appointment_time));
            
            return {
              ...patient,
              // Get the most recent appointment data
              lastAppointment: patientAppts.length > 0 ? patientAppts[0] : null,
              reason: patientAppts.length > 0 ? patientAppts[0].reason : "General Checkup"
            };
          });
          
          setMyPatients(enhancedPatients);
        } else {
          // If no appointments data, just use patients
          setMyPatients(recentPatients);
        }
      } catch (error) {
        console.error('Error fetching my patients:', error);
        setMyPatients([]);
      } finally {
        setLoadingNewDashboard(prev => ({ ...prev, myPatients: false }));
      }
    };

    if (view === 'dashboard' && !showLogin) {
      fetchMyPatients();
    }
  }, [view, showLogin]);

  // Calculate trends for patient stats
  const _calculateTrend = (current, previous) => {
    if (!previous) return { value: 0, isPositive: true };
    const difference = current - previous;
    const percentChange = previous !== 0 ? (difference / previous) * 100 : 0;
    return {
      value: Math.abs(percentChange).toFixed(1),
      isPositive: difference >= 0
    };
  };

  // Fix the linter error by adding an underscore prefix to the unused function
  const _calculateDetailedTrend = (currentCount, previousCount = null) => {
    // If no previous data, use a small random trend for UI purposes
    if (previousCount === null) {
      const randomTrend = (Math.random() * 2 - 0.5).toFixed(1); // Random between -0.5 and 1.5
      return {
        value: Math.abs(randomTrend),
        isPositive: parseFloat(randomTrend) >= 0,
        percentage: `${parseFloat(randomTrend) >= 0 ? '+' : '-'}${Math.abs(randomTrend)}%`
      };
    }
    
    // Calculate actual trend
    const difference = currentCount - previousCount;
    const percentChange = previousCount !== 0 ? (difference / previousCount) * 100 : 0;
    
    return {
      value: Math.abs(percentChange).toFixed(1),
      isPositive: difference >= 0,
      percentage: `${difference >= 0 ? '+' : '-'}${Math.abs(percentChange).toFixed(1)}%`,
      difference: difference
    };
  };

  // Get current date for the appointment date pills
  const [visibleDateRange, setVisibleDateRange] = useState(0); // 0 means starting from today
  const today = new Date();

  // Generate date pills for a week, starting from visibleDateRange
  const generateDatePills = () => {
    const pills = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + visibleDateRange + i);
      pills.push({
        day: date.getDate(),
        date: date,
        isToday: date.toDateString() === today.toDateString()
      });
    }
    return pills;
  };

  // Use useMemo to regenerate date pills when visibleDateRange changes
  const datePills = useMemo(() => generateDatePills(), [visibleDateRange]);

  // Function to navigate to previous week
  const navigateToPreviousWeek = () => {
    setVisibleDateRange(visibleDateRange - 7);
    // If we're moving back and the selected date is now out of view, reset it
    if (selectedDateIndex >= 7) {
      setSelectedDateIndex(0);
    }
  };

  // Function to navigate to next week
  const navigateToNextWeek = () => {
    setVisibleDateRange(visibleDateRange + 7);
    setSelectedDateIndex(0); // Reset selection when moving to next week
  };

  // Find today's index in the current visible range
  const todayIndex = datePills.findIndex(pill => pill.isToday);
  // If today is visible, select it by default, otherwise select first day
  useEffect(() => {
    if (todayIndex >= 0) {
      setSelectedDateIndex(todayIndex);
    } else {
      setSelectedDateIndex(0);
    }
  }, [visibleDateRange, todayIndex, selectedDateIndex]);

  // Render My Patients section for dashboard
  const renderMyPatients = () => {
    if (loadingNewDashboard.myPatients) {
      return <div className="loading-state">Loading patient data...</div>;
    }
    
    if (myPatients.length === 0) {
      return <div className="no-data-message">No patient data available</div>;
    }
    
    return (
      <div className="patients-list">
        <table className="patients-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date of Birth</th>
              <th>Department</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {myPatients.map(patient => (
              <tr key={patient.id || patient._id}>
                <td>{patient.full_name}</td>
                <td>{patient.dob}</td>
                <td>
                  <span className={`department-badge ${patient.department?.toLowerCase() === 'temp' ? 'registered' : patient.department === 'Not assigned' ? 'not-assigned' : ''}`}>
                    {patient.department?.toLowerCase() === 'temp' ? 'Registered' : patient.department || 'Not assigned'}
                  </span>
                </td>
                <td>{patient.phone_number || patient.contact || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {myPatients.length === 0 && (
          <div className="no-results">
            No patients found
          </div>
        )}
      </div>
    );
  };

  // ----------------------------
  // Updated renderDashboard()
  // ----------------------------
  const renderDashboard = () => {
    return (
      <div className="dashboard-container">
        <h2 className="content-title">Dashboard Overview</h2>
        
        {loadingStats ? (
          <LoadingSpinner />
        ) : dashboardStats ? (
          <>
            {/* Top Stats Cards (now 4 cards) */}
            <div className="stats-overview-grid">
              {/* Total Patients */}
              <div className="stat-overview-card patients-card">
                <div className="stat-overview-icon">
                  <Users size={24} />
                </div>
                <div className="stat-overview-content">
                  <h3>{patientStats.total}</h3>
                  <p>Total Patients</p>
                  {/* <span className={`stat-trend ${calculateDetailedTrend(patientStats.total, dashboardStats?.total_patients || null).isPositive ? 'positive' : 'negative'}`}>
                    {calculateDetailedTrend(patientStats.total, dashboardStats?.total_patients || null).percentage}
                  </span> */}
                </div>
              </div>

              {/* Number of Doctors - NEW CARD */}
              <div className="stat-overview-card doctors-card">
                <div className="stat-overview-icon">
                  <Stethoscope size={24} />
                </div>
                <div className="stat-overview-content">
                  <h3>{doctorsByDepartment.reduce((sum, dept) => sum + dept.count, 0)}</h3>
                  <p>Total Doctors</p>
                  {/* <span className="stat-trend positive">
                    +2.5%
                  </span> */}
                </div>
              </div>

              {/* Total Appointments */}
              <div className="stat-overview-card total-appointments-card">
                <div className="stat-overview-icon">
                  <Activity size={24} />
                </div>
                <div className="stat-overview-content">
                  <h3>{dashboardStats.total_appointments}</h3>
                  <p>Total Appointments</p>
                  {/* <span className={`stat-trend ${calculateDetailedTrend(dashboardStats.total_appointments, Math.floor(dashboardStats.total_appointments * 0.98)).isPositive ? 'positive' : 'negative'}`}>
                    {calculateDetailedTrend(dashboardStats.total_appointments, Math.floor(dashboardStats.total_appointments * 0.98)).percentage}
                  </span> */}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="stat-overview-card upcoming-card">
                <div className="stat-overview-icon">
                  <CalendarDays size={24} />
                </div>
                <div className="stat-overview-content">
                  <h3>{appointmentsStatus.upcoming}</h3>
                  <p>Upcoming Appointments</p>
                  {/* <span className={`stat-trend ${calculateDetailedTrend(appointmentsStatus.upcoming, Math.floor(appointmentsStatus.upcoming * 1.01)).isPositive ? 'positive' : 'negative'}`}>
                    {calculateDetailedTrend(appointmentsStatus.upcoming, Math.floor(appointmentsStatus.upcoming * 1.01)).percentage}
                  </span> */}
                </div>
              </div>
            </div>

            {/* Dashboard Main Content */}
            <div className="dashboard-main-content">
              {/* Patient Distribution Chart */}
              <div className="patient-distribution-chart">
                <div className="chart-header">
                  <h3>Patient Overview</h3>
                </div>
                <div className="chart-content">
                  {loadingNewDashboard.patientDistribution ? (
                    <div className="loading-state">Loading patient distribution...</div>
                  ) : (
                    <>
                      <div className="donut-chart-container">
                        <div className="donut-center">
                          <h4>{patientStats.total}</h4>
                          <p>Total Patients</p>
                        </div>
                        <Suspense fallback={<div className="chart-loading">Loading chart...</div>}>
                          <LazyDoughnut
                            data={{
                              labels: ['Child', 'Teen', 'Adult', 'Older'],
                              datasets: [{
                                data: [
                                  patientDistribution.child,
                                  patientDistribution.teen,
                                  patientDistribution.adult,
                                  patientDistribution.older
                                ],
                                backgroundColor: [
                                  '#FF9F40',
                                  '#36A2EB',
                                  '#4BC0C0',
                                  '#9966FF'
                                ],
                                borderWidth: 0,
                                cutout: '75%'
                              }]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'right',
                                  labels: {
                                    boxWidth: 15,
                                    padding: 15
                                  }
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      const label = context.label || '';
                                      const value = context.raw || 0;
                                      const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                      const percentage = Math.round((value / total) * 100);
                                      return `${label}: ${value} (${percentage}%)`;
                                    }
                                  }
                                }
                              },
                            }}
                          />
                        </Suspense>
                      </div>
                      <div className="patient-legend">
                        <div className="legend-item">
                          <span className="legend-color" style={{ backgroundColor: '#FF9F40' }}></span>
                          <span className="legend-label">Child</span>
                          <span className="legend-value">{patientDistribution.child}</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color" style={{ backgroundColor: '#36A2EB' }}></span>
                          <span className="legend-label">Teen</span>
                          <span className="legend-value">{patientDistribution.teen}</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color" style={{ backgroundColor: '#4BC0C0' }}></span>
                          <span className="legend-label">Adult</span>
                          <span className="legend-value">{patientDistribution.adult}</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color" style={{ backgroundColor: '#9966FF' }}></span>
                          <span className="legend-label">Older</span>
                          <span className="legend-value">{patientDistribution.older}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Appointments Preview */}
              <div className="appointments-preview">
                <div className="appointments-header">
                  <h3>Appointments</h3>
                  <div className="appointments-date">
                    {datePills[0].date.getMonth() !== datePills[datePills.length - 1].date.getMonth() ? (
                      <span>
                        {format(datePills[0].date, 'MMM')} - {format(datePills[datePills.length - 1].date, 'MMM yyyy')}
                      </span>
                    ) : (
                      <span>{format(datePills[0].date, 'MMMM yyyy')}</span>
                    )}
                    <ChevronDown size={16} />
                  </div>
                </div>
                
                <div className="date-selector">
                  <button className="date-nav-btn" onClick={navigateToPreviousWeek}>
                    <ChevronLeft size={18} />
                  </button>
                  
                  <div className="date-pills">
                    {datePills.map((pill, index) => (
                      <div 
                        key={index} 
                        className={`date-pill ${index === selectedDateIndex ? 'active' : ''} ${pill.isToday ? 'today' : ''}`}
                        onClick={() => setSelectedDateIndex(index)}
                      >
                        <span className="day">{pill.day}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button className="date-nav-btn" onClick={navigateToNextWeek}>
                    <ChevronRight size={18} />
                  </button>
                </div>
                
                {renderAppointmentList()}
              </div>
            </div>

            {/* New Patients AND Appointment Trends (side by side) */}
            <div className="dashboard-main-content">
              {/* My Patients Section */}
              <div className="my-patients-section">
                <div className="section-header">
                  <h3>New Patients</h3>
                </div>
                {renderMyPatients()}
              </div>
              
              {/* Appointment Trends Chart */}
              <div className="appointment-trends-chart">
                <div className="section-header">
                  <h3>Appointment Trends</h3>
                  <button
                    className="refresh-chart-btn"
                    onClick={() => {
                      // Refresh appointment trends
                      setLoadingNewDashboard(prev => ({ ...prev, patientStats: true }));
                      fetchWithRetry('https://medical-assistant1.onrender.com/appointments')
                        .then(data => {
                          if (!data.appointments) throw new Error('No appointments data available');
                          
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // Generate trend data for the past 7 days
                          const trendLabels = [];
                          const completedTrend = [];
                          const upcomingTrend = [];

                          // Get dates for the past 7 days
                          for (let i = 6; i >= 0; i--) {
                            const date = new Date();
                            date.setDate(date.getDate() - i);
                            date.setHours(0, 0, 0, 0);
                            
                            const dateStr = format(date, 'MMM dd');
                            trendLabels.push(dateStr);
                            
                            // Count appointments for this date
                            let completedForDay = 0;
                            let upcomingForDay = 0;
                            
                            data.appointments.forEach(appointment => {
                              const appointmentDate = new Date(appointment.appointment_time);
                              appointmentDate.setHours(0, 0, 0, 0);
                              
                              // Check if appointment is on this date
                              if (appointmentDate.getTime() === date.getTime()) {
                                if (date < today) {
                                  completedForDay++;
                                } else {
                                  upcomingForDay++;
                                }
                              }
                            });
                            
                            completedTrend.push(completedForDay);
                            upcomingTrend.push(upcomingForDay);
                          }
                          
                          setAppointmentTrends({
                            labels: trendLabels,
                            completed: completedTrend,
                            upcoming: upcomingTrend
                          });
                        })
                        .catch(error => {
                          console.error('Error fetching appointment trends:', error);
                        })
                        .finally(() => {
                          setLoadingNewDashboard(prev => ({ ...prev, patientStats: false }));
                        });
                    }}
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                
                <div className="chart-content">
                  {loadingNewDashboard.patientStats ? (
                    <div className="loading-state">Loading appointment trends...</div>
                  ) : appointmentTrends.labels.length === 0 ? (
                    <div className="no-data-message">No appointment trend data available</div>
                  ) : (
                    <>
                      <div className="line-chart-container">
                        <Suspense fallback={<div className="chart-loading">Loading chart...</div>}>
                          <LazyLine
                            data={{
                              labels: appointmentTrends.labels,
                              datasets: [
                                {
                                  label: 'Done',
                                  data: appointmentTrends.completed,
                                  borderColor: '#10b981',
                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                  borderWidth: 2,
                                  fill: true,
                                  tension: 0.4,
                                  pointBackgroundColor: '#10b981',
                                  pointRadius: 3,
                                  pointHoverRadius: 5
                                },
                                {
                                  label: 'Booked',
                                  data: appointmentTrends.upcoming,
                                  borderColor: '#f59e0b',
                                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                  borderWidth: 2,
                                  fill: true,
                                  tension: 0.4,
                                  pointBackgroundColor: '#f59e0b',
                                  pointRadius: 3,
                                  pointHoverRadius: 5
                                }
                              ]
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                  align: 'end',
                                  labels: {
                                    boxWidth: 10,
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    font: {
                                      size: 11
                                    }
                                  }
                                },
                                tooltip: {
                                  mode: 'index',
                                  intersect: false,
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  titleColor: '#1e293b',
                                  bodyColor: '#475569',
                                  borderColor: '#e2e8f0',
                                  borderWidth: 1,
                                  padding: 8,
                                  boxPadding: 4,
                                  usePointStyle: true,
                                  callbacks: {
                                    label: function(context) {
                                      return `${context.dataset.label}: ${context.raw}`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                x: {
                                  grid: {
                                    display: false
                                  },
                                  ticks: {
                                    color: '#64748b',
                                    font: {
                                      size: 10
                                    }
                                  }
                                },
                                y: {
                                  beginAtZero: true,
                                  grid: {
                                    color: '#f1f5f9'
                                  },
                                  ticks: {
                                    precision: 0,
                                    color: '#64748b',
                                    font: {
                                      size: 10
                                    }
                                  }
                                }
                              }
                            }}
                          />
                        </Suspense>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="error-message">
            {errors?.dashboard || 'Failed to load dashboard statistics'}
          </div>
        )}
      </div>
    );
  };

  const renderAppointmentList = () => {
    if (loadingNewDashboard.appointments) {
      return <div className="loading-state">Loading appointments...</div>;
    }

    // Get selected date from datePills array
    const selectedDate = datePills[selectedDateIndex].date;
    
    // Debug information about appointments
    console.log("Total appointments:", todayAppointments.length);
    console.log("Selected date:", selectedDate.toISOString().split('T')[0]);
    
    // Filter appointments for the selected date with timezone handling
    const appointmentsForSelectedDate = todayAppointments.filter(appointment => {
      // Get date part of appointment time (handle timezone issues)
      const appointmentDateStr = new Date(appointment.appointment_time).toISOString().split('T')[0];
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      
      // Debug comparison
      console.log(`Comparing ${appointmentDateStr} with ${selectedDateStr}`);
      
      // Compare date strings instead of Date objects to avoid timezone issues
      return appointmentDateStr === selectedDateStr;
    });
    
    console.log("Filtered appointments:", appointmentsForSelectedDate.length);
    
    if (appointmentsForSelectedDate.length === 0) {
      return <div className="no-appointments">No appointments on {format(selectedDate, 'MMM dd, yyyy')}</div>;
    }

    return (
      <div className="appointment-list">
        {appointmentsForSelectedDate.map((appointment, index) => (
          <div key={appointment.id || index} className="appointment-item">
            <div className="appointment-avatar">
              <img src={`https://randomuser.me/api/portraits/${index % 2 === 0 ? 'women' : 'men'}/${(index + 40) % 99}.jpg`} alt="Patient" />
            </div>
            <div className="appointment-details">
              <h4>{appointment.patient_name}</h4>
              <p>
                <span className="appointment-department">{appointment.department}</span> • 
                <span className="appointment-doctor">Dr. {appointment.doctor_name}</span>
              </p>
            </div>
            <div className="appointment-time">
              {new Date(appointment.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <button className="appointment-options">
              <ChevronDown size={18} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderAppointments = () => {
    if (!showLogin && view === 'appointments') {
      const departmentAppointments = selectedDepartment 
        ? allAppointments.filter(apt => apt.department === selectedDepartment)
        : [];

      // Group appointments by doctor and remove 'Dr.' prefix if 
      // it exists
      const appointmentsByDoctor = departmentAppointments.reduce((acc, apt) => {
        const cleanDoctorName = apt.doctor_name.replace(/^Dr\.?\s*/i, '');
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

      const handleDateClick = (doctorName, dateStr, appointments, event) => {
        if (appointments && appointments.length > 0) {
          // Add status based on date comparison
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const appointmentDate = new Date(dateStr);
          appointmentDate.setHours(0, 0, 0, 0);

          const appointmentsWithStatus = appointments.map(apt => {
            let status;
            if (appointmentDate < today) {
              status = 'done';
            } else if (appointmentDate.getTime() === today.getTime()) {
              status = 'today';
            } else {
              status = 'upcoming';
            }
            return { ...apt, appointmentStatus: status };
          });

          // Remove any existing popup
          const existingPopup = document.querySelector('.appointment-popup-overlay');
          if (existingPopup) {
            existingPopup.remove();
          }

          // Get patient to highlight (if any)
          const patientToHighlight = event.currentTarget.getAttribute('data-highlight-patient');
          console.log("Patient to highlight:", patientToHighlight);

          // Create overlay
          const overlay = document.createElement('div');
          overlay.className = 'appointment-popup-overlay';

          // Create popup
          const popup = document.createElement('div');
          popup.className = 'appointment-popup';

          // Sort appointments and highlight the searched patient (if applicable)
          const sortedAppointments = appointmentsWithStatus
            .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
            .map(apt => {
              const isHighlighted = patientToHighlight && apt.patient_name === patientToHighlight;
              return {
                ...apt,
                isHighlighted
              };
            });

          const popupContent = `
            <button class="popup-close-btn">×</button>
            <div class="appointment-popup-list">
              ${sortedAppointments.map(apt => `
                <div class="popup-appointment-item ${apt.isHighlighted ? 'highlighted-appointment' : ''}">
                  <span class="popup-appointment-time">${apt.appointment_time}</span>
                  <span class="popup-appointment-patient">${apt.patient_name}</span>
                  <span class="popup-appointment-status ${apt.appointmentStatus}">${apt.appointmentStatus}</span>
                </div>
              `).join('')}
            </div>
          `;

          popup.innerHTML = popupContent;
          overlay.appendChild(popup);
          document.body.appendChild(overlay);

          // Add click handler to close button
          const closeBtn = popup.querySelector('.popup-close-btn');
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.remove();
          });

          // Close popup when clicking outside
          overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
              overlay.remove();
            }
          });

          // Add custom styling for highlighted appointment
          const style = document.createElement('style');
          style.textContent = `
            .highlighted-appointment {
              background: rgba(22, 165, 173, 0.2) !important;
              border: 2px solid #16a5ad !important;
              transform: scale(1.02) !important;
            }
          `;
          document.head.appendChild(style);

          // Update active state of calendar day
          const allCalendarDays = document.querySelectorAll('.calendar-day');
          allCalendarDays.forEach(day => day.classList.remove('active'));
          event.currentTarget.classList.add('active');

          // Scroll highlighted appointment into view if present
          setTimeout(() => {
            const highlightedElement = popup.querySelector('.highlighted-appointment');
            if (highlightedElement) {
              highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      };

      return (
        <>
          <div className="appointments-header">
            {selectedDepartment ? (
              <>
                <button 
                  className="back-button"
                  onClick={() => setSelectedDepartment('')}
                  title="Back to departments"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="department-info">
                  <div className="department-icon">
                    {departmentIcons[selectedDepartment] || <Activity size={18} />}
                  </div>
                  <span>{selectedDepartment}</span>
                </div>
              </>
            ) : (
              <h2 className="content-title">Appointments by Department</h2>
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
                        {departmentIcons[department] || <Activity size={18} />}
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
                  {/* <div className="department-icon">
                    {departmentIcons[selectedDepartment] || <Activity size={18} />}
                  </div>
                  <h3 className="department-name">{selectedDepartment}</h3> */}
                </div>
              </div>

              {Object.keys(appointmentsByDoctor).length > 0 ? (
                <div className="doctors-appointments">
                  {Object.entries(appointmentsByDoctor).map(([doctorName, dateAppointments]) => {
                    // Check if this doctor is the expanded one
                    const isExpanded = expandedDoctorId === doctorName;
                    
                    return (
                      <div 
                        key={doctorName} 
                        className={`doctor-calendar-section ${isExpanded ? 'expanded-section' : ''}`}
                      >
                        <div 
                          className="doctor-section-header"
                          onClick={(e) => {
                            // Prevent event from bubbling up
                            e.stopPropagation();

                            // If clicking on the currently expanded doctor, collapse it
                            // Otherwise, expand this doctor and collapse any others
                            setExpandedDoctorId(prevId => 
                              prevId === doctorName ? null : doctorName
                            );
                          }}
                        >
                          <div className="doctor-info">
                            <div className="doctor-card-avatar">
                              <FaUserMd size={24} />
                            </div>
                            <h4>Dr. {doctorName}</h4>
                          </div>
                          <ChevronDown 
                            size={20} 
                            className={`chevron-icon ${isExpanded ? 'expanded' : ''}`} 
                          />
                        </div>

                        {/* Only render the calendar container if this doctor is expanded */}
                        {isExpanded && (
                          <div 
                            className="calendar-container expanded"
                            ref={node => {
                              // Store the ref in the calendarRefs object using the doctor's name as key
                              if (node) {
                                calendarRefs.current[doctorName] = node;
                              }
                            }}
                          >
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
                                const isToday = new Date().toLocaleDateString() === date.toLocaleDateString();

                                return (
                                  <div 
                                    key={index} 
                                    className={`calendar-day ${isToday ? 'current-day' : ''} ${hasAppointments ? 'clickable' : ''}`}
                                    onClick={(e) => handleDateClick(doctorName, dateStr, dayAppointments, e)}
                                  >
                                    <span className="day-number">{day}</span>
                                    {hasAppointments && (
                                      <div className="appointment-indicators">
                                        <div className="appointment-dot"></div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                          <div key={apt.appointment_id} className={`appointment-item ${apt.status?.toLowerCase() || ''} ${apt.appointmentStatus}`}>
                            <div className="appointment-time">{apt.appointment_time}</div>
                            <div className="appointment-details">
                              <div className="patient-name">{apt.patient_name}</div>
                              <div className={`appointment-status ${apt.appointmentStatus}`}>
                                {apt.appointmentStatus}
                              </div>
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
        </>
      );
    }
    return null;
  };

  const fetchDoctorAvailability = async (doctorId) => {
    try {
      const response = await fetch(`https://medical-assistant1.onrender.com/doctors/${doctorId}/availability`);
      const data = await response.json();
      if (data.availability) {
        // Convert the time slots into start and end times for each day
        const formattedAvailability = {};
        Object.entries(data.availability).forEach(([day, slots]) => {
          if (slots.length > 0) {
            formattedAvailability[day] = {
              start: slots[0],
              end: slots[slots.length - 1]
            };
          }
        });
        setDoctorAvailability(formattedAvailability);
      }
    } catch (error) {
      console.error('Error fetching doctor availability:', error);
    }
  };

  const handleDoctorFilters = (search, department) => {
    setSearchTerm(search);
    setSelectedDepartmentDoctor(department);
    
    let filtered = [...allDoctors];
    
    if (search) {
      // Improve the search to handle "Dr." prefix and partial name matches
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(doctor => {
        const doctorName = doctor.name.toLowerCase();
        // Match even if the user didn't type "Dr." but the doctor name includes it
        // Also match parts of first or last name
        return doctorName.includes(searchLower) || 
               doctorName.replace(/^dr\.\s*/i, '').includes(searchLower);
      });
    }
    
    if (department) {
      filtered = filtered.filter(doctor => 
        doctor.department === department
      );
    }
    
    setFilteredDoctors(filtered);
  };

  const renderDoctors = () => {
    if (!showLogin && view === 'doctors') {
      const displayDoctors = filteredDoctors.filter(doctor => !doctor.name.toLowerCase().includes('temp'));

      // Update the click handler for the View Profile button to only handle profile viewing
      const handleViewProfile = (doctor) => {
        setSelectedDoctor(doctor);
        fetchDoctorAvailability(doctor.id);
      };

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
                    <div className="doctor-card-avatar">
                      <FaUserMd size={24} />
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
                    onClick={() => handleViewProfile(doctor)}
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
        </div>
      );
    }
    return null;
  };

  // Modify the renderMainContent function to use the renderPatients function
  const renderMainContent = () => {
    if (userRole === 'doctor') {
      return <DoctorPanel doctor={loggedInUser} />;
    } else {
      // Admin views
      switch (view) {
        case 'dashboard':
          return renderDashboard();
        case 'patients':
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
                    {departments
                      .filter(dept => !dept.toLowerCase().includes('temp'))
                      .map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                  </select>
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
                        <th>Department</th>
                        <th>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map(patient => (
                        <tr key={patient.id || patient._id}>
                          <td>{patient.full_name}</td>
                          <td>{patient.dob || 'N/A'}</td>
                          <td>
                            <span className={`department-badge ${patient.department?.toLowerCase() === 'temp' ? 'registered' : patient.department === 'Not assigned' ? 'not-assigned' : ''}`}>
                              {patient.department?.toLowerCase() === 'temp' ? 'Registered' : patient.department || 'Not assigned'}
                            </span>
                          </td>
                          <td>{patient.phone_number || patient.contact || 'N/A'}</td>
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
        case 'doctors':
          return renderDoctors();
        case 'appointments':
          return renderAppointments();
        default:
          return renderDashboard();
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only check for outside clicks when a calendar is expanded
      if (expandedDoctorId) {
        // Get the expanded calendar container
        const expandedCalendarContainer = calendarRefs.current[expandedDoctorId];
        
        // Check if the click was outside the expanded calendar
        if (expandedCalendarContainer && !expandedCalendarContainer.contains(event.target)) {
          // Check if the click was on a doctor section header
          const allDoctorHeaders = document.querySelectorAll('.doctor-section-header');
          let clickedOnAnyHeader = false;
          
          allDoctorHeaders.forEach(header => {
            if (header.contains(event.target)) {
              clickedOnAnyHeader = true;
            }
          });
          
          // Only close if not clicked on any doctor header
          if (!clickedOnAnyHeader) {
            setExpandedDoctorId(null);
          }
        }
      }
    };
    
    // Add listener only when there is an expanded doctor
    if (expandedDoctorId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedDoctorId]);

  // Handle global search
  const handleGlobalSearch = (searchTerm) => {
    setGlobalSearch(searchTerm);
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const term = searchTerm.toLowerCase();
    
    // Search in patients
    const patientResults = patients.filter(patient =>
      patient.full_name.toLowerCase().includes(term)
    ).slice(0, 3);

    // Search in doctors
    const doctorResults = allDoctors.filter(doctor =>
      doctor.name.toLowerCase().includes(term)
    ).slice(0, 3);

    // Search in appointments
    const appointmentResults = allAppointments.filter(apt =>
      apt.patient_name.toLowerCase().includes(term) ||
      apt.doctor_name.toLowerCase().includes(term)
    ).slice(0, 3);

    setSearchResults([
      {
        type: 'Patients',
        items: patientResults.map(patient => ({
          id: patient.id,
          title: patient.full_name,
          subtitle: patient.department || 'No department',
          type: 'patient'
        }))
      },
      {
        type: 'Doctors',
        items: doctorResults.map(doctor => ({
          id: doctor.id,
          title: doctor.name,
          subtitle: doctor.department,
          type: 'doctor'
        }))
      },
      {
        type: 'Appointments',
        items: appointmentResults.map(apt => ({
          id: apt.id,
          title: `${apt.patient_name} with Dr. ${apt.doctor_name}`,
          subtitle: format(new Date(apt.appointment_time), 'PPp'),
          type: 'appointment',
          patientName: apt.patient_name,
          appointmentTime: apt.appointment_time
        }))
      }
    ]);
    
    setShowSearchResults(true);
  };

  const handleSearchResultClick = (result) => {
    setShowSearchResults(false);
    setGlobalSearch('');
    setSearchResults([]);

    // Reset all search states
    setPatientSearch('');
    setSearchTerm('');
    setSelectedDepartmentFilter('');
    setSelectedDepartmentDoctor('');

    // Variables for appointment handling
    let appointmentText;
    let doctorNameMatch;
    let doctorName;
    let appointment;
    let cleanDoctorName;
    let appointmentDate;
    let patientToHighlight = null;

    // Navigate to the appropriate section
    switch (result.type) {
      case 'patient':
        setView('patients');
        // Set the patient search after a small delay to ensure the view has changed
        setTimeout(() => setPatientSearch(result.title), 100);
        break;
      case 'doctor':
        setView('doctors');
        // Set the doctor search after a small delay to ensure the view has changed
        // Pass an empty string for department to show all departments
        setTimeout(() => {
          setSearchTerm(result.title);
          // Apply the filter directly
          handleDoctorFilters(result.title, '');
        }, 100);
        break;
      case 'appointment':
        // Store patient name for highlighting in popup
        patientToHighlight = result.patientName;
        console.log("Storing patient name for highlight:", patientToHighlight);
        
        // Extract the doctor name from the appointment title
        appointmentText = result.title;
        doctorNameMatch = appointmentText.match(/with Dr\.?\s*(.+?)$/i);
        
        if (doctorNameMatch && doctorNameMatch[1]) {
          doctorName = doctorNameMatch[1].trim();
          
          // Find the EXACT appointment by patient name and doctor name
          appointment = allAppointments.find(apt => 
            apt.patient_name === patientToHighlight && 
            apt.doctor_name.toLowerCase().includes(doctorName.toLowerCase())
          ) || allAppointments.find(apt => apt.id === result.id);
          
          if (appointment) {
            // Navigate to appointments view
            setView('appointments');
            
            // Find the correct department for this doctor by checking all appointments
            const doctorAppointments = allAppointments.filter(apt => 
              apt.doctor_name.toLowerCase().includes(doctorName.toLowerCase())
            );
            
            // Get the department from matching appointments if possible
            const departmentFromAppointments = doctorAppointments.length > 0 
              ? doctorAppointments[0].department 
              : appointment.department;
            
            console.log("Found doctor in department:", departmentFromAppointments);
            
            // Set the department to filter appointments
            setTimeout(() => {
              // Set the selected department
              setSelectedDepartment(departmentFromAppointments);
              
              // After department is set, expand the doctor's calendar
              setTimeout(() => {
                // Clean doctor name if needed (remove Dr. prefix if present)
                cleanDoctorName = doctorName.replace(/^Dr\.?\s*/i, '');
                
                // Check if this doctor exists in the current appointmentsByDoctor
                const departmentAppointments = allAppointments.filter(apt => 
                  apt.department === departmentFromAppointments
                );
                
                // Find all available doctor names in this department for comparison
                const doctorNamesInDept = [...new Set(departmentAppointments.map(apt => {
                  return apt.doctor_name.replace(/^Dr\.?\s*/i, '');
                }))];
                
                // Debug doctor names
                console.log("Looking for doctor:", cleanDoctorName);
                console.log("Available doctors in", departmentFromAppointments + ":", doctorNamesInDept);
                
                // Try to find the closest match if exact match fails
                const exactMatch = doctorNamesInDept.find(name => 
                  name.toLowerCase().includes(cleanDoctorName.toLowerCase()) ||
                  cleanDoctorName.toLowerCase().includes(name.toLowerCase())
                );
                
                if (exactMatch) {
                  console.log("Found match:", exactMatch);
                  setExpandedDoctorId(exactMatch);
                  
                  // Get the appointment date to focus on correct month
                  appointmentDate = new Date(appointment.appointment_time);
                  setCurrentMonth(new Date(
                    appointmentDate.getFullYear(),
                    appointmentDate.getMonth(),
                    1
                  ));
                  
                  // After calendar is rendered, simulate a click on the date with the appointment
                  setTimeout(() => {
                    // Get the appointment date and format it
                    const appointmentDay = appointmentDate.getDate();
                    const appointmentMonth = appointmentDate.getMonth() + 1; // 1-based month
                    
                    console.log(`Looking for day ${appointmentDay} in month ${appointmentMonth}`);
                    console.log(`Appointment time: ${appointment.appointment_time}`);
                    
                    // Try to find and click the calendar day multiple times
                    let attempts = 0;
                    const maxAttempts = 10;
                    
                    const findAndClickDay = () => {
                      attempts++;
                      
                      // Only proceed if the doctor's calendar is expanded
                      if (!calendarRefs.current[exactMatch]) {
                        if (attempts < maxAttempts) {
                          console.log(`Calendar not yet rendered, trying again... (attempt ${attempts})`);
                          setTimeout(findAndClickDay, 300);
                        } else {
                          console.log("Max attempts reached, couldn't find calendar");
                        }
                        return;
                      }
                      
                      // Find the calendar container
                      const calendarContainer = calendarRefs.current[exactMatch];
                      
                      // Get all calendar days
                      const allCalendarDays = calendarContainer.querySelectorAll('.calendar-day');
                      let dayFound = false;
                      
                      // First try: Look for the exact appointment day
                      allCalendarDays.forEach(dayElement => {
                        if (dayFound) return; // Skip if already found
                        
                        const dayNumber = dayElement.querySelector('.day-number');
                        if (!dayNumber) return;
                        
                        const dayText = dayNumber.textContent.trim();
                        const day = parseInt(dayText, 10);
                        
                        if (day === appointmentDay) {
                          // Check if this day is clickable (has appointments)
                          if (dayElement.classList.contains('clickable')) {
                            console.log(`Found day ${day}, clicking it`);
                            // Add custom data attribute to help popup logic find the right patient
                            dayElement.setAttribute('data-highlight-patient', patientToHighlight);
                            // Trigger a click on this day
                            dayElement.click();
                            dayFound = true;
                          } else {
                            console.log(`Found day ${day} but it's not clickable`);
                          }
                        }
                      });
                      
                      // Second try: If exact day isn't clickable, find a day that has this patient's appointment
                      if (!dayFound) {
                        console.log("Exact day not clickable, looking for any day with this patient's appointment");
                        
                        // Get all the doctor's appointments for this patient
                        const patientAppointments = allAppointments.filter(apt => 
                          apt.doctor_name.replace(/^Dr\.?\s*/i, '') === exactMatch && 
                          apt.patient_name === patientToHighlight
                        );
                        
                        if (patientAppointments.length > 0) {
                          console.log(`Found ${patientAppointments.length} appointments for this patient with this doctor`);
                          
                          // Try each appointment date
                          for (const patApt of patientAppointments) {
                            if (dayFound) break;
                            
                            const patAptDate = new Date(patApt.appointment_time);
                            const patAptDay = patAptDate.getDate();
                            
                            console.log(`Trying alternative date: day ${patAptDay}`);
                            
                            // Look for this day in the calendar
                            allCalendarDays.forEach(dayElement => {
                              if (dayFound) return;
                              
                              const dayNumber = dayElement.querySelector('.day-number');
                              if (!dayNumber) return;
                              
                              const dayText = dayNumber.textContent.trim();
                              const day = parseInt(dayText, 10);
                              
                              if (day === patAptDay && dayElement.classList.contains('clickable')) {
                                console.log(`Found alternative day ${day}, clicking it`);
                                dayElement.setAttribute('data-highlight-patient', patientToHighlight);
                                dayElement.click();
                                dayFound = true;
                              }
                            });
                          }
                        }
                      }
                      
                      // Third try: If still not found, click ANY clickable day as fallback
                      if (!dayFound) {
                        console.log("No specific day found, looking for any clickable day");
                        
                        allCalendarDays.forEach(dayElement => {
                          if (dayFound) return;
                          
                          if (dayElement.classList.contains('clickable')) {
                            const dayNumber = dayElement.querySelector('.day-number');
                            if (!dayNumber) return;
                            
                            console.log(`Clicking first available clickable day: ${dayNumber.textContent.trim()}`);
                            dayElement.setAttribute('data-highlight-patient', patientToHighlight);
                            dayElement.click();
                            dayFound = true;
                          }
                        });
                      }
                      
                      if (!dayFound && attempts < maxAttempts) {
                        console.log(`Day ${appointmentDay} not found or not clickable, attempt ${attempts}`);
                        setTimeout(findAndClickDay, 300);
                      } else if (!dayFound) {
                        console.log("Max attempts reached, couldn't find calendar date to click");
                      }
                    };
                    
                    // Start trying to find and click the day
                    setTimeout(findAndClickDay, 500);
                  }, 800);
                } else {
                  // Use the doctor_name directly from the appointment
                  const appointmentDoctorName = appointment.doctor_name.replace(/^Dr\.?\s*/i, '');
                  console.log("Using appointment doctor name:", appointmentDoctorName);
                  setExpandedDoctorId(appointmentDoctorName);
                  
                  // Get the appointment date to focus on correct month
                  appointmentDate = new Date(appointment.appointment_time);
                  setCurrentMonth(new Date(
                    appointmentDate.getFullYear(),
                    appointmentDate.getMonth(),
                    1
                  ));
                  
                  // After calendar is rendered, simulate a click on the date with the appointment
                  setTimeout(() => {
                    // Get the appointment date and format it
                    const appointmentDay = appointmentDate.getDate();
                    const appointmentMonth = appointmentDate.getMonth() + 1; // 1-based month
                    
                    console.log(`Looking for day ${appointmentDay} in month ${appointmentMonth}`);
                    console.log(`Appointment time: ${appointment.appointment_time}`);
                    
                    // Try to find and click the calendar day multiple times
                    let attempts = 0;
                    const maxAttempts = 10;
                    
                    const findAndClickDay = () => {
                      attempts++;
                      
                      // Only proceed if the doctor's calendar is expanded
                      if (!calendarRefs.current[appointmentDoctorName]) {
                        if (attempts < maxAttempts) {
                          console.log(`Calendar not yet rendered, trying again... (attempt ${attempts})`);
                          setTimeout(findAndClickDay, 300);
                        } else {
                          console.log("Max attempts reached, couldn't find calendar");
                        }
                        return;
                      }
                      
                      // Find the calendar container
                      const calendarContainer = calendarRefs.current[appointmentDoctorName];
                      
                      // Get all calendar days
                      const allCalendarDays = calendarContainer.querySelectorAll('.calendar-day');
                      let dayFound = false;
                      
                      // First try: Look for the exact appointment day
                      allCalendarDays.forEach(dayElement => {
                        if (dayFound) return; // Skip if already found
                        
                        const dayNumber = dayElement.querySelector('.day-number');
                        if (!dayNumber) return;
                        
                        const dayText = dayNumber.textContent.trim();
                        const day = parseInt(dayText, 10);
                        
                        if (day === appointmentDay) {
                          // Check if this day is clickable (has appointments)
                          if (dayElement.classList.contains('clickable')) {
                            console.log(`Found day ${day}, clicking it`);
                            // Add custom data attribute to help popup logic find the right patient
                            dayElement.setAttribute('data-highlight-patient', patientToHighlight);
                            // Trigger a click on this day
                            dayElement.click();
                            dayFound = true;
                          } else {
                            console.log(`Found day ${day} but it's not clickable`);
                          }
                        }
                      });
                      
                      // Second try: If exact day isn't clickable, find a day that has this patient's appointment
                      if (!dayFound) {
                        console.log("Exact day not clickable, looking for any day with this patient's appointment");
                        
                        // Get all the doctor's appointments for this patient
                        const patientAppointments = allAppointments.filter(apt => 
                          apt.doctor_name.replace(/^Dr\.?\s*/i, '') === appointmentDoctorName && 
                          apt.patient_name === patientToHighlight
                        );
                        
                        if (patientAppointments.length > 0) {
                          console.log(`Found ${patientAppointments.length} appointments for this patient with this doctor`);
                          
                          // Try each appointment date
                          for (const patApt of patientAppointments) {
                            if (dayFound) break;
                            
                            const patAptDate = new Date(patApt.appointment_time);
                            const patAptDay = patAptDate.getDate();
                            
                            console.log(`Trying alternative date: day ${patAptDay}`);
                            
                            // Look for this day in the calendar
                            allCalendarDays.forEach(dayElement => {
                              if (dayFound) return;
                              
                              const dayNumber = dayElement.querySelector('.day-number');
                              if (!dayNumber) return;
                              
                              const dayText = dayNumber.textContent.trim();
                              const day = parseInt(dayText, 10);
                              
                              if (day === patAptDay && dayElement.classList.contains('clickable')) {
                                console.log(`Found alternative day ${day}, clicking it`);
                                dayElement.setAttribute('data-highlight-patient', patientToHighlight);
                                dayElement.click();
                                dayFound = true;
                              }
                            });
                          }
                        }
                      }
                      
                      // Third try: If still not found, click ANY clickable day as fallback
                      if (!dayFound) {
                        console.log("No specific day found, looking for any clickable day");
                        
                        allCalendarDays.forEach(dayElement => {
                          if (dayFound) return;
                          
                          if (dayElement.classList.contains('clickable')) {
                            const dayNumber = dayElement.querySelector('.day-number');
                            if (!dayNumber) return;
                            
                            console.log(`Clicking first available clickable day: ${dayNumber.textContent.trim()}`);
                            dayElement.setAttribute('data-highlight-patient', patientToHighlight);
                            dayElement.click();
                            dayFound = true;
                          }
                        });
                      }
                      
                      if (!dayFound && attempts < maxAttempts) {
                        console.log(`Day ${appointmentDay} not found or not clickable, attempt ${attempts}`);
                        setTimeout(findAndClickDay, 300);
                      } else if (!dayFound) {
                        console.log("Max attempts reached, couldn't find calendar date to click");
                      }
                    };
                    
                    // Start trying to find and click the day
                    setTimeout(findAndClickDay, 500);
                  }, 800);
                }
              }, 500); // Increased timeout to ensure department is fully set
            }, 300); // Increased timeout
          } else {
            // If no matching appointment found, search for the doctor directly
            const doctorAppointments = allAppointments.filter(apt => 
              apt.doctor_name.toLowerCase().includes(doctorName.toLowerCase())
            );
            
            if (doctorAppointments.length > 0) {
              // Navigate to appointments view
              setView('appointments');
              
              // Use the first matching appointment's department
              const departmentFromDoctor = doctorAppointments[0].department;
              
              setTimeout(() => {
                setSelectedDepartment(departmentFromDoctor);
                
                setTimeout(() => {
                  // Clean doctor name
                  const cleanDoctorName = doctorName.replace(/^Dr\.?\s*/i, '');
                  
                  // Find the correct doctor name in department
                  const departmentAppointments = allAppointments.filter(apt => 
                    apt.department === departmentFromDoctor
                  );
                  
                  // Get unique doctor names in this department
                  const doctorNames = [...new Set(departmentAppointments.map(apt => 
                    apt.doctor_name.replace(/^Dr\.?\s*/i, '')
                  ))];
                  
                  const matchingDoctorName = doctorNames.find(name => 
                    name.toLowerCase().includes(cleanDoctorName.toLowerCase()) ||
                    cleanDoctorName.toLowerCase().includes(name.toLowerCase())
                  );
                  
                  if (matchingDoctorName) {
                    setExpandedDoctorId(matchingDoctorName);
                  }
                  
                  // Set calendar to current month
                  const appointmentDate = new Date(doctorAppointments[0].appointment_time);
                  setCurrentMonth(new Date(
                    appointmentDate.getFullYear(),
                    appointmentDate.getMonth(),
                    1
                  ));
                }, 800);
              }, 300);
            } else {
              setView('appointments');
            }
          }
        } else {
          setView('appointments');
        }
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = () => {
    // Reset all filters and search states
    setPatientSearch('');
    setSearchTerm('');
    setSelectedDepartmentFilter('');
    setSelectedDepartmentDoctor('');
    setGlobalSearch('');
    setSearchResults([]);
    setShowSearchResults(false);
    
    // Reset appointment filters
    setSelectedDepartment('');
    setSelectedDoctor(null);
    setSelectedDate(new Date());
    
    // Reset any active states
    setExpandedDoctorId(null);
    setShowNotifications(false);
    setDropdownOpen(false);

    // Refresh data based on current view
    switch (view) {
      case 'patients':
        setLoadingPatients(true);
        fetchWithRetry('https://medical-assistant1.onrender.com/patients')
          .then(data => {
            setPatients(data.patients || []);
            setFilteredPatients(data.patients || []);
          })
          .finally(() => setLoadingPatients(false));
        break;
      case 'doctors':
        setLoading(prev => ({ ...prev, doctors: true }));
        fetchWithRetry('https://medical-assistant1.onrender.com/doctors')
          .then(data => {
            const filteredDoctors = (data.doctors || []).filter(doctor => 
              !doctor.department.toLowerCase().includes('temp') && 
              !doctor.name.toLowerCase().includes('temp')
            );
            setAllDoctors(filteredDoctors);
            setFilteredDoctors(filteredDoctors);
          })
          .finally(() => setLoading(prev => ({ ...prev, doctors: false })));
        break;
      case 'appointments':
        setLoadingAllAppointments(true);
        fetchWithRetry('https://medical-assistant1.onrender.com/appointments')
          .then(response => {
            setAllAppointments(response.appointments || []);
          })
          .finally(() => setLoadingAllAppointments(false));
        break;
      case 'dashboard':
        setLoadingStats(true);
        Promise.all([
          fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/stats'),
          fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/appointments-by-department'),
          fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/weekly-distribution'),
          fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/doctor-workload'),
          fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/age-distribution')
        ]).then(([stats, deptStats, weeklyDist, workload, ageDist]) => {
          setDashboardStats(stats.stats);
          setDashboardData({
            departmentStats: deptStats.data,
            weeklyDistribution: weeklyDist.data,
            doctorWorkload: workload.data,
            ageDistribution: ageDist.data,
          });
        }).finally(() => {
          setLoadingStats(false);
          setLoadingDashboardData({
            departmentStats: false,
            weeklyDistribution: false,
            doctorWorkload: false,
            ageDistribution: false,
          });
        });
        break;
    }
  };

  // Render today's appointment details for dashboard
  const _renderTodayAppointmentDetails = () => {
    if (loadingNewDashboard.appointments) {
      return <div className="loading-state">Loading today's appointments...</div>;
    }
    
    if (todayAppointments.length === 0) {
      return <div className="no-data-message">No appointments scheduled for today</div>;
    }
    
    return (
      <div className="today-appointments-list">
        {todayAppointments.map((appointment, index) => (
          <div key={appointment.id || index} className="today-appointment-item">
            <div className="appointment-time-badge">
              {new Date(appointment.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
            <div className="appointment-details-container">
              <div className="appointment-patient-name">{appointment.patient_name}</div>
              <div className="appointment-info-row">
                <span className="appointment-info-label">Doctor:</span>
                <span className="appointment-info-value">{appointment.doctor_name}</span>
              </div>
              <div className="appointment-info-row">
                <span className="appointment-info-label">Department:</span>
                <span className="appointment-info-value">{appointment.department}</span>
              </div>
              <div className="appointment-info-row">
                <span className="appointment-info-label">Reason:</span>
                <span className="appointment-info-value">{appointment.reason || "General Checkup"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Fetch appointment status counts (completed vs upcoming)
  useEffect(() => {
    const fetchAppointmentStatusCounts = async () => {
      setLoadingNewDashboard(prev => ({ ...prev, patientStats: true }));
      try {
        // Fetch all appointments
        const data = await fetchWithRetry('https://medical-assistant1.onrender.com/appointments');
        
        if (!data.appointments || !Array.isArray(data.appointments)) {
          throw new Error('No appointment data available');
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Count completed and upcoming appointments
        let completedCount = 0;
        let upcomingCount = 0;
        
        data.appointments.forEach(appointment => {
          const appointmentDate = new Date(appointment.appointment_time);
          appointmentDate.setHours(0, 0, 0, 0);
          
          if (appointmentDate < today) {
            completedCount++;
          } else {
            upcomingCount++;
          }
        });
        
        setAppointmentsStatus({
          completed: completedCount,
          upcoming: upcomingCount
        });

        // Generate trend data for the past 7 days
        const trendLabels = [];
        const completedTrend = [];
        const upcomingTrend = [];

        // Get dates for the past 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const dateStr = format(date, 'MMM dd');
          trendLabels.push(dateStr);
          
          // Count appointments for this date
          let completedForDay = 0;
          let upcomingForDay = 0;
          
          data.appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.appointment_time);
            appointmentDate.setHours(0, 0, 0, 0);
            
            // Check if appointment is on this date
            if (appointmentDate.getTime() === date.getTime()) {
              if (date < today) {
                completedForDay++;
              } else {
                upcomingForDay++;
              }
            }
          });
          
          completedTrend.push(completedForDay);
          upcomingTrend.push(upcomingForDay);
        }
        
        setAppointmentTrends({
          labels: trendLabels,
          completed: completedTrend,
          upcoming: upcomingTrend
        });
      } catch (error) {
        console.error('Error fetching appointment status counts:', error);
        setAppointmentsStatus({
          completed: 0,
          upcoming: 0
        });
        setAppointmentTrends({
          labels: [],
          completed: [],
          upcoming: []
        });
      } finally {
        setLoadingNewDashboard(prev => ({ ...prev, patientStats: false }));
      }
    };

    if (view === 'dashboard' && !showLogin) {
      fetchAppointmentStatusCounts();
    }
  }, [view, showLogin]);

  // Add a new state for doctors by department
  const [doctorsByDepartment, setDoctorsByDepartment] = useState([]);

  // Fetch doctors by department stats
  useEffect(() => {
    const fetchDoctorsByDepartment = async () => {
      try {
        // Fetch all doctors
        const data = await fetchWithRetry('https://medical-assistant1.onrender.com/doctors');
        
        if (!data.doctors) {
          throw new Error('No doctors data available');
        }
        
        // Count doctors by department and filter out temp departments
        const departmentCounts = {};
        data.doctors.forEach(doctor => {
          const department = doctor.department;
          // Skip temp departments or doctors
          if (department && !department.toLowerCase().includes('temp') && 
              !doctor.name.toLowerCase().includes('temp')) {
            departmentCounts[department] = (departmentCounts[department] || 0) + 1;
          }
        });
        
        // Sort departments by count (descending)
        const sortedDepartments = Object.entries(departmentCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count }));
        
        setDoctorsByDepartment(sortedDepartments);
      } catch (error) {
        console.error('Error fetching doctors by department:', error);
        setDoctorsByDepartment([]);
      }
    };

    if (view === 'dashboard' && !showLogin) {
      fetchDoctorsByDepartment();
    }
  }, [view, showLogin]);

  // Add a useEffect to scroll to the expanded doctor section
  useEffect(() => {
    if (expandedDoctorId && calendarRefs.current[expandedDoctorId]) {
      // Scroll the expanded section into view with smooth behavior
      calendarRefs.current[expandedDoctorId].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest'
      });
    }
  }, [expandedDoctorId]);

  if (showLogin) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <Stethoscope className="icon-header" size={33} />
          <h1 className="main-title">
            {userRole === 'admin' ? 'Medical Appointment Dashboard' : `Welcome, ${loggedInUser?.name}`}
          </h1>
        </div>
  
        <div className="header-content">
          {userRole === 'admin' && (
            <div className="global-search" ref={searchRef}>
              <Search className="global-search-icon" size={18} />
              <input
                type="text"
                className="global-search-input"
                placeholder="Search patients, doctors, appointments..."
                value={globalSearch}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSearchResults(false);
                    setGlobalSearch('');
                    setSearchResults([]);
                  } else if (e.key === 'Enter') {
                    // When Enter is pressed, try to find a doctor matching the search term
                    const searchTerm = globalSearch.toLowerCase();
                    
                    // Check if the search might be for a doctor
                    const isDoctorSearch = searchTerm.includes('dr') || 
                      searchTerm.includes('doctor') || 
                      allDoctors.some(doctor => 
                        doctor.name.toLowerCase().includes(searchTerm));
                    
                    // Check if the search might be for an appointment
                    const isAppointmentSearch = searchTerm.includes('appointment') ||
                      searchTerm.includes('with dr') ||
                      searchResults.some(group => 
                        group.type === 'Appointments' && group.items.length > 0);
                    
                    if (isAppointmentSearch) {
                      // Try to find a matching appointment from search results
                      const appointmentResults = searchResults.find(group => group.type === 'Appointments');
                      if (appointmentResults && appointmentResults.items.length > 0) {
                        // Hide search results
                        setShowSearchResults(false);
                        
                        // Find best matching appointment
                        const bestMatch = appointmentResults.items.find(item => 
                          item.title.toLowerCase().includes(searchTerm.toLowerCase())
                        ) || appointmentResults.items[0];
                        
                        console.log("Selected appointment:", bestMatch.title);
                        
                        // Use the existing handler to navigate to the appointment
                        handleSearchResultClick(bestMatch);
                        
                        // Reset the global search
                        setGlobalSearch('');
                        
                        e.preventDefault();
                        return;
                      }
                    }
                    
                    if (isDoctorSearch) {
                      // Hide search results
                      setShowSearchResults(false);
                      
                      // Navigate to doctors view first
                      setView('doctors');
                      
                      // Apply the search filter directly after a small delay
                      // to ensure the doctors view is loaded
                      setTimeout(() => {
                        setSearchTerm(globalSearch);
                        // Call handleDoctorFilters directly to apply the filter
                        handleDoctorFilters(globalSearch, '');
                      }, 100);
                      
                      // Reset the global search
                      setGlobalSearch('');
                      
                      e.preventDefault();
                    }
                  }
                }}
              />
              {showSearchResults && searchResults.some(group => group.items.length > 0) && (
                <div className="search-results active">
                  {searchResults.map((group, index) => (
                    group.items.length > 0 && (
                      <div key={index} className="search-result-group">
                        <div className="search-result-group-title">{group.type}</div>
                        {group.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="search-result-item"
                            onClick={() => handleSearchResultClick(item)}
                          >
                            <div className="search-result-icon">
                              {item.type === 'patient' ? <Users size={18} /> :
                                item.type === 'doctor' ? <Stethoscope size={18} /> :
                                <CalendarDays size={18} />}
                            </div>
                            <div className="search-result-content">
                              <div className="search-result-title">{item.title}</div>
                              <div className="search-result-subtitle">{item.subtitle}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
  
          <div className="header-right">
            {userRole === 'admin' && (
              <div className="notification-container" ref={notificationRef}>
                <button
                  className="notification-btn"
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                </button>
                {showNotifications && (
                  <div className="notification-dropdown active">
                    <div className="notification-header">
                      <span className="notification-title">Notifications</span>
                      <span className="mark-all-read">Mark all as read</span>
                    </div>
                    <div className="empty-notifications">
                      <div className="empty-notifications-icon">
                        <BellOff size={32} />
                      </div>
                      <p>No new notifications</p>
                    </div>
                  </div>
                )}
              </div>
            )}
  
            <div className="admin-dropdown" ref={dropdownRef}>
              <button 
                className="admin-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                <LogOut size={20} style={{ marginRight: 6 }} />
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>  

      <div className="body-container">
        {userRole === 'admin' && (
          <nav className="navbar">
            <button 
              className="refresh-btn"
              onClick={handleRefresh}
              title="Reset all filters"
            >
              <RefreshCw size={18} />
            </button>
            <div className="nav-links">
              <div 
                className={`nav-link ${view === 'dashboard' ? 'active' : ''}`}
                onClick={() => setView('dashboard')}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </div>
              <div 
                className={`nav-link ${view === 'patients' ? 'active' : ''}`}
                onClick={() => setView('patients')}
              >
                <Users size={20} />
                <span>Patients</span>
              </div>
              <div 
                className={`nav-link ${view === 'doctors' ? 'active' : ''}`}
                onClick={() => setView('doctors')}
              >
                <Stethoscope size={20} />
                <span>Doctors</span>
              </div>
              <div 
                className={`nav-link ${view === 'appointments' ? 'active' : ''}`}
                onClick={() => {
                  setView('appointments');
                  setSelectedDepartment('');
                }}
              >
                <CalendarDays size={20} />
                <span>Appointments</span>
              </div>
            </div>
          </nav>
        )}

        <main className="main-content">
          {error && <div className="error-alert">{error}</div>}
          {renderMainContent()}
        </main>

        {/* Doctor Profile Modal - Moved outside main-content to slide in from body-container */}
        <div 
          className={`modal-overlay ${selectedDoctor ? 'open' : ''}`} 
          onClick={() => setSelectedDoctor(null)}
        >
          <div className="doctor-profile-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedDoctor(null)}>
              <X size={24} />
            </button>
            
            {selectedDoctor && (
              <>
                <div className="doctor-profile-header">
                  <div className="doctor-profile-avatar">
                    <FaUserMd size={32} />
                  </div>
                  <div className="doctor-profile-info">
                    <h2>{selectedDoctor.name}</h2>
                    <p className="doctor-specialization">{selectedDoctor.department}</p>
                    <p className="doctor-qualification">MD, MBBS</p>
                  </div>
                </div>

                <div className="doctor-profile-content">
                  <div className="profile-section">
                    <h3>About</h3>
                    <p>{getDoctorProfessionalDetails(selectedDoctor).about}</p>
                  </div>

                  <div className="profile-section">
                    <h3>Professional Details</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Experience</span>
                        <span className="detail-value">10+ years</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Registration No.</span>
                        <span className="detail-value">{getDoctorProfessionalDetails(selectedDoctor).registrationNumber}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Languages</span>
                        <span className="detail-value">English, Hindi</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3>Education & Training</h3>
                    <div className="education-list">
                      {getDoctorProfessionalDetails(selectedDoctor).education.map((edu, index) => (
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
                      {getDoctorProfessionalDetails(selectedDoctor).certifications.map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="profile-section">
                    <h3>Areas of Expertise</h3>
                    <div className="expertise-tags">
                      {getDoctorProfessionalDetails(selectedDoctor).expertise.map((exp, index) => (
                        <span key={index} className="expertise-tag">{exp}</span>
                      ))}
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3>Available Timings</h3>
                    <div className="timings-grid">
                      {doctorAvailability ? (
                        Object.entries(doctorAvailability).map(([day, times]) => (
                          <div key={day} className="timing-item">
                            <div className="timing-day">
                              {day === 'Mon' ? 'Monday' :
                               day === 'Tue' ? 'Tuesday' :
                               day === 'Wed' ? 'Wednesday' :
                               day === 'Thu' ? 'Thursday' :
                               day === 'Fri' ? 'Friday' :
                               day === 'Sat' ? 'Saturday' : 'Sunday'}
                            </div>
                            <div className="timing-slots">
                              {times ? (
                                <span className="timing-slot">
                                  {`${times.start} - ${times.end}`}
                                </span>
                              ) : (
                                <span className="timing-closed">Closed</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <div key={day} className="timing-item">
                            <div className="timing-day">{day}</div>
                            <div className="timing-slots">
                              <span className="timing-closed">Loading...</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
