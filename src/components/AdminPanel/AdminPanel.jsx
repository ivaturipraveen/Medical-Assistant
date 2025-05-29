import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Brain,
  Cross,
  UserRound,
  Eye,
  Search,
  ChevronDown
} from 'lucide-react';
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

  const renderDoctors = () => (
    <div className="doctors-container">
      <div className="filters">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="department-filter">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {Object.keys(departmentIcons).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <ChevronDown size={20} />
        </div>
      </div>

      <div className="doctors-grid">
        {filteredDoctors.map(doctor => (
          <div key={doctor.id} className="doctor-card">
            <div className="doctor-icon">
              {departmentIcons[doctor.department]}
            </div>
            <h3>{doctor.name}</h3>
            <p>{doctor.department}</p>
            <p>{doctor.specialization}</p>
          </div>
        ))}
      </div>
    </div>
  );

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