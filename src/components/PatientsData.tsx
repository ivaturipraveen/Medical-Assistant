import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import dual from '../assets/dual.svg';
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

interface Appointment {
  appointment_id: number;
  patient_id: number;
  appointment_time: string;
  status: string;
}

const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<{ [key: number]: Appointment | null }>({});

  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, categoriesRes, appointmentsRes] = await Promise.all([
          axios.get('https://medical-assistant1.onrender.com/patients'),
          axios.get('https://medical-assistant1.onrender.com/categories'),
          axios.get('https://medical-assistant1.onrender.com/appointments'),
        ]);
        setPatients(patientsRes.data.patients);
        setDepartments(categoriesRes.data.categories.filter((dept: string) => dept.toLowerCase() !== 'temp'));
        setAppointments(appointmentsRes.data.appointments);
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
  }, [searchQuery, selectedDepartment, patients]);

  // Memoized function to fetch recent appointment for each patient
  const getRecentAppointment = useCallback((patientId: number) => {
    // Filter appointments for the given patient
    const patientAppointments = appointments.filter((appt) => appt.patient_id === patientId);

    // If no appointments, return null
    if (patientAppointments.length === 0) return null;

    // Sort by appointment time to get the most recent one
    const recentAppointment = patientAppointments.sort((a, b) => {
      return new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime();
    })[0];

    return recentAppointment;
  }, [appointments]);

  useEffect(() => {
    // For each patient, fetch the recent appointment and store it
    const appointmentsData: { [key: number]: Appointment | null } = {};
    filteredPatients.forEach((patient) => {
      appointmentsData[patient.id] = getRecentAppointment(patient.id);
    });
    setRecentAppointments(appointmentsData);
  }, [filteredPatients, appointments, getRecentAppointment]);

  return (
    <div className="w-full h-[1445px] mx-auto bg-[#F4F8FB] pt-5 px-10">
      {/* Header Bar */}
      <div className="flex justify-between items-center w-full h-[40px] bg-[#F4F8FB] p-4">
  <div className="flex items-center gap-2">
    <img src={dual} />
    <h2 className="text-2xl text-black font-bold font-sf">Patients - {patients.length}</h2>
  </div>

  <select
    value={selectedDepartment}
    onChange={(e) => setSelectedDepartment(e.target.value)}
    className="border border-[#098289] rounded-[4px] text-sm focus:outline-none w-[180px] h-[40px]"
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


      {/* Patient Information Table */}
      <div className="w-full h-[1224px] mt-[58px] border border-[#D1E5D9] bg-white rounded-[12px] overflow-hidden">
        <table className="w-full table-auto text-sm">
          <thead className="bg-[#ECF5F6] h-[46px]">
            <tr className="text-left text-gray-600">
              <th className="py-3 px-4">Patient ID</th>
              <th className="py-3 px-4">Patient Name</th>
              <th className="py-3 px-4">Gender</th>
              <th className="py-3 px-4">Age (DOB)</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Consultation Type</th>
              <th className="py-3 px-4">Recent Appointment</th>
              <th className="py-3 px-4">Total Visits</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">
                  No patients found for this search or department.
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-t border-[#E5E7EB]">
                  <td className="py-2 px-4">#{patient.id}</td>
                  <td className="py-2 px-4">{patient.full_name}</td>
                  <td className="py-2 px-4">Male</td>
                  <td className="py-2 px-4">{patient.dob}</td>
                  <td className="py-2 px-4">
  {patient.phone_number ? patient.phone_number : "Not provided"}
</td>

                  <td className="py-2 px-4">{patient.status}</td>
                  <td className="py-2 px-4">
                    {recentAppointments[patient.id]
                      ? new Date(recentAppointments[patient.id]?.appointment_time || '').toLocaleString()
                      : 'No appointments'}
                  </td>
                  <td className="py-2 px-4">3</td>
                  <td className="py-2 px-4">
                    <button className="text-blue-500 hover:text-blue-700">View Profile</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientsPage;
