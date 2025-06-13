import { useState } from 'react';
import { FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';

const LoginForm = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'doctor'>('admin');

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-md mx-auto">
      <h1 className="text-[#007C91] font-bold flex items-center gap-2 justify-center mb-6 text-lg sm:text-xl md:text-2xl">
        <FaCalendarAlt className="text-2xl" />
        Medical Dashboard
      </h1>
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">Welcome Back!</h2>
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
          className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm"
          placeholder="Email"
        />
        <input
          type="password"
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
    <div className="flex flex-col justify-center items-center text-center w-full h-full px-4 sm:px-6 pt-8 text-white bg-[url('/grid-bg.svg')] bg-cover bg-no-repeat overflow-auto">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6">
        Redefine Your Doctor Appointment<br />Experience!
      </h2>
      <div className="w-full flex justify-center">
        <img
          src="frame-28993.svg"
          alt="Dashboard Illustration"
          className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-auto object-contain"
        />
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm sm:text-base mt-6 w-full max-w-lg">
        {[
          'Comprehensive Patient Management',
          'Real-time Appointment Tracking',
          'Advanced Analytics Dashboard',
          'Secure Medical Records',
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 sm:gap-4">
            <FaCheckCircle className="text-green-300 text-lg sm:text-xl" /> {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const MedicalLoginDashboard = () => (
  <div className="fixed inset-0 flex flex-col lg:flex-row font-sans overflow-hidden">
    {/* Left Panel */}
    <div className="flex-1 h-full bg-gradient-to-br from-[#007C91] to-[#00b3b3] flex items-center justify-center overflow-y-auto">
      <LeftPanel />
    </div>

    {/* Right Panel */}
    <div className="flex-1 h-full bg-gradient-to-br from-white to-[#e6f9f9] flex items-center justify-center overflow-y-auto">
      <LoginForm />
    </div>
  </div>
);


export default MedicalLoginDashboard;
