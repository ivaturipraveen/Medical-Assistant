import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

interface Patient {
  id: number;
  full_name: string;
  dob: string;
  phone_number: string;
  status: string;
  doctor_id: number;
  doctor_name: string;
  department: string;
}

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, categoriesRes] = await Promise.all([
          axios.get('https://medical-assistant1.onrender.com/patients'),
          axios.get('https://medical-assistant1.onrender.com/categories'),
        ]);
        setPatients(patientsRes.data.patients);
        setDepartments(categoriesRes.data.categories.filter((dept: string) => dept.toLowerCase() !== 'temp'));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let results = patients;
    
    // Filter patients by search query (by name)
    if (searchQuery) {
      results = results.filter((patient) =>
        patient.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Further filter by selected department
    if (selectedDepartment) {
      results = results.filter(
        (patient) =>
          patient.department &&
          patient.department.trim().toLowerCase() === selectedDepartment.trim().toLowerCase()
      );
    }

    setFilteredPatients(results);
  }, [searchQuery, selectedDepartment, patients]); // Trigger when search query, department or patients change

  return (
    <div className="w-[1400px] h-[992px] mx-auto bg-[#F4F8FB] pt-23">
      {/* Header Bar */}
      <div className="flex justify-between items-center mt-[4px] w-[1400px] h-[40px]">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold font-sf">Patients</h2>
        </div>

        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="border border-[#098289] rounded-[4px] text-sm focus:outline-none w-[129px] h-[40px]"
        >
          <option value="">All Departments</option>
          {departments
            .filter((dept) => dept.toLowerCase() !== 'temp')
            .map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
        </select>
      </div>

      {/* Patient Grid */}
      <div
        className="grid grid-cols-3 gap-[24px] mt-[40.7px] rounded-md w-[1400px] h-max-[691px] bg-[#F4F8FB] overflow-y-scroll scrollbar-hide"
      >
        {filteredPatients.length === 0 ? (
          <p className="text-gray-500 mt-6 text-center w-full">
            No patients found for this search or department.
          </p>
        ) : (
          filteredPatients.map((patient, index) => (
            <div
              key={patient.id}
              className="bg-white p-4 rounded-[12px] shadow-sm flex items-center gap-4 w-[450.67px] h-[119px]"
            >
              <img
                src={`https://randomuser.me/api/portraits/${
                  index % 2 === 0 ? 'men' : 'women'
                }/${40 + index}.jpg`}
                alt="Patient Avatar"
                className="w-[87px] h-[87px] object-cover rounded-[12px]"
              />
              <div>
                <h3 className="font-semibold text-base text-gray-800">{patient.full_name}</h3>
                <p className="text-sm text-gray-600">
                  {patient.doctor_name ? `${patient.doctor_name}` : 'Unknown'}, {patient.department}
                </p>
                <p className="text-sm text-gray-500">
                  DOB: {patient.dob}, Phone: {patient.phone_number}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PatientsPage;
