import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Brain,
  Cross,
  UserRound,
  Eye,
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import { FaUserMd } from 'react-icons/fa';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import './AdminPanel.css';

const departmentIcons = {
  'Cardiology': <Heart size={24} />,
  'Pulmonology': <Activity size={24} />,
  'Neurology': <Brain size={24} />,
  'Orthopedics': <Cross size={24} />,
  'Pediatrics': <UserRound size={24} />,
  'Ophthalmology': <Eye size={24} />,
};

const AdminPanel = ({ dashboardData, doctors, patients, appointments }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    if (doctors) {
      handleDoctorFilters(searchTerm, selectedDepartment);
    }
  }, [doctors, searchTerm, selectedDepartment]);

  const handleDoctorFilters = (searchText, department) => {
    let filtered = [...doctors];
    
    if (searchText) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (department) {
      filtered = filtered.filter(doctor =>
        doctor.department === department
      );
    }

    setFilteredDoctors(filtered);
  };

  const getDoctorProfessionalDetails = (doctor) => {
    return {
      ...doctor,
      qualification: "MD, MBBS",
      specialization: doctor.department,
      experience: "10+ years",
      languages: ["English", "Hindi"],
      education: [
        {
          degree: "MBBS",
          institution: "All India Institute of Medical Sciences",
          year: "2010"
        },
        {
          degree: "MD",
          institution: "Post Graduate Institute of Medical Education and Research",
          year: "2013"
        }
      ],
      certifications: [
        "Board Certified in Internal Medicine",
        "Advanced Cardiac Life Support (ACLS)",
        "Basic Life Support (BLS)"
      ],
      availableTimings: {
        monday: ["09:00 AM - 01:00 PM", "05:00 PM - 09:00 PM"],
        tuesday: ["09:00 AM - 01:00 PM", "05:00 PM - 09:00 PM"],
        wednesday: ["09:00 AM - 01:00 PM"],
        thursday: ["09:00 AM - 01:00 PM", "05:00 PM - 09:00 PM"],
        friday: ["09:00 AM - 01:00 PM", "05:00 PM - 09:00 PM"],
        saturday: ["09:00 AM - 02:00 PM"]
      },
      expertise: [
        "General Consultation",
        "Preventive Care",
        "Chronic Disease Management",
        "Emergency Medicine"
      ],
      registrationNumber: "MCI-" + Math.random().toString(36).substr(2, 8).toUpperCase(),
      about: "A dedicated healthcare professional with extensive experience in providing comprehensive medical care. Committed to delivering patient-centered treatment and maintaining the highest standards of medical practice."
    };
  };

  const renderDashboard = () => (
    <div className="dashboard-container">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Doctors</h3>
          <p>{doctors?.length || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Patients</h3>
          <p>{patients?.length || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p>{appointments?.length || 0}</p>
        </div>
      </div>

      {dashboardData && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Department Statistics</h3>
            {dashboardData.departmentStats && (
              <Doughnut data={dashboardData.departmentStats} />
            )}
          </div>
          <div className="chart-card">
            <h3>Weekly Distribution</h3>
            {dashboardData.weeklyDistribution && (
              <Line data={dashboardData.weeklyDistribution} />
            )}
          </div>
          <div className="chart-card">
            <h3>Doctor Workload</h3>
            {dashboardData.doctorWorkload && (
              <Bar data={dashboardData.doctorWorkload} />
            )}
          </div>
          <div className="chart-card">
            <h3>Patient Age Distribution</h3>
            {dashboardData.ageDistribution && (
              <Pie data={dashboardData.ageDistribution} />
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderDoctors = () => {
    const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    return (
      <div className="doctors-view">
        <h2 className="content-title">Doctors Directory</h2>
        
        <div className="doctors-header">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => handleDoctorFilters(e.target.value, selectedDepartment)}
              className="search-input"
            />
          </div>

          <div className="filters-container">
            <select
              className="department-select"
              value={selectedDepartment}
              onChange={(e) => handleDoctorFilters(searchTerm, e.target.value)}
            >
              <option value="">All Departments</option>
              {Object.keys(departmentIcons).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="doctors-grid">
          {filteredDoctors.map(doctor => (
            <div key={doctor.id} className="doctor-card">
              <div className="doctor-info">
                <div className="doctor-card-avatar">
                  <FaUserMd size={24} />
                </div>
                <div className="doctor-details">
                  <h3 className="doctor-name">{doctor.name}</h3>
                  <p className="doctor-department">{doctor.department}</p>
                  <span className={`status-badge ${doctor.status?.toLowerCase() || 'active'}`}>
                    {doctor.status || 'Active'}
                  </span>
                </div>
              </div>
              <button 
                className="view-profile-btn"
                onClick={() => setSelectedDoctor(doctor)}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>

        {/* Doctor Profile Modal/Sidebar */}
        <div 
          className={`modal-overlay ${selectedDoctor ? 'open' : ''}`} 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedDoctor(null);
            }
          }}
        >
          <div className="doctor-profile-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedDoctor(null)}>
              <X size={24} />
            </button>
            
            {selectedDoctor && (
              <>
                <div className="doctor-profile-header">
                  <div className="doctor-profile-avatar">
                    <FaUserMd size={32} />
                  </div>
                  <div className="doctor-profile-info">
                    <h2>{selectedDoctor.name}</h2>
                    <p className="doctor-specialization">{selectedDoctor.department}</p>
                    <p className="doctor-qualification">MD, MBBS</p>
                  </div>
                </div>

                <div className="doctor-profile-content">
                  <div className="profile-section">
                    <h3>About</h3>
                    <p>{getDoctorProfessionalDetails(selectedDoctor).about}</p>
                  </div>

                  <div className="profile-section">
                    <h3>Professional Details</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Experience</span>
                        <span className="detail-value">10+ years</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Registration No.</span>
                        <span className="detail-value">{getDoctorProfessionalDetails(selectedDoctor).registrationNumber}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Languages</span>
                        <span className="detail-value">English, Hindi</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3>Education & Training</h3>
                    <div className="education-list">
                      {getDoctorProfessionalDetails(selectedDoctor).education.map((edu, index) => (
                        <div key={index} className="education-item">
                          <div className="education-degree">{edu.degree}</div>
                          <div className="education-institution">{edu.institution}</div>
                          <div className="education-year">{edu.year}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3>Certifications</h3>
                    <ul className="certifications-list">
                      {getDoctorProfessionalDetails(selectedDoctor).certifications.map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="profile-section">
                    <h3>Areas of Expertise</h3>
                    <div className="expertise-tags">
                      {getDoctorProfessionalDetails(selectedDoctor).expertise.map((exp, index) => (
                        <span key={index} className="expertise-tag">{exp}</span>
                      ))}
                    </div>
                  </div>

                  <div className="profile-section">
                    <h3>Available Timings</h3>
                    <div className="timings-grid">
                      {weekDays.map(day => (
                        <div key={day} className="timing-item">
                          <div className="timing-day">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
                          <div className="timing-slots">
                            {getDoctorProfessionalDetails(selectedDoctor).availableTimings[day]?.map((time, index) => (
                              <span key={index} className="timing-slot">{time}</span>
                            )) || <span className="timing-closed">Closed</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-panel">
      <div className="tabs">
        <button
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={activeTab === 'doctors' ? 'active' : ''}
          onClick={() => setActiveTab('doctors')}
        >
          Doctors
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'doctors' && renderDoctors()}
      </div>
    </div>
  );
};

export default AdminPanel; 