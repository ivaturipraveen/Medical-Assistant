import React, { useState } from 'react';
import { Stethoscope, User2, Lock } from 'lucide-react';
import './LoginPage.css';
import illustration from './Medical prescription-bro.svg'; // Adjust path if needed

const LoginPage = ({ onLogin }) => {
  const [loginType, setLoginType] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim() || !password.trim()) {
      setLoginError('Please fill out both email and password.');
      return;
    }

    try {
      const endpoint = loginType === 'admin' ? '/admin/login' : '/doctor/login';
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

      onLogin({
        type: loginType,
        user: data[loginType]
      });
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Login failed. Please try again.');
    }
  };

  return (
   
    <div className="login-page">
      <div className="login-content unified">
        <div className="login-wrapper">
          <div className="login-left inner">
            <div className="login-right inner">
              <div className="illustration-container">
                <img src={illustration} alt="Medical Illustration" className="illustration" />
              </div>
              <div className="features">
                <h3>Key Features</h3>
                <ul>
                  <li>Comprehensive Patient Management</li>
                  <li>Real-time Appointment Tracking</li>
                  <li>Advanced Analytics Dashboard</li>
                  <li>Secure Medical Records</li>
                </ul>
              </div>
            </div>
            <div className="login-form-content">
              <div className="brand">
                <Stethoscope size={40} color="#0c8990"/>
                <h1>Medical Dashboard</h1>
              </div>
              <div className="welcome-text">
                <h2>Welcome</h2>
                <p>Please sign in to access your dashboard</p>
              </div>
              <div className="login-type-selector">
                <button
                  className={loginType === 'admin' ? 'active' : ''}
                  onClick={() => setLoginType('admin')}
                >
                  Admin Login
                </button>
                <button
                  className={loginType === 'doctor' ? 'active' : ''}
                  onClick={() => setLoginType('doctor')}
                >
                  Doctor Login
                </button>
              </div>
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label>
                    <User2 size={20} className="input-icon" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Lock size={20} className="input-icon" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                {loginError && <div className="login-error">{loginError}</div>}
                <button type="submit" className="login-button">
                  Sign In
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;




