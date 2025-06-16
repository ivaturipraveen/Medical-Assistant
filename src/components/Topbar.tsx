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
  return (
    <header className="w-[1920px] h-[64px] bg-white px-10 py-3 flex items-center justify-center border-b border-gray-200 shadow-sm mx-auto">
      {/* Inner content grid */}
      <div className="w-[1400px] h-[64px] flex items-center justify-between">
        {/* Left: Logo + Title + Navigation */}
        <div className="flex items-center gap-10 w-[971px] h-[40px]">
          {/* Logo + Medical Dashboard */}
         <div className="flex items-center w-[189px] h-[24px]">
  <img src={headlineIcon} alt="Headline Logo" className="w-[189px] h-[24px]" />
</div>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-1 text-[#007C91] bg-[#E0F7FA] px-4 py-2 rounded-full w-[127px] h-[40px]">
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button className="flex items-center gap-1 hover:text-[#007C91] w-[140px] h-[40px]">
              <CalendarDays className="w-4 h-4" />
              <span>Appointments</span>
            </button>
            <button className="flex items-center gap-1 hover:text-[#007C91] w-[102px] h-[40px]">
              <User className="w-4 h-4" />
              <span>Doctors</span>
            </button>
            <button className="flex items-center gap-1 hover:text-[#007C91] w-[103px] h-[40px]">
              <Users className="w-4 h-4" />
              <span>Patients</span>
            </button>
          </div>
        </div>

        {/* Right: Search + Notification + Profile */}
        <div className="flex items-center gap-4 w-[409px] h-[40px]">
          {/* Search */}
          <div className="flex items-center bg-[#e6f4f1] rounded-full w-[281px] h-[40px] px-3">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search Appointments, Doctors..etc"
              className="bg-transparent text-sm ml-2 outline-none placeholder:text-gray-400 w-full"
            />
          </div>

          {/* Notification */}
<div className="relative w-[40px] h-[40px] flex items-center justify-center">
  <img
    src={notifyIcon}
    alt="Notifications"
    className="w-5 h-5"
  />
  <span className="absolute top-1 right-1 w-2 h-2 border-white" />
</div>


          {/* Profile */}
          <div className="flex items-center gap-1 w-[40px] h-[40px] cursor-pointer">
            <img
              src={profileImg}
              alt="User profile picture"
              className="w-[40px] h-[40px] rounded-full object-cover"
            />
            <ChevronDown className="w-[20px] h-[20px] text-gray-500 ml-1" />
          </div>
        </div>
      </div>
    </header>
  );
}
