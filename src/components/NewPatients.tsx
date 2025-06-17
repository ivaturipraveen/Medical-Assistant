import { useEffect, useState } from 'react';
import { FaRegHeart } from 'react-icons/fa';
import axios from 'axios';

interface Patient {
  id: number;
  full_name: string;
  dob: string;
  phone_number: string;
  department: string;
}

interface Appointment {
  appointment_id: number;
  patient_id: number;
}

const statusStyles = {
  Scheduled: 'text-green-600 border-green-500',
  'Not Scheduled': 'text-orange-500 border-orange-500',
};

export default function NewPatientsTable() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, appointmentRes] = await Promise.all([
          axios.get<{ patients: Patient[] }>("https://medical-assistant1.onrender.com/patients"),
          axios.get<{ appointments: Appointment[] }>("https://medical-assistant1.onrender.com/appointments"),
        ]);

        const recentPatients = patientRes.data.patients.slice(0, 5);
        setPatients(recentPatients);
        setAppointments(appointmentRes.data.appointments);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, []);

  const getStatus = (patientId: number): 'Scheduled' | 'Not Scheduled' => {
    return appointments.some(appt => appt.patient_id === patientId) ? 'Scheduled' : 'Not Scheduled';
  };

  return (
    // Outer container: Removed px-* to prevent overflow. It will now take `w-full` (1400px) from dashboard.tsx.
    // Removed justify-center as the inner div will handle its own width.
    <div className="w-full ">
      {/* Inner container: Changed max-w-6xl to w-full to fill the 1400px width. */}
      {/* Apply padding here instead of the outer div. */}
      <div className="w-full bg-white rounded-xl shadow-md overflow-hidden p-4 sm:p-6">
        <div className="h-auto max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 text-[#0D1A12]">
            <img src="/Vector - 0.svg" alt="Add User" className="w-5 h-5 object-contain" />
            <h2 className="text-lg font-semibold">New Patients</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 font-medium">
                <tr>
                  <th className="px-3 py-2 whitespace-nowrap">Patient</th>
                  <th className="px-3 py-2 whitespace-nowrap">DOB</th>
                  <th className="px-3 py-2 whitespace-nowrap">Contact</th>
                  <th className="px-3 py-2 whitespace-nowrap">Department</th>
                  <th className="px-3 py-2 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => {
                  const status = getStatus(patient.id);
                  return (
                    <tr key={patient.id} className="border-b border-gray-200">
                      <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900">
                        {patient.full_name}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{patient.dob}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {patient.phone_number?.trim() || "Not Provided"}
                      </td>
                      <td className="px-3 py-3 text-teal-600 flex items-center gap-1 whitespace-nowrap">
                        <FaRegHeart className="text-teal-600" /> {patient.department}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`border rounded-full px-3 py-1 text-xs font-medium ${statusStyles[status]}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
