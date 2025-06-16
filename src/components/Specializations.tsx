import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    axios
      .get<{ doctors: { department: string }[] }>(
        'https://medical-assistant1.onrender.com/doctors'
      )
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
      .catch((err: unknown) =>
        console.error('Failed to fetch doctors:', err)
      );
  }, []);

  const departments = Object.entries(doctorStats);

  return (
    <div className="w-full max-w-[930px] p-6 rounded-[10px] bg-white flex flex-col justify-between shadow-sm relative top-[20px] left-[10px]">
      {/* Header */}
      <div className="flex justify-between items-start w-full">
        <h2 className="h-[40px] text-lg font-semibold text-gray-900">
          Latest Updates On Specializations
        </h2>
        <button className="text-emerald-800 border border-emerald-800 w-[82px] h-[40px] pt-[9px] pr-[16px] pb-[12px] pl-[16px] rounded-[4px] text-sm hover:bg-emerald-50 transition mt-[-4px]">
          View all
        </button>
      </div>

      {/* Specialization Cards */}
      <div className="flex flex-wrap gap-[20px] mt-4">
        {departments.map(([title, count], index) => (
          <div
            key={index}
            className="inline-flex flex-col items-center justify-center text-center gap-1 px-4 py-3 border border-gray-200 rounded-lg bg-white hover:shadow-md transition"
          >
            <div>{getIconByDepartment(title)}</div>
            <div className="font-semibold text-gray-900 text-sm capitalize max-w-[160px] truncate">
              {title}
            </div>
            <div className="text-xs text-gray-600">{count} Doctors</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Specializations;
