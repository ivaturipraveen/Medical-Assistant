import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import profileImg from '../assets/profile.svg'; // Correct path to profile image
import notifyIcon from '../assets/notify.svg'; // Correct path to notification icon
import headlineIcon from '../assets/Headline.svg'; // Correct path to logo
import { Home, CalendarDays, Users, MessageCircle, ChevronDown, Search } from 'lucide-react'; // Import necessary icons

const DoctorTopbar = () => {
   const navigate = useNavigate(); 
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const toggleDropdown = () => setIsDropdownVisible(!isDropdownVisible);

  return (
    <header className="w-full h-[64px] bg-white fixed shadow-sm flex z-50 justify-center">
      <div className="w-full font-sf max-w-[1440px] px-6 flex items-center justify-between">
        {/* Left: Logo + Static Names */}
        <div className="flex items-center gap-10">
          <img
            src={headlineIcon}
            alt="Headline Logo"
            className="w-[189px] h-[24px] cursor-pointer"
          />
          <div className="flex items-center gap-2 text-sm">
            {/* Static Components without any onClick */}
            <button  onClick={()=>navigate('/doctor-dashboard')}  className="flex items-center gap-1 px-4 py-2 rounded-full text-gray-700">
              <Home className="w-4 h-4" /><span>Dashboard</span>
            </button>
            <button className="flex items-center gap-1 px-4 py-2 rounded-full text-gray-700">
              <CalendarDays className="w-4 h-4" /><span>Appointments</span>
            </button>
            <button    onClick={() => navigate('/patientData')}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-gray-700">
              <Users className="w-4 h-4" /><span>Patients</span>
            </button>

    


            <button className="flex items-center gap-1 px-4 py-2 rounded-full text-gray-700">
              <MessageCircle className="w-4 h-4" /><span>Messages</span>
            </button>
          </div>
        </div>

        {/* Right: Search & Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#e6f4f1] rounded-full px-3 w-[280px] h-[40px] relative">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search Patients, Messages.."
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
              <div className="absolute top-[40px] right-0 w-32 bg-white border border-gray-300 rounded-md shadow-md z-10">
                <div onClick={toggleDropdown} className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
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
