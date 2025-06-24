import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import profileImg from '../assets/profile.svg';
import notifyIcon from '../assets/notify.svg';
import headlineIcon from '../assets/Headline.svg';
import { Users, ChevronDown, Search } from 'lucide-react';
import homeicon from '../assets/Homeicon.svg';

const DoctorTopbar = () => {
  const navigate = useNavigate();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);  // Reference to the dropdown

  const toggleDropdown = () => setIsDropdownVisible(!isDropdownVisible);
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    // ✅ Clear session/localStorage
    localStorage.clear(); // or selectively clear: localStorage.removeItem('userRole'), etc.

    // ✅ Redirect to login
    navigate('/');
  };

  // Close dropdown if click is outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full h-[64px] bg-white fixed shadow-sm flex z-50 justify-center">
      <div className="w-full font-sf max-w-[1440px] px-6 flex items-center justify-between">
        {/* Left: Logo + Static Names */}
        <div className="flex items-center gap-10">
          <img
            src={headlineIcon}
            alt="Headline Logo"
            className="w-[189px] h-[24px]"
          />
          <div className="flex items-center gap-5 text-sm">
            <button
              onClick={() => navigate('/doctor-dashboard')}
              className={`flex items-center w-[103px] h-[40px] px-[5px] py-[8px] rounded-full text-sm transition-all ${isActive('/doctor-dashboard') ? 'bg-[#DAECED]' : 'bg-white hover:bg-[#b8dede]'}`}
            >
              <img src={homeicon}/>
              <span>Dashboard</span> 
            </button>
            <button
              onClick={() => navigate('/patientData')}
              className={`flex items-center gap-[6px] w-[103px] h-[40px] px-[12px] py-[8px] rounded-full text-sm transition-all ${isActive('/patientData') ? 'bg-[#DAECED]' : 'bg-white hover:bg-[#b8dede]'}`}
            >
              <Users className="w-4 h-4" />
              <span>Patients</span>
            </button>
          </div>
        </div>

        {/* Right: Search & Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#e6f4f1] rounded-full px-3 w-[280px] h-[40px] relative">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search Patients, Appointments.."
              className="bg-transparent text-sm ml-2 outline-none placeholder:text-gray-400 w-full"
            />
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
              <div
                ref={dropdownRef}  // Attach the ref to the dropdown
                className="absolute top-[40px] right-0 w-32 bg-white border border-gray-300 rounded-md shadow-md z-10"
              >
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
};

export default DoctorTopbar;
