import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCalendarAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import star from '../assets/Star.svg';
import ChatWidgetLauncher from './Button';

const LoginForm = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'doctor'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password.trim()) {
      setLoginError('Please fill out both email and password.');
      return;
    }

    try {
      const endpoint = activeTab === 'admin' ? '/admin/login' : '/doctor/login';
      const response = await fetch(`https://medical-assistant1.onrender.com${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

            const currentLoginTime = new Date().toLocaleString();
      const previousLoginTime = localStorage.getItem("lastLogin");
  
      // Move current `lastLogin` to `previousLogin` before setting new one
      if (previousLoginTime) {
        localStorage.setItem("previousLogin", previousLoginTime);
      }
  
      // Store the current login time as `lastLogin`
      localStorage.setItem('lastLogin', currentLoginTime);
  


      if (activeTab === 'admin') {
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('adminData', JSON.stringify(data.admin));
        navigate('/dashboard');
      } else if (activeTab === 'doctor') {
        localStorage.setItem('userRole', 'doctor');
        localStorage.setItem('doctorData', JSON.stringify(data.doctor));
        navigate('/doctor-dashboard', {
          state: {
            doctor: data.doctor,
          },
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Login error:', error);
        setLoginError(error.message || 'Login failed. Please try again.');
      } else {
        console.error('Unexpected error:', error);
        setLoginError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
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

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm pr-10"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <label className="flex items-center">
            <input type="checkbox" className="mr-2" /> Remember me
          </label>
          <a href="#" className="text-[#007C91] hover:underline">
            Forgot Password?
          </a>
        </div>

        {loginError && (
          <div className="text-red-500 text-sm text-center">{loginError}</div>
        )}

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
    <>
      <img
        src={star}
        alt="Star BG"
        className="absolute w-full h-full object-top opacity-100 z-0 pointer-events-none select-none"
      />
      <div className="relative flex flex-col justify-center items-start lg:items-center text-left w-auto px-3 sm:px-6 lg:px-5 pt-8 text-white bg-cover bg-no-repeat overflow-auto">
        <div className="relative z-10">
          <h2 className="font-sf text-xl sm:text-2xl md:text-3xl font-bold mb-6 leading-snug self-center lg:self-start">
            Redefine Your Doctor Appointment<br />Experience!
          </h2>
          <div className="w-full flex justify-start">
            <img
              src="frame-28993.svg"
              alt="Dashboard Illustration"
              className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-auto object-contain"
            />
          </div>
          <div className="font-sf grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm sm:text-base mt-6 w-full max-w-4xl self-start lg:self-start">
            {[
              'Comprehensive Patient Management',
              'Real-time Appointment Tracking',
              'Advanced Analytics Dashboard',
              'Secure Medical Records',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 sm:gap-4 whitespace-nowrap">
                <FaCheckCircle className="text-white-300 text-xl sm:text-xl shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

const MedicalLoginDashboard = () => (
  <div className="fixed inset-0 flex flex-col lg:flex-row font-sans overflow-hidden scrollbar-hide">
    <div className="flex-1 h-full bg-gradient-to-br from-[#06B0BB] to-[#098289] flex items-center justify-center overflow-y-auto">
      <LeftPanel />
    </div>

    <div className="flex-1 h-full bg-gradient-to-br from-white to-[#e6f9f9] flex flex-col justify-center items-center px-4 py-12">
      <div className="absolute w-[300px] h-[200px] top-[-100px] right-[-100px] bg-[#D4FCFF] rounded-full opacity-80 blur-[120px] z-0" />
      <div className="absolute w-[300px] h-[300px] bottom-[-100px] right-[-100px] bg-[#FFE188] rounded-full opacity-80 blur-[120px] z-0" />

      <div className="flex items-center gap-2 mb-20 justify-center">
        <FaCalendarAlt className="text-2xl text-[#007C91]" />
        <h1 className="font-sf text-2xl sm:text-3xl font-semibold text-[#007C91]">Medical Dashboard</h1>
      </div>

      <div className="flex flex-col items-center text-center w-full max-w-md mb-25">
        <div className="mb-4">
          <h2 className="font-sf text-xl sm:text-2xl font-bold">Welcome Back!</h2>
          <p className="font-sf text-sm text-gray-500">Please Sign in to access your dashboard</p>
        </div>

        <LoginForm />
      </div>
    </div>

    <ChatWidgetLauncher />
  </div>
);

export default MedicalLoginDashboard;
