import React, { useEffect, useState, useMemo, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import dual from '../../../assets/dual_green.svg';
import PatientProfilePanel from './profile';
import { FaArrowLeft } from 'react-icons/fa';  // Import left arrow icon

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

  const sidebarRef = useRef<HTMLDivElement | null>(null); // Reference for the sidebar

  // Close the sidebar when clicking outside or on the left arrow
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSelectedPatient(null); // Close the profile panel if it's open
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleCloseSidebar = () => {
    setSelectedPatient(null); // Close the profile panel
  };

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
            className="p-2 border border-[#098289] rounded-[4px] text-sm focus:outline-none w-[120px] h-[40px] text-left"
          >
            <option>All Patients</option>
            <option value="A to Z">A to Z</option>
            <option value="Z to A">Z to A</option>
            <option value="Old Patients">Old Patients</option>
          </select>
        </div>
      </div>

      <div className="w-[1400px] h-[1224px] border border-[#D1E5D9] bg-white rounded-[12px] overflow-auto mb-5">
        <table className="w-full table-auto text-sm">
          <thead className="bg-[#ECF5F6] h-[46px] w-[163px]">
            <tr className="text-left text-gray-600">
              <th className="py-[12px] px-[10px]">Patient ID</th>
              <th className="py-[12px] px-[10px]">Patient Name</th>
              <th className="py-[12px] px-[10px]">Gender</th>
              <th className="py-[12px] px-[10px]">Age (DOB)</th>
              <th className="py-[12px] px-[10px]">Contact</th>
              <th className="py-[12px] px-[10px]">Consultation Type</th>
              <th className="py-[12px] px-[10px]">Recent Appointment</th>
              <th className="py-[12px] px-[10px]">Total Visits</th>
              <th className="py-[12px] px-[10px]">Actions</th>
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
                  <td className="py-[8px] px-[12px]">#{patient.id}</td>
                  <td className="py-[8px] px-[12px]">{patient.full_name}</td>
                  <td className="py-[8px] px-[12px]">Male</td>
                  <td className="py-[8px] px-[12px]">{patient.dob}</td>
                  <td className="py-[8px] px-[12px]">{patient.phone_number || "Not provided"}</td>
                  <td className="py-[8px] px-[12px]">
                    <span className="text-[#098289] bg-[#0982891A] border border-[#098289] rounded-[16px] min-w-[84px] max-w-[480px] h-[28px] px-[10px] flex items-center justify-center text-sm">
                      {patient.status}
                    </span>
                  </td>
                  <td className="py-[8px] px-[12px]">
                    {recentAppointments[patient.id]?.appointment_time
                      ? new Date(recentAppointments[patient.id]!.appointment_time).toLocaleString()
                      : 'No appointments'}
                  </td>
                  <td className="py-[8px] px-[12px]">3</td>
                  <td className="py-[8px] px-[12px]">
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
        <div ref={sidebarRef}>
          <div className="absolute top-0 left-0 p-4">
            <FaArrowLeft
              onClick={handleCloseSidebar} // Attach the close handler to left arrow
              className="cursor-pointer text-gray-600"
              size={24}
            />
          </div>
          <PatientProfilePanel patient={selectedPatient} onClose={handleCloseSidebar} />
        </div>
      )}
    </div>
  );
};

export default PatientsPage;
