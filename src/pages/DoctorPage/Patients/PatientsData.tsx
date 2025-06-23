// PatientsData.tsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import dual from '../../../assets/dual_green.svg';
import PatientProfilePanel from './profile';

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
  const [sortOption, setSortOption] = useState<string>('All Patients');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, appointmentsRes] = await Promise.all([
          axios.get('https://medical-assistant1.onrender.com/patients'),
          axios.get('https://medical-assistant1.onrender.com/appointments'),
        ]);
        setPatients(patientsRes.data.patients);
        setAppointments(appointmentsRes.data.appointments);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const recentAppointmentMap = useMemo(() => {
    const map: { [key: number]: Appointment | null } = {};
    patients.forEach((patient) => {
      const patientAppointments = appointments.filter((appt) => appt.patient_id === patient.id);
      if (patientAppointments.length === 0) {
        map[patient.id] = null;
      } else {
        map[patient.id] = patientAppointments.reduce((latest, appt) =>
          new Date(appt.appointment_time) > new Date(latest.appointment_time) ? appt : latest
        );
      }
    });
    return map;
  }, [appointments, patients]);

  const filteredPatients = useMemo(() => {
    let results = [...patients];
    if (searchQuery) {
      results = results.filter((patient) =>
        patient.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
   
    if (sortOption === 'A to Z') {
      results.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (sortOption === 'Z to A') {
      results.sort((a, b) => b.full_name.localeCompare(a.full_name));
    }
    return results;
  }, [searchQuery, patients, sortOption]);

  const recentAppointments = useMemo(() => {
    const map: { [key: number]: Appointment | null } = {};
    filteredPatients.forEach((patient) => {
      map[patient.id] = recentAppointmentMap[patient.id] || null;
    });
    return map;
  }, [filteredPatients, recentAppointmentMap]);

  return (
    <div className="w-[1400px] h-[1286px] max-w-[1400px] mx-auto bg-[#F4F8FB] pt-[64px] flex flex-col gap-[24px]">
      <div className="w-[1399px] h-[40px] flex justify-between items-center ml-[1px] pt-[15px]">
        <div className="flex items-center gap-2">
          <img src={dual} alt="dual icon" />
          <h2 className="text-2xl text-black font-bold font-sf">Patients - {patients.length}</h2>
        </div>
        <div className="flex gap-4">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
className="p-1 border border-[#098289] rounded-[4px] text-sm focus:outline-none w-[81px] h-[40px] text-left"
          >
            <option>Filters</option>
            <option value="A to Z">A to Z</option>
            <option value="Z to A">Z to A</option>
            <option value="Old Patients">Old Patients</option>
          </select>
        </div>
      </div>

      <div className="w-[1400px] h-[1224px] border border-[#D1E5D9] bg-white rounded-[12px] overflow-hidden">
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
                  <td className="py-2 px-4">{patient.phone_number || "Not provided"}</td>
                  <td className="py-2 px-4">
                    <span className="text-[#098289] bg-[#0982891A] border border-[#098289] rounded-[16px] min-w-[84px] max-w-[480px] h-[28px] px-[10px] flex items-center justify-center text-sm">
                      {patient.status}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    {recentAppointments[patient.id]?.appointment_time
                      ? new Date(recentAppointments[patient.id]!.appointment_time).toLocaleString()
                      : 'No appointments'}
                  </td>
                  <td className="py-2 px-4">3</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => setSelectedPatient(patient)}
                      className="bg-[#098289] text-white text-sf font-medium rounded-[16px] px-[10px] h-[28px] min-w-[84px] max-w-[480px] transition-all duration-300 ease-out flex items-center justify-center text-center"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedPatient && (
        <PatientProfilePanel patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
      )}
    </div>
  );
};

export default PatientsPage;
