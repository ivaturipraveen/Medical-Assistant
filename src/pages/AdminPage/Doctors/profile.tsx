import { useEffect, useRef, useState } from 'react';
import { FaStar} from 'react-icons/fa';
import { FiHeart } from 'react-icons/fi';
import axios from 'axios';
import Docp from '../../../assets/dual.svg';
import Docprofile from "../../../assets/DocProfile.svg";
import leftarrow from '../../../assets/LeftArrow.svg';
interface Doctor {
  id: number;
  name: string;
  department: string;
  rating?: number;
}

interface AvailabilityResponse {
  availability: { [day: string]: string[] };
}

function formatTime(time24: string): string {
  const [hourStr, minuteStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr.padStart(2, '0');
  hour = hour % 12 || 12;
  const ampm = parseInt(hourStr, 10) >= 12 ? '' : '';
  return `${hour}:${minute} ${ampm}`;
}

export default function DoctorProfileModal({
  doctor,
  onClose,
}: {
  doctor: Doctor | null;
  onClose: () => void;
}) {
  if (!doctor) return null;

  const [availability, setAvailability] = useState<{ [day: string]: string[] }>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await axios.get<AvailabilityResponse>(
          `https://medical-assistant1.onrender.com/doctors/${doctor.id}/availability`
        );
        setAvailability(res.data.availability || {});
      } catch (err) {
        console.error('Failed to fetch availability:', err);
      }
    };
    fetchAvailability();
  }, [doctor.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50">
      <div
        ref={modalRef}
        className="bg-white w-full max-w-[500px] h-full overflow-y-auto rounded-l-xl shadow-xl transform transition-transform duration-300 translate-x-0"
      >
        {/* Header */}
        <div className="flex items-center mb-4 p-6 font-sf">
         <img src={leftarrow} className="cursor-pointer" onClick={onClose} />
          <h2 className="mx-auto text-lg font-semibold font-Geist">Doctor Profile</h2>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center px-6">
          <img src={Docprofile} className="w-[120px] h-[120px] rounded-full" />
          <h2 className="text-xl font-bold mt-2 text-center font-sf">
            {doctor.name}
            <span className="block text-sm text-gray-600 font-sf">MD, MBBS</span>
          </h2>
          <p className="text-teal-700 font-medium text-sm flex items-center gap-1">
            <FiHeart /> {doctor.department}
          </p>
          <div className="flex gap-3 mt-2 text-sm flex-wrap justify-center">
            <span className="text-green-600 font-medium">Active</span>
            <span className="text-orange-500 flex items-center gap-1 bg-[#FF912426] px-2 py-[2px] rounded">
              <img src={Docp} className="w-3 h-3" />
              256 Patients
            </span>
            <span className="flex items-center gap-1 text-gray-700">
              <FaStar className="text-yellow-400" /> {doctor.rating ?? 4.2} / 5
            </span>
          </div>
        </div>

        {/* Main Info */}
        <div className="w-full max-w-[420px] mx-auto text-left px-6">
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Dr. Hayes is a board-certified cardiologist with over 15 years of experience...
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Areas of Expertise</h3>
            <div className="flex gap-2 flex-wrap">
              {['Cardiology', 'Heart Failure', 'Arrhythmias'].map((area, i) => (
                <span key={i} className="bg-gray-100 text-gray-700 text-sm px-3 py-[4px] rounded">
                  {area}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm font-sf">
            <div>
              <h4 className="text-teal-700 font-semibold">Professional Detail</h4>
              <p className="text-gray-700">Cardiologist at City Hospital</p>
            </div>
            <div>
              <h4 className="text-teal-700 font-semibold">Registration No.</h4>
              <p className="text-gray-700">987654321</p>
            </div>
            <div>
              <h4 className="text-teal-700 font-semibold">Languages</h4>
              <p className="text-gray-700">English, Hindi, Telugu</p>
            </div>
            <div>
              <h4 className="text-teal-700 font-semibold">Certifications</h4>
              <p className="text-gray-700">Board Certified in Cardiology</p>
            </div>
            <div>
              <h4 className="text-teal-700 font-semibold">Education & Training</h4>
              <p className="text-gray-700">
                Medical School: University of California, Los Angeles <br />
                Residency: City Hospital
              </p>
            </div>

            {/* Availability */}
            <div className="mt-6">
              <h3 className="text-teal-700 font-semibold text-sm mb-2">Available Timings</h3>
              {Object.keys(availability).length === 0 ? (
                <p className="text-gray-500 italic">No availability data</p>
              ) : (
                <div className="text-gray-700 text-sm space-y-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => {
                    const matchedKey = Object.keys(availability).find(
                      (key) => key.trim().toLowerCase() === day.toLowerCase()
                    );
                    const slots = matchedKey ? availability[matchedKey] : [];

                    if (!slots || slots.length === 0) {
                      return (
                        <p key={day}>
                          <strong>{day}:</strong> No slots
                        </p>
                      );
                    }

                    const sortedSlots = [...slots].sort();
                    const start = sortedSlots[0];
                    const end = sortedSlots[sortedSlots.length - 1];

                    return (
                      <p key={day}>
                        <strong>{day}:</strong> {formatTime(start)} - {formatTime(end)}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
