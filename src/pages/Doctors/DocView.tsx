// ✅ Final integrated doctorview.tsx with FaArrowLeft close icon

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FaStar, FaCalendarAlt, FaArrowLeft } from 'react-icons/fa';
import { FiHeart } from 'react-icons/fi';
import axios from 'axios';
import DoctorProfileModal from './profile';
import DocProfile from '../../assets/DocProfile.svg';
import DocP from '../../assets/DocP.svg';
import dual from '../../assets/dual.svg';
import DoctorAppointmentsPage from '../Appointments/DoctorAppointmentsPage';

interface Doctor {
  id: number;
  name: string;
  department: string;
  email: string;
  patients?: number;
  rating?: number;
}

interface DoctorResponse {
  doctors: Doctor[];
}

interface CategoryResponse {
  categories: string[];
}

const DoctorCard = ({
  doctor,
  onViewProfile,
  onOpenAppointments
}: {
  doctor: Doctor;
  onViewProfile: (doctor: Doctor) => void;
  onOpenAppointments: (name: string) => void;
}) => (
  <div className="w-[450.67px] h-[156px] bg-white rounded-[12px] border-none shadow-sm p-4  flex justify-between items-center m">
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-green-600 font-medium">Active</span>
        <span className="text-orange-500 font-medium flex items-center gap-1 bg-[#FF912426] rounded-[5px] px-2 py-[2px]">
          <img src={dual} className="w-3 h-3" /> {doctor.patients ?? 256} Patients
        </span>
        <span className="text-gray-800 font-medium flex items-center gap-1">
          <FaStar className="text-yellow-500" /> {doctor.rating ?? 4.2} / 5
        </span>
      </div>

      <div className="mt-1">
        <h2 className="text-[16px] font-bold text-gray-900 text-left">{doctor.name}</h2>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <FiHeart className="text-gray-400" /> {doctor.department}
        </p>
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={() => onOpenAppointments(doctor.name)}
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-[6px] rounded-md flex items-center gap-2">
          <FaCalendarAlt className="text-[14px]" /> Appointments
        </button>

        <button
          onClick={() => onViewProfile(doctor)}
          className="border-[2px] border-[#098289] text-sm px-4 py-[6px] rounded-md flex items-center gap-2 text-[#098289]">
          <img src={DocP} className="text-[14px]" /> Profile
        </button>
      </div>
    </div>

    <img src={DocProfile} alt="Doctor" className="w-[119px] h-[118px] object-cover rounded-[12px]" />
  </div>
);

export default function DoctorsGrid() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarDoctorName, setSidebarDoctorName] = useState<string | null>(null);

  const location = useLocation();
  const searchQuery = new URLSearchParams(location.search).get('search') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, catRes] = await Promise.all([
          axios.get<DoctorResponse>('https://medical-assistant1.onrender.com/doctors'),
          axios.get<CategoryResponse>('https://medical-assistant1.onrender.com/categories'),
        ]);
        setDoctors(docRes.data.doctors);
        setCategories(catRes.data.categories);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let results = doctors.filter((doc) => doc.name.toLowerCase() !== 'temp doctor');

    if (searchQuery) {
      results = results.filter((doctor) =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== 'All') {
      results = results.filter(
        (doctor) =>
          doctor.department &&
          doctor.department.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
      );
    }

    setFilteredDoctors(results);
  }, [searchQuery, selectedCategory, doctors]);

  const handleViewProfile = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
  };

  const handleOpenAppointments = (doctorName: string) => {
    setSidebarDoctorName(doctorName);
    setShowSidebar(true);
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
    setSidebarDoctorName(null);
  };

  const finalFilteredDoctors = filteredDoctors.length > 0 ? filteredDoctors : doctors;

  return (
    <div className="w-[1400px] min-h-[992px] mx-auto mt-20 relative">
      <div className="flex justify-between items-center px-4 py-3">
        <h1 className="text-xl font-semibold font-[Geist]">Doctors</h1>
        <select
          className="w-[129px] h-[40px] border-[2px] border-[#098289] rounded-[4px] px-2 py-[8px] text-sm text-gray-700"
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All">All</option>
          {categories
            .filter((cat) => typeof cat === 'string' && cat.toLowerCase() !== 'temp')
            .map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-[16px] pb-6 overflow-y-auto max-h-[900px]">
        {finalFilteredDoctors.length === 0 ? (
          <p className="text-gray-500 mt-6 text-center w-full">
            No doctors found for this category or search.
          </p>
        ) : (
          finalFilteredDoctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onViewProfile={handleViewProfile}
              onOpenAppointments={handleOpenAppointments}
            />
          ))
        )}
      </div>

      {selectedDoctor && (
        <DoctorProfileModal
          doctor={selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
        />
      )}

      {showSidebar && sidebarDoctorName && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50">
          <div className="bg-white w-[500px] h-full overflow-y-auto rounded-l-xl shadow-xl transform transition-transform duration-300 translate-x-0">
            <div className="flex items-center justify-between p-4">
              <FaArrowLeft
                onClick={handleCloseSidebar}
                className="cursor-pointer text-gray-600"
                size={24}
              />
            </div>
            <DoctorAppointmentsPage doctorName={sidebarDoctorName} onClose={handleCloseSidebar} />
          </div>
        </div>
      )}
    </div>
  );
}
