import React, { useEffect, useState, useRef } from 'react';
import { FaCalendarAlt, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import patientImage from '../../../assets/patientimage.svg';
import leftarrow from '../../../assets/LeftArrow.svg';  // Import left arrow icon

interface Patient {
  id: number;
  full_name: string;
  dob: string;
  phone_number: string;
  status: string;
  doctor_id: number;
  doctor_name: string;
  department: string;
  email?: string;
  gender?: string;
  allergies?: string;
  medications?: string;
  conditions?: string;
}

interface Appointment {
  appointment_id: number;
  patient_id: number;
  appointment_time: string;
  status: string;
}

const PatientProfilePanel: React.FC<{
  patient: Patient;
  onClose: () => void;
}> = ({ patient, onClose }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientDetails, setPatientDetails] = useState<Patient>(patient);
  const [showPrescription, setShowPrescription] = useState(false); // To control visibility of prescription modal
  const sidebarRef = useRef<HTMLDivElement>(null); // Reference for the sidebar
  const prescriptionRef = useRef<HTMLDivElement>(null); // Reference for prescription modal

  // Fetch data on component mount and whenever patient changes
  useEffect(() => {
    axios
      .get('https://medical-assistant1.onrender.com/appointments')
      .then((res) => {
        const appts = res.data.appointments.filter(
          (a: Appointment) => a.patient_id === patient.id
        );
        setAppointments(appts);
      });

    axios
      .get('https://medical-assistant1.onrender.com/patients')
      .then((res) => {
        const found = res.data.patients.find((p: Patient) => p.id === patient.id);
        if (found) setPatientDetails(found);
      });
  }, [patient.id]);

  // Close the modal or sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showPrescription && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose(); // Close sidebar only if prescription modal is not active
      }
      if (showPrescription && prescriptionRef.current && !prescriptionRef.current.contains(event.target as Node)) {
        setShowPrescription(false); // Close prescription modal only when clicking outside
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, showPrescription]);

  const past = appointments.filter((a) => new Date(a.appointment_time) < new Date());
  const upcoming = appointments.filter((a) => new Date(a.appointment_time) >= new Date());

  const avatarUrl = patientImage;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50">
      <div
        ref={sidebarRef}
        className="bg-white w-[450px] h-[100vh] overflow-y-scroll px-[24px] shadow-xl transition-transform duration-300 ease-out rounded-l-xl"
      >
        {/* Header */}
        <div className="w-[402px] h-[47px] flex justify-between items-center pt-[16px] pb-[8px] top-0 bg-white">
          {/* Left Arrow Button */}
          <img
            src={leftarrow}
            alt="Close Sidebar"
            onClick={onClose} // Close sidebar on click
            className="cursor-pointer"
          />
          <h2 className="text-lg font-semibold text-center flex-1 ml-4">Patient Profile</h2>
        </div>
        {/* Profile Info */}
        <div className="flex flex-col items-center mt-2 w-[402px] min-h-[269px] pt-[16px] pb-[16px] border-b border-gray-200">
          <img src={avatarUrl} alt="avatar" className="w-[128px] h-[128px] min-h-[128px] rounded-full" />
          <h3 className="text-lg font-bold mt-2">{patientDetails.full_name}</h3>
          <p className="text-sm text-gray-500">Patient ID: #{patientDetails.id}</p>
          <p className="text-xs text-[#098289] mt-1">
            Recent Visit: {past[0]?.appointment_time ? new Date(past[0].appointment_time).toLocaleString() : 'N/A'}
          </p>
        </div>

        {/* Personal Details */}
        <div className="w-[402px] min-h-[172px] pt-[16px] pb-[16px]">
          <h4 className="font-semibold text-[#098289] mb-2">Personal Details</h4>
          <p className="text-sm">
            <strong>Contact:</strong> {patientDetails.phone_number}
          </p>
          <p className="text-sm">
            <strong>Email:</strong> {patientDetails.email ?? 'emma.davis@email.com'}
          </p>
          <p className="text-sm">
            <strong>Age:</strong>{' '}
            {patientDetails.dob
              ? `${new Date().getFullYear() - new Date(patientDetails.dob).getFullYear()} yrs (${patientDetails.dob})`
              : 'N/A'}
          </p>
          <p className="text-sm">
            <strong>Gender:</strong> {patientDetails.gender ?? 'Female'}
          </p>
        </div>

        {/* Medical History */}
        <div className="w-[402px] min-h-[134px] pt-[8px] pb-[16px]">
          <h4 className="font-semibold text-[#098289] mb-2">Medical History</h4>
          <p className="text-sm"><strong>Allergies:</strong> {patientDetails.allergies ?? 'Penicillin, Aspirin'}</p>
          <p className="text-sm"><strong>Medications:</strong> {patientDetails.medications ?? 'Lisinopril, Metformin'}</p>
          <p className="text-sm"><strong>Conditions:</strong> {patientDetails.conditions ?? 'Type 2 Diabetes, Hypertension'}</p>
        </div>

        {/* Past Appointments */}
        <div className="w-[402px] min-h-[255px]">
          <h4 className="font-semibold text-[#098289] mb-2">Past Appointments</h4>
          {past.map((a, i) => (
            <div key={i} className="flex justify-between items-center p-2 border border-gray-200 rounded-md mb-2">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-sm text-gray-500" />
                <div>
                  <p className="text-sm">{new Date(a.appointment_time).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">{new Date(a.appointment_time).toLocaleTimeString()}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrescription(true)} // Show prescription on click
                className="text-[#098289] border border-[#098289] px-3 py-1 rounded-full text-xs"
              >
                View Prescription
              </button>
            </div>
          ))}
        </div>

        {/* Upcoming Appointments */}
        <div className="w-[402px] min-h-[111px] mt-2 pb-6">
          <h4 className="font-semibold text-[#098289] mb-2">Upcoming Appointments</h4>
          {upcoming.map((a, i) => (
            <div key={i} className="flex justify-between items-center p-2 border border-gray-200 rounded-md">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-sm text-gray-500" />
                <div>
                  <p className="text-sm">{new Date(a.appointment_time).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">{new Date(a.appointment_time).toLocaleTimeString()}</p>
                </div>
              </div>
              <button className="text-[#098289] bg-[#0982891A] border border-[#098289] px-3 py-1 rounded-full text-xs">Scheduled</button>
            </div>
          ))}
        </div>
      </div>

      {/* Prescription Modal */}
      {showPrescription && (
        <div className="absolute inset-0  flex justify-center items-center bg-black/50">
          <div className="bg-white w-[400px] p-4 rounded-lg shadow-lg" ref={prescriptionRef}>
            <h4 className="font-semibold text-[#098289] mb-2">Recommended Medicines</h4>
            <ul className="text-sm">
              {/* Static data for recommended medicines */}
              <li>Lisinopril - 10 mg, once a day</li>
              <li>Metformin - 500 mg, twice a day</li>
              <li>Aspirin - 81 mg, once a day</li>
            </ul>
            {/* Close button on top-right corner */}
            <FaTimes
              className="absolute top-2 right-2 cursor-pointer text-[#098289]"
              onClick={() => setShowPrescription(false)} // Close the modal when clicking the icon
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfilePanel;
