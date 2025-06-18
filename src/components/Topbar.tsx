import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import profileImg from '../assets/profile.svg';
import notifyIcon from '../assets/notify.svg';
import headlineIcon from '../assets/Headline.svg';
import { Home, CalendarDays, User, Users, ChevronDown, Search, Stethoscope } from 'lucide-react';

interface Suggestion {
  name: string;
  type: 'doctor' | 'patient';
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

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('search') || '';
    setGlobalSearch(query);
  }, [location.search]);

  useEffect(() => {
    fetch('https://medical-assistant1.onrender.com/doctors')
      .then(res => res.json())
      .then(data => setDoctors(data.doctors || []))
      .catch(console.error);
    fetch('https://medical-assistant1.onrender.com/patients')
      .then(res => res.json())
      .then(data => setPatients(data.patients || []))
      .catch(console.error);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setGlobalSearch(query);
    if (query.trim()) {
      const matchedSuggestions: Suggestion[] = [];

      doctors.forEach(doc => {
        if (doc.name.toLowerCase().includes(query.toLowerCase())) {
          matchedSuggestions.push({
            name: doc.name,
            type: 'doctor',
            title: doc.name,
            subtitle: doc.department || ''
          });
        }
      });

      patients.forEach(p => {
        if (p.full_name.toLowerCase().includes(query.toLowerCase())) {
          matchedSuggestions.push({
            name: p.full_name,
            type: 'patient',
            title: p.full_name,
            subtitle: `Doctor: ${p.doctor_name || 'Unknown'}`
          });
        }
      });

      setSuggestions(matchedSuggestions);
      setShowSearchResults(true);
    } else {
      setSuggestions([]);
      setShowSearchResults(false);
    }
  };

  const handleSearchResultClick = (suggestion: Suggestion) => {
    if (suggestion.type === 'doctor') {
      navigate(`/doctor?search=${suggestion.name}`);
    } else {
      navigate(`/patients?search=${suggestion.name}`);
    }
    setShowSearchResults(false);
  };

  // Profile Dropdown functionality
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token'); // Example for clearing token
    navigate('/'); // Redirect to login page
  };

  return (
    <header className="w-full h-[64px] bg-white fixed shadow-sm flex z-50 justify-center">
      <div className="w-full font-sf max-w-[1440px] px-6 flex items-center justify-between">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <img
            src={headlineIcon}
            alt="Headline Logo"
            className="w-[189px] h-[24px] cursor-pointer"
            onClick={() => navigate('/dashboard')}
          />
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => navigate('/dashboard')} className={`flex items-center gap-1 px-4 py-2 rounded-full transition ${isActive('/dashboard') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}>
              <Home className="w-4 h-4" /><span>Dashboard</span>
            </button>
            <button onClick={() => navigate('/appointment')} className={`flex items-center gap-1 px-4 py-2 rounded-full transition ${isActive('/appointment') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}>
              <CalendarDays className="w-4 h-4" /><span>Appointments</span>
            </button>
            <button onClick={() => navigate('/doctor')} className={`flex items-center gap-1 px-4 py-2 rounded-full transition ${isActive('/doctor') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}>
              <User className="w-4 h-4" /><span>Doctors</span>
            </button>
            <button onClick={() => navigate('/patients')} className={`flex items-center gap-1 px-4 py-2 rounded-full transition ${isActive('/patients') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}>
              <Users className="w-4 h-4" /><span>Patients</span>
            </button>
          </div>
        </div>

        {/* Right: Search + Notifications + Profile */}
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
                      {s.type === 'patient' ? <Users size={18} /> : <Stethoscope size={18} />}
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

          {/* Profile Dropdown */}
          <div className="relative">
            <div className="flex items-center pr-2 gap-1 cursor-pointer" onClick={toggleDropdown}>
              <img src={profileImg} alt="User profile" className="w-[40px] h-[40px] rounded-full object-cover" />
              <ChevronDown className="w-6 h-6 text-gray-500" />
            </div>

            {isDropdownVisible && (
              <div className="absolute top-[40px] right-0 w-32 bg-white border border-gray-300 rounded-md shadow-md z-10">
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
