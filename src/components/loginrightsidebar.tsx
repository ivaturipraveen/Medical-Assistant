import { useState } from 'react';
import {
  FaUserMd,
  FaHeartbeat,
  FaBone,
  FaStethoscope,
  FaLungs,
  FaChild,
  FaRadiation,
  FaCheckCircle,
  FaCalendarAlt,
} from 'react-icons/fa';
import { CalendarDays, Clock } from 'lucide-react';

const departments = [
  { icon: <FaHeartbeat />, name: 'Endocrinology', count: '207 Doctors' },
  { icon: <FaBone />, name: 'Orthopedic', count: '586 Doctors' },
  { icon: <FaStethoscope />, name: 'Cardiologist', count: '652 Doctors' },
  { icon: <FaLungs />, name: 'Pulmonology', count: '1254 Doctors' },
  { icon: <FaChild />, name: 'Pediatrics', count: '586 Doctors' },
  { icon: <FaRadiation />, name: 'Oncology', count: '652 Doctors' },
];

const LoginForm = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'doctor'>('admin');

  return (
    <div className="w-full max-w-sm px-4 mb-27">
      <h1 className="text-[#007C91] font-bold flex items-center gap-2 justify-center mb-25 text-lg">
        <FaCalendarAlt className="text-2xl" />
        Medical Dashboard
      </h1>
      <h2 className="text-2xl font-bold text-center mb-4">Welcome Back!</h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Please Sign in to access your dashboard
      </p>

      <div className="flex bg-gray-100 rounded-md p-1 mb-6 text-sm font-medium">
        <button
          className={`flex-1 py-2 rounded-md transition ${
            activeTab === 'admin' ? 'bg-white shadow text-[#007C91]' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('admin')}
        >
          👤 Admin Login
        </button>
        <button
          className={`flex-1 py-2 rounded-md transition ${
            activeTab === 'doctor' ? 'bg-white shadow text-[#007C91]' : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('doctor')}
        >
          🩺 Doctor Login
        </button>
      </div>

      <form className="space-y-4">
        <input
          type="email"
          // defaultValue="Loisbecket@gmail.com"
          className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm"
          placeholder="Email"
        />
        <input
          type="password"
          // defaultValue="********"
          className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm"
          placeholder="Password"
        />

        <div className="flex items-center justify-between text-sm text-gray-600">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" /> Remember me
          </label>
          <a href="#" className="text-[#007C91] hover:underline">
            Forgot Password ?
          </a>
        </div>

        <button
          type="submit"
          className="w-full bg-[#00a9a3] hover:bg-[#008a88] text-white py-3 rounded-md font-semibold transition flex items-center justify-center"
        >
          Log In <span className="ml-2">→</span>
        </button>
      </form>
    </div>
  );
};

const LeftPanel = () => {
  return (
    <div className="flex flex-col justify-start items-start w-full h-full px-6 pt-8 text-white bg-[url('/grid-bg.svg')] bg-cover bg-no-repeat">
      <h2 className="text-2xl font-bold mb-6 text-left">Redefine Your Doctor Appointment<br />Experience!</h2>
      <div className="flex gap-4 mb-4 items-start">
        <div className="bg-white text-black rounded-xl p-6 w-[320px] h-[392px] text-sm">
          <div className="flex justify-between font-semibold text-sm mb-4">
            <span>Choose Appointment Date</span>
            <button className="text-gray-400 font-bold">✕</button>
          </div>
          <div className="flex justify-between items-center mb-2">
            <button>←</button>
            <span className="font-semibold text-sm mb-4">June 2025</span>
            <button>→</button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-gray-500 font-medium mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center text-sm gap-y-3">
            {[...Array(31)].map((_, i) => (
              <span
                key={i}
                className={`py-2 rounded-full ${
                  i + 1 === 12 ? 'bg-[#00a9a3] text-white' : 'text-gray-600'
                }`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-[320px]">
          <div className="bg-[#00889e] rounded-xl p-3 text-white text-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Upcoming Appointments</h3>
              <button className="text-lg">›</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#009aae] p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} /> Mon, 11 June, 24
                </div>
                <p className="text-xs mt-1 text-white/70">Appointments Date</p>
              </div>
              <div className="bg-[#009aae] p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock size={16} /> 08:00 - 12:00
                </div>
                <p className="text-xs mt-1 text-white/70">Appointments Time</p>
              </div>
            </div>

            <div className="bg-white text-gray-800 rounded-lg flex items-center justify-between p-3 mt-2">
              <div className="flex items-center gap-3">
                <FaUserMd className="text-[#007C91] w-5 h-5" />
                <div>
                  <p className="font-semibold">Dr. Robert Harris</p>
                  <p className="text-xs text-gray-500">Internist Specialist Doctor</p>
                </div>
              </div>
              <button className="text-[#007C91] text-xl">💬</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {departments.map((d) => (
              <div
                key={d.name}
                className="bg-white text-center text-gray-700 rounded-xl py-3 px-2 shadow"
              >
                <div className="text-[#007C91] text-xl mb-1">{d.icon}</div>
                <div className="font-semibold text-sm">{d.name}</div>
                <div className="text-xs text-gray-500">{d.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-7 text-base mt-6">
        {[
          'Comprehensive Patient Management',
          'Real-time Appointment Tracking',
          'Advanced Analytics Dashboard',
          'Secure Medical Records',
        ].map((item) => (
          <div key={item} className="flex items-center gap-4">
            <FaCheckCircle className="text-green-300" /> {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const MedicalLoginDashboard = () => {
  return (
    <div className="fixed top-0 left-0 h-screen w-screen flex font-sans">
      <div className="w-1/2 h-full bg-gradient-to-br from-[#007C91] to-[#00b3b3]">
        <LeftPanel />
      </div>
      <div className="w-1/2 h-full bg-gradient-to-br from-white to-[#e6f9f9] flex items-center justify-center">
        <LoginForm />
      </div>
    </div>
  );
};

export default MedicalLoginDashboard;
