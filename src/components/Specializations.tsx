import { useEffect, useState, useRef } from 'react';
import { FaBone } from 'react-icons/fa';
import { GiBrain } from 'react-icons/gi';
import { MdScience } from 'react-icons/md';
import { AiOutlineUser } from 'react-icons/ai';
import { GoHeart } from 'react-icons/go';
import { RiPulseLine } from 'react-icons/ri';
import axios from 'axios';

type DepartmentStats = Record<string, number>;

const getIconByDepartment = (department: string) => {
  switch (department.toLowerCase()) {
    case 'cardiology':
    case 'cardiologist':
      return <GoHeart className="text-2xl text-emerald-800" />;
    case 'general physician':
      return <RiPulseLine className="text-2xl text-emerald-800" />;
    case 'neurology':
      return <GiBrain className="text-2xl text-emerald-800" />;
    case 'orthopedic':
      return <FaBone className="text-2xl text-emerald-800" />;
    case 'endocrinology':
      return <MdScience className="text-2xl text-emerald-800" />;
    default:
      return <AiOutlineUser className="text-2xl text-emerald-800" />;
  }
};

const Specializations = () => {
  const [doctorStats, setDoctorStats] = useState<DepartmentStats>({});
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios
      .get<{ doctors: { department: string }[] }>('https://medical-assistant1.onrender.com/doctors')
      .then((res) => {
        const stats: DepartmentStats = {};
        res.data.doctors.forEach((doc) => {
          const dept = doc.department?.trim();
          if (dept && dept.toLowerCase() !== 'temp') {
            stats[dept] = (stats[dept] || 0) + 1;
          }
        });
        setDoctorStats(stats);
      })
      .catch((err) => console.error('Failed to fetch doctors:', err));
  }, []);

  const departments = Object.entries(doctorStats);

  // ✅ Handle outside click to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    };
    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModal]);

  return (
    <>
      <div className="w-full p-4 rounded-[10px] bg-white flex flex-col justify-between">
        {/* Header */}
        <div className="flex justify-between items-start w-full">
          <h2 className="h-[40px] text-lg font-semibold text-gray-900">
            Latest Updates On Specializations
          </h2>
          <button
            className="text-emerald-800 border border-emerald-800 w-[82px] h-[40px] pt-[9px] pr-[16px] pb-[12px] pl-[16px] rounded-[4px] text-sm hover:bg-emerald-50 transition mt-[-4px]"
            onClick={() => setShowModal(true)}
          >
            View all
          </button>
        </div>

        {/* Specialization Cards */}
        <div className="flex gap-4 mt-4 overflow-x-auto">
          {departments.slice(0, 5).map(([title, count], index) => (
            <div
              key={index}
              className="flex flex-col justify-between w-[155px] min-w-[155px] h-[104px] border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition"
            >
              <div>{getIconByDepartment(title)}</div>
              <div className="font-semibold text-black-900 text-sm capitalize text-left">{title}</div>
              <div className="text-xs text-gray-600 text-left">{count} Doctors</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50">
          <div
            ref={modalRef}
            className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">All Specializations</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-red-500 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {departments.map(([title, count], index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border border-gray-200 p-3 rounded-lg hover:shadow-sm"
                >
                  <div>{getIconByDepartment(title)}</div>
                  <div>
                    <div className="text-sm font-semibold capitalize">{title}</div>
                    <div className="text-xs text-gray-500">{count} Doctors</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Specializations;
