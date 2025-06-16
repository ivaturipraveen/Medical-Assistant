import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      navigate('/dashboard');
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
    <div className="px-4 sm:px-6 lg:px-10 py-6 w-full max-w-md mx-auto">
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

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password Input with Show/Hide */}
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
    <div className="flex flex-col justify-center items-start lg:items-center  lg:text-left  w-auto px-3 sm:px-6 lg:px-5 pt-8 text-white  bg-cover bg-no-repeat overflow-auto">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 leading-snug self-center lg:self-start">
        Redefine Your Doctor Appointment<br />Experience!
      </h2>
      <div className="w-full flex justify-start">
        <img
          src="frame-28993.svg"
          alt="Dashboard Illustration"
          className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-auto object-contain"
          className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl h-auto object-contain"
        />
      </div>

      <div className="grid  grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm sm:text-base mt-6 w-full max-w-lg self-start lg:self-start">
        {[
          'Comprehensive Patient Management',
          'Real-time Appointment Tracking',
          'Advanced Analytics Dashboard',
          'Secure Medical Records',
        ].map((item) => (
          <div key={item} className="flex items-center gap-3 sm:gap-4">
            <FaCheckCircle className="text-green-300 text-xl sm:text-xl" /> {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const MedicalLoginDashboard = () => (
  <div className="fixed inset-0 flex flex-col lg:flex-row font-sans overflow-hidden">
    <div className="flex-1 h-full bg-gradient-to-br from-[#007C91] to-[#00b3b3] flex items-center justify-center overflow-y-auto">
      <LeftPanel />
    </div>
    <div className="flex-1 h-full bg-gradient-to-br from-white to-[#e6f9f9] flex items-center justify-center overflow-y-auto">
      <LoginForm />
    </div>
  </div>
);

export default MedicalLoginDashboard;
