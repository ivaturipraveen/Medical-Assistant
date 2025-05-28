import React, { useState, useEffect } from 'react';
import { Stethoscope, User2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export const Loginpage = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch('https://medical-assistant1.onrender.com/doctors');
        const data = await response.json();
        if (data.doctors) {
          const processedDoctors = data.doctors.map(doctor => {
            const fullName = doctor.name;
            const nameParts = fullName.split(' ').filter(part => part !== 'Dr.');
            const firstName = nameParts[0].toLowerCase();
            return {
              ...doctor,
              id: doctor.id || doctor._id,
              email: `${firstName}@gmail.com`,
              password: firstName
            };
          });
          setDoctorsList(processedDoctors);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
      }
    };

    fetchDoctors();
  }, []);

  const onLogin = ({ type, user }) => {
    // You can lift state up or use context here if needed
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userRole', type);
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    sessionStorage.setItem('lastActivity', new Date().getTime());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (loginType === 'admin') {
      if (!username.trim() || !password.trim()) {
        setLoginError('Please fill out both username and password.');
        return;
      }

      if (username === 'admin' && password === '123') {
        onLogin({ type: 'admin', user: { username: 'admin' } });
        navigate('/Admin'); // redirect after successful admin login
      } else {
        setLoginError('Invalid admin credentials.');
      }
    } else {
      if (!doctorId.trim() || !doctorPassword.trim()) {
        setLoginError('Please fill out both email and password.');
        return;
      }

      try {
        const email = doctorId.toLowerCase();
        const pwd = doctorPassword.toLowerCase();

        const doctor = doctorsList.find(doc =>
          doc.email === email && doc.password === pwd
        );
        
        if (doctor) {
          const doctorUser = {
            id: doctor.id,
            name: doctor.name,
            email,
            department: doctor.department
          };

          onLogin({
            type: 'doctor',
            user: doctorUser
          });

          // Store additional doctor info for persistence
          localStorage.setItem('currentDoctor', JSON.stringify(doctorUser));

          navigate('/doctor2', { 
            state: { 
              doctorName: doctor.name, 
              doctorId: doctor.id,
              doctorDepartment: doctor.department,
              doctorEmail: email
            } 
          });
        } else {
          setLoginError('Invalid doctor credentials.');
        }
      } catch (err) {
        console.error(err);
        setLoginError('An error occurred during login.');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="login-left">
          <div className="brand">
            <Stethoscope size={40} />
            <h1>Medical Dashboard</h1>
          </div>
          <div className="welcome-text">
            <h2>Welcome Back!</h2>
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
            {loginType === 'admin' ? (
              <>
                <div className="form-group">
                  <label>
                    <User2 size={20} />
                    <span>Username</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter admin username"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Lock size={20} />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>
                    <User2 size={20} />
                    <span>Email</span>
                  </label>
                  <input
                    type="email"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    placeholder="firstname@gmail.com"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Lock size={20} />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    placeholder="Enter your firstname as password"
                  />
                </div>
                <div className="login-hint">
                  Use your first name as both email (firstname@gmail.com) and password
                </div>
              </>
            )}
            {loginError && <div className="login-error">{loginError}</div>}
            <button type="submit" className="login-button">
              Sign In
            </button>
          </form>
        </div>
        <div className="login-right">
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
      </div>
    </div>
  );
};