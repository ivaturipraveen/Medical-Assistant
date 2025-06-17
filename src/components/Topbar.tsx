import { useNavigate, useLocation } from 'react-router-dom';
import profileImg from '../assets/profile.svg';
import notifyIcon from '../assets/notify.svg';
import headlineIcon from '../assets/Headline.svg';
import {
  Home,
  CalendarDays,
  User,
  Users,
  ChevronDown,
  Search,
} from 'lucide-react';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex items-center gap-1 px-4 py-2 rounded-full transition
                ${isActive('/dashboard') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/appointment')}
              className={`flex items-center gap-1 px-4 py-2 rounded-full transition
                ${isActive('/appointment') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Appointments</span>
            </button>

            <button
              onClick={() => navigate('/doctor')}
              className={`flex items-center gap-1 px-4 py-2 rounded-full transition
                ${isActive('/doctor') ? 'bg-[#E0F7FA] text-[#007C91]' : 'text-gray-700 hover:text-[#007C91]'}`}
            >
              <User className="w-4 h-4" />
              <span>Doctors</span>
            </button>

            <button
              onClick={() => alert('Patients page not set up yet')}
              className="flex items-center gap-1 px-4 py-2 rounded-full text-gray-700 hover:text-[#007C91]"
            >
              <Users className="w-4 h-4" />
              <span>Patients</span>
            </button>
          </div>
        </div>

        {/* Right: Search + Notifications + Profile */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex items-center bg-[#e6f4f1] rounded-full px-3 w-[280px] h-[40px]">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search Appointments, Doctors..etc"
              className="bg-transparent text-sm ml-2 outline-none placeholder:text-gray-400 w-full"
            />
          </div>

          {/* Notification */}
          <div className="relative w-[40px] h-[40px] flex items-center justify-center">
            <img src={notifyIcon} alt="Notifications" />
          </div>

          {/* Profile */}
          <div className="flex items-center pr-2 gap-1 cursor-pointer">
            <img
              src={profileImg}
              alt="User profile"
              className="w-[40px] h-[40px] rounded-full object-cover"
            />
            <ChevronDown className="w-6 h-6 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
}
