import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

interface Appointment {
  appointment_id: number;
  appointment_time: string;
  patient_name: string;
  contact: string;
  type: string;
  status: string;
  patient_id: number;
}

// interface Patient {
//   id: number;
//   full_name: string;
//   phone_number: string;
// }

const TodaysAppointment: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  // const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchAppointmentsAndPatients = async () => {
      try {
        const appointmentsResponse = await axios.get('https://medical-assistant1.onrender.com/appointments');
        const allAppointments = appointmentsResponse.data.appointments;

        const patientsResponse = await axios.get('https://medical-assistant1.onrender.com/patients');
        const allPatients = patientsResponse.data.patients;

        const today = dayjs().format('YYYY-MM-DD');
        const filteredAppointments = allAppointments
          .filter((appt: any) => appt.appointment_time.startsWith(today))
          .map((appt: any) => {
            const patient = allPatients.find((p: any) => p.id === appt.patient_id);
            return {
              appointment_id: appt.appointment_id,
              appointment_time: dayjs(appt.appointment_time).format('hh:mm A'),
              patient_name: appt.patient_name,
              contact: patient ? patient.phone_number : 'N/A',
              type: getTypeByDuration(appt.duration),
              status: appt.status.charAt(0).toUpperCase() + appt.status.slice(1),
              patient_id: appt.patient_id
            };
          });

        setAppointments(filteredAppointments);
      } catch (err) {
        console.error('Error fetching appointments or patients:', err);
      }
    };

    fetchAppointmentsAndPatients();
  }, []);

  const getTypeByDuration = (duration: number) => {
    if (duration <= 15) return 'Follow-up';
    if (duration <= 30) return 'New Consultation';
    return 'General Check-Up';
  };

  return (

    <div className=" w-[925px] h-[620px] bg-white shadow-lg p-6 rounded-[12px] border border-[#D1E5D9]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg width="24" height="24" viewBox="0 0 17 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.66113 7.07122C9.03706 6.15521 9.65094 4.44633 9.17245 2.86416C8.69396 1.28198 7.23595 0.199696 5.58301 0.199696C3.93006 0.199696 2.47206 1.28198 1.99356 2.86416C1.51507 4.44633 2.12896 6.15521 3.50488 7.07122C2.29269 7.51799 1.25745 8.34474 0.553633 9.42809C0.452962 9.57772 0.440664 9.76996 0.521448 9.93119C0.602232 10.0924 0.763579 10.1977 0.943695 10.2066C1.12381 10.2155 1.29478 10.1268 1.39113 9.97434C2.31352 8.55568 3.89085 7.69981 5.58301 7.69981C7.27516 7.69981 8.8525 8.55568 9.77488 9.97434C9.92748 10.2011 10.2339 10.2634 10.4629 10.114C10.6918 9.96468 10.7584 9.65916 10.6124 9.42809C9.90857 8.34474 8.87333 7.51799 7.66113 7.07122ZM2.83301 3.95122C2.83301 2.43243 4.06422 1.20122 5.58301 1.20122C7.10179 1.20122 8.33301 2.43243 8.33301 3.95122C8.33301 5.47 7.10179 6.70122 5.58301 6.70122C4.06494 6.6995 2.83473 5.46929 2.83301 3.95122ZM15.9668 10.12C15.7355 10.2708 15.4257 10.2056 15.2749 9.97434C14.3535 8.55474 12.7754 7.69895 11.083 7.70122C10.8069 7.70122 10.583 7.47736 10.583 7.20122C10.583 6.92508 10.8069 6.70122 11.083 6.70122C12.1905 6.70017 13.1894 6.03483 13.6171 5.0132C14.0448 3.99158 13.8179 2.81308 13.0414 2.02329C12.265 1.23351 11.0905 0.986586 10.0618 1.39684C9.89478 1.46903 9.70177 1.44482 9.55778 1.33365C9.41379 1.22247 9.34155 1.04186 9.36914 0.862051C9.39673 0.682241 9.51981 0.531605 9.69051 0.468718C11.4736 -0.242404 13.5058 0.507889 14.399 2.2071C15.2922 3.90632 14.7579 6.00569 13.1611 7.07122C14.3733 7.51799 15.4086 8.34474 16.1124 9.42809C16.2632 9.65937 16.198 9.96911 15.9668 10.12Z"
            fill="#098289"
          />
        </svg>
        <h2 className="text-xl font-bold font-sf">Today’s Appointments - {appointments.length}</h2>
      </div>

      {/* Table */}
      <div className="w-full h-[500px] overflow-y-auto border border-[#D1E5D9] rounded-[12px]">
        <table className="w-full table-auto text-sm">
          <thead className="bg-[#F4F8FB] h-[46px] rounded-[10px]">
            <tr className="text-left text-gray-600">
              <th className="py-3 px-4">Patient</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.map((appt, idx) => (
                <tr key={idx} className="border-t border-[#E5E7EB]">
                  <td className="py-2 px-4">{appt.patient_name}</td>
                  <td className="py-2 px-4">{appt.appointment_time}</td>
                  <td className="py-2 px-4">{appt.contact}</td>
                  <td className="py-2 px-4">
                    <span className="text-[#098289] border border-[#098289] px-3 py-1 rounded-full">{appt.type}</span>
                  </td>
                  <td className="py-2 px-4">
                    <span className="text-green-600 border border-green-600 px-3 py-1 rounded-full">{appt.status}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  No appointments for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TodaysAppointment;
