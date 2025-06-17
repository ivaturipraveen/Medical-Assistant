import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaCalendarAlt } from 'react-icons/fa';
import DocProfile from '../../assets/DocProfile.svg';
import dual from '../../assets/dual.svg';

interface Doctor {
  id: number;
  name: string;
  department: string;
  email: string;
  rating?: number;
}

interface Appointment {
  appointment_id: number;
  appointment_time: string;
  patient_name: string;
  doctor_name: string;
  department: string;
  status: string;
}

const DepartmentAppointments: React.FC = () => {
  const { deptName } = useParams<{ deptName: string }>();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctorPatientCount, setDoctorPatientCount] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doctorRes, apptRes] = await Promise.all([
          fetch('https://medical-assistant1.onrender.com/doctors'),
          fetch('https://medical-assistant1.onrender.com/appointments'),
        ]);
        const doctorsData = await doctorRes.json();
        const apptData = await apptRes.json();

        const deptDoctors: Doctor[] = (doctorsData.doctors || []).filter(
          (d: any) => d.department === deptName
        );
        const deptDoctorNames = deptDoctors.map((d: Doctor) => d.name);

        const filteredAppts = (apptData.appointments || []).filter(
          (a: Appointment) =>
            a.department === deptName && deptDoctorNames.includes(a.doctor_name)
        );

        setDoctors(deptDoctors);
        setAppointments(filteredAppts);

        const countMap: Record<string, Set<string>> = {};
        for (const appt of filteredAppts) {
          if (!countMap[appt.doctor_name]) {
            countMap[appt.doctor_name] = new Set();
          }
          countMap[appt.doctor_name].add(appt.patient_name);
        }

        const finalCount: Record<string, number> = {};
        for (const [doctorName, patientsSet] of Object.entries(countMap)) {
          finalCount[doctorName] = patientsSet.size;
        }

        setDoctorPatientCount(finalCount);
      } catch (err) {
        setError('Failed to load department data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deptName]);

  const handleAppointmentClick = (doctorId: number) => {
    navigate(`/appointments/${doctorId}`);
  };

  return (
    <div className="w-full h-screen pt-20 ">
      <div className="w-[1400px] max-w-[1400px] h-screen mx-auto bg-white p-6 rounded-2xl ">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-semibold text-black">
            Appointments / {deptName} -{' '}
            <span className="text-[#098289] font-semibold ml-1">{appointments.length}</span>
          </h1>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <div className="flex flex-wrap gap-[16px] overflow-y-auto max-h-[800px]">
            {doctors.map((doc) => {
              const patientCount = doctorPatientCount[doc.name] ?? 0;

              return (
                <div
                  key={doc.id}
                  className="w-[434px] h-[121px] bg-white rounded-[12px] p-4 shadow-sm flex justify-between items-center gap-4 border border-[#D1E5D9]"
                >
                  <div className="flex flex-col justify-between h-full w-[270px]">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-green-600 font-medium">Active</span>
                      <span className="text-orange-500 font-medium flex items-center gap-1 bg-[#FF912426] rounded-[5px] px-2 py-[2px]">
                        <img src={dual} className="w-3 h-3" /> {patientCount} Patients
                      </span>
                      <span className="text-gray-800 font-medium flex items-center gap-1">
                        <FaStar className="text-yellow-500" /> {doc.rating ?? 4.2} / 5
                      </span>
                    </div>

                    <div className="mt-1">
                      <h2 className="text-[16px] font-bold text-gray-900 text-left">
                         {doc.name}
                      </h2>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => handleAppointmentClick(doc.id)}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-[6px] rounded-md flex items-center gap-2"
                      >
                        <FaCalendarAlt className="text-[14px]" /> Appointments
                      </button>
                    </div>
                  </div>

                  <img
                    src={DocProfile}
                    alt="Doctor"
                    className="w-[100px] h-[100px] object-cover rounded-[12px]"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentAppointments;
