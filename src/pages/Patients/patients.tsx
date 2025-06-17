import React, { useEffect, useState } from 'react';
import axios from 'axios';


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

  const filteredPatients = selectedDepartment
  ? patients.filter(
      (p) =>
        p.department &&
        p.department.trim().toLowerCase() === selectedDepartment.trim().toLowerCase()
    )
  : patients;
  return (
    <div className="w-[1400px] h-[992px] mx-auto bg-gray-50 pt-23">
      {/* Header Bar */}
      <div className="flex justify-between items-center mt-[4px] w-[1400px] h-[40px]">
        <div className="flex items-center">
          <h2 className='text-2xl font-bold font-sf'>Patients</h2>
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
        className="grid grid-cols-3 gap-[24px] mt-[40.7px] rounded-md w-[1400px] h-max-[691px] bg-gray-50 overflow-y-scroll scrollbar-hide"
        // style={{
        //   width: '1400px',
        //   height: '691px',
        //   backgroundColor: '#F4F8FB',
        // }}
      >
        {filteredPatients.map((patient, index) => (
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
        ))}
      </div>
    </div>
  );
};

export default PatientsPage;
