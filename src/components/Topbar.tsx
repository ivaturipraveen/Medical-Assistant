import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import profileImg from '../assets/profile.svg';
import notifyIcon from '../assets/notify.svg';
import headlineIcon from '../assets/Headline.svg';
import {
  CalendarDays,
  User,
  Users,
  ChevronDown,
  Search,
  Stethoscope,
  CalendarDaysIcon,
} from 'lucide-react';
import homeicon from '../assets/HomeIcon.svg';

interface Suggestion {
  name: string;
  type: 'doctor' | 'patient' | 'appointments';
  title: string;
  subtitle: string;
}

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [globalSearch, setGlobalSearch] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('search') || '';
    setGlobalSearch(query);
  }, [location.search]);

  useEffect(() => {
    fetch('https://medical-assistant1.onrender.com/doctors')
      .then((res) => res.json())
      .then((data) => setDoctors(data.doctors || []))
      .catch(console.error);

    fetch('https://medical-assistant1.onrender.com/patients')
      .then((res) => res.json())
      .then((data) => setPatients(data.patients || []))
      .catch(console.error);

    fetch('https://medical-assistant1.onrender.com/appointments')
      .then((res) => res.json())
      .then((data) => setAppointments(data.appointments || []))
      .catch(console.error);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setGlobalSearch(query);

    if (query.trim()) {
      const matchedSuggestions: Suggestion[] = [];

      // Doctors
      doctors.forEach((doc) => {
        if (doc.name.toLowerCase().includes(query.toLowerCase())) {
          matchedSuggestions.push({
            name: doc.name,
            type: 'doctor',
            title: doc.name,
            subtitle: doc.department || '',
          });
        }
      });

      // Patients
      patients.forEach((p) => {
        if (p.full_name.toLowerCase().includes(query.toLowerCase())) {
          matchedSuggestions.push({
            name: p.full_name,
            type: 'patient',
            title: p.full_name,
            subtitle: `Doctor: ${p.doctor_name || 'Unknown'}`,
          });
        }
      });

      // Appointments
      appointments.forEach((appt) => {
        if (
          appt.doctor_name.toLowerCase().includes(query.toLowerCase()) ||
          appt.patient_name.toLowerCase().includes(query.toLowerCase())
        ) {
          matchedSuggestions.push({
            name: appt.appointment_id.toString(),
            type: 'appointments',
            title: `${appt.patient_name} with ${appt.doctor_name}`,
            subtitle: `Time: ${appt.appointment_time}`,
          });
        }
      });

      setSuggestions(matchedSuggestions);
      setShowSearchResults(true);
    } else {
      // Clear search suggestions
      setSuggestions([]);
      setShowSearchResults(false);

      // Clear ?search= from URL
      if (location.pathname.includes('/patients')) {
        navigate('/patients');
      } else if (location.pathname.includes('/doctor')) {
        navigate('/doctor');
      } else if (location.pathname.includes('/appointment')) {
        navigate('/appointment');
      }
    }
  };

  const handleSearchResultClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'doctor') {
      navigate(`/doctor?search=${encodeURIComponent(suggestion.name)}`);
    } else if (suggestion.type === 'patient') {
      navigate(`/patients?search=${encodeURIComponent(suggestion.name)}`);
    } else if (suggestion.type === 'appointments') {
      const appt = appointments.find(
        (appt) => appt.appointment_id.toString() === suggestion.name
      );
      if (appt) {
        const department = encodeURIComponent(appt.department);
        navigate(`/appointments/department/${department}`, {
          state: {
            fromSearch: true,
            doctorName: appt.doctor_name,
            selectedDate: appt.appointment_time, // pass date string
          },
        });
      }
    }
    setShowSearchResults(false);
  };

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const toggleDropdown = () => setIsDropdownVisible(!isDropdownVisible);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/');
  };

  // Ref for the dropdown to detect clicks outside
  const dropdownRef = useRef<HTMLDivElement | null>(null); // Explicitly typing the ref

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false); // Close the dropdown if the click is outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full h-[64px] bg-white fixed shadow-sm flex z-50 justify-center">
      <div className="w-full font-sf max-w-[1440px] px-6 flex items-center justify-between">
        {/* Left Nav */}
        <div className="flex items-center gap-10">
          <img
            src={headlineIcon}
            alt="Headline Logo"
            className="w-[189px] h-[24px] cursor-pointer"
            onClick={() => navigate('/dashboard')}
          />
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center px-4 py-2 rounded-full transition ${isActive('/dashboard') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}
            >
              <img src={homeicon} className="transition-all hover:fill-[#007C91]" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/appointment')}
              className={`flex items-center gap-1 px-4 py-2 rounded-full transition ${isActive('/appointment') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Appointments</span>
            </button>
            <button
              onClick={() => navigate('/doctor')}
              className={`flex items-center gap-1 px-4 py-2 rounded-full transition ${isActive('/doctor') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}
            >
              <User className="w-4 h-4" />
              <span>Doctors</span>
            </button>
            <button
              onClick={() => navigate('/patients')}
              className={`flex items-center gap-1 px-4 py-2 rounded-full transition ${isActive('/patients') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}
            >
              <Users className="w-4 h-4" />
              <span>Patients</span>
            </button>
          </div>
        </div>

        {/* Right Search & Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#e6f4f1] rounded-full px-3 w-[280px] h-[40px] relative">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={globalSearch}
              onChange={handleSearchChange}
              placeholder="Search Appointments, Doctors..etc"
              className="bg-transparent text-sm ml-2 outline-none placeholder:text-gray-400 w-full"
            />
            {showSearchResults && suggestions.length > 0 && (
              <div className="absolute top-[40px] left-0 w-full bg-white border border-gray-300 rounded-md shadow-md z-10">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => handleSearchResultClick(s)}
                    className="px-4 py-2 cursor-pointer hover:bg-[#E0F7FA] flex items-start"
                  >
                    <div className="mr-2 mt-0.5">
                      {s.type === 'patient' ? (
                        <Users size={18} />
                      ) : s.type === 'doctor' ? (
                        <Stethoscope size={18} />
                      ) : (
                        <CalendarDaysIcon size={18} />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{s.title}</div>
                      <div className="text-xs text-gray-500">{s.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative w-[40px] h-[40px] flex items-center justify-center">
            <img src={notifyIcon} alt="Notifications" />
          </div>

          <div className="relative">
            <div className="flex items-center pr-2 gap-1 cursor-pointer" onClick={toggleDropdown}>
              <img src={profileImg} alt="User profile" className="w-[40px] h-[40px] rounded-full object-cover" />
              <ChevronDown className="w-6 h-6 text-gray-500" />
            </div>

            {isDropdownVisible && (
              <div className="absolute top-[40px] right-0 w-32 bg-white border border-gray-300 rounded-md shadow-md z-10" ref={dropdownRef}>
                <div onClick={handleLogout} className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
