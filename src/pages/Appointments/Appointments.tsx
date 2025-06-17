import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBone } from 'react-icons/fa';
import { GiBrain } from 'react-icons/gi';
import { MdScience } from 'react-icons/md';
import { AiOutlineUser } from 'react-icons/ai';
import { GoHeart } from 'react-icons/go';
import { RiPulseLine } from 'react-icons/ri';

const departmentIcons: Record<string, React.ReactNode> = {
  Cardiology: <GoHeart />,
  Neurology: <GiBrain />,
  Orthopedics: <FaBone />,
  Endocrinology: <MdScience />,
  Pediatrics: <AiOutlineUser />,
  'General Physician': <RiPulseLine />,
};

const fetchWithRetry = async (url: string, retries = 3): Promise<any> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (error) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, 1000));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
};

const AppointmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [appointmentsPerDept, setAppointmentsPerDept] = useState<Record<string, number>>({});
  const [doctorsPerDept, setDoctorsPerDept] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [deptRes, apptStatsRes, doctorsRes] = await Promise.all([
          fetchWithRetry('https://medical-assistant1.onrender.com/categories'),
          fetchWithRetry('https://medical-assistant1.onrender.com/dashboard/appointments-by-department'),
          fetchWithRetry('https://medical-assistant1.onrender.com/doctors'),
        ]);

        const filteredDepts = (deptRes.categories || []).filter(
          (d: string) => !d.toLowerCase().includes('temp')
        );
        setDepartments(filteredDepts);

        const apptMap: Record<string, number> = {};
        apptStatsRes.data.forEach((item: any) => {
          apptMap[item.department] = item.count;
        });
        setAppointmentsPerDept(apptMap);

        const docMap: Record<string, number> = {};
        (doctorsRes.doctors || []).forEach((doc: any) => {
          if (doc.department) {
            docMap[doc.department] = (docMap[doc.department] || 0) + 1;
          }
        });
        setDoctorsPerDept(docMap);
      } catch (err) {
        console.error(err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalAppointments = Object.values(appointmentsPerDept).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen max-w-[1400px] mt-15 font-sf">
      {/* Top spacing for Topbar */}

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="bg-white rounded-2xl h-screen  p-6">
          <div className="text-[18px] font-geist font-semibold mb-6 flex items-center gap-2">
            <span>Appointments -</span>
            <span className="text-[#098289] font-sf">{totalAppointments.toLocaleString()}</span>
          </div>

          <div className="flex flex-wrap gap-4">
            {loading ? (
              <p className="text-sm text-gray-500 font-sf">Loading departments...</p>
            ) : error ? (
              <p className="text-sm text-red-500 font-sf">{error}</p>
            ) : departments.length === 0 ? (
              <p className="text-sm text-gray-500 font-sf">No departments available.</p>
            ) : (
              departments.map((dept, index) => (
                <div
                  key={index}
                  onClick={() => navigate(`/appointments/department/${encodeURIComponent(dept)}`)}
                  className="cursor-pointer w-full sm:w-[48%] md:w-[30%] bg-gradient-to-b from-white to-[#f9f9f9] border border-[#D1E5D9] rounded-xl p-4 flex flex-col gap-3 hover:shadow-md transition"
                >
                  <div className="text-[28px] text-[#1D7885]">
                    {departmentIcons[dept] ?? <RiPulseLine />}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 font-sf font-bold text-[16px]">
                    <span>{dept}</span>
                    <span>-</span>
                    <span className="text-[#555B6C] font-sf text-[14px]">
                      {appointmentsPerDept[dept] || 0} Appointments
                    </span>
                  </div>

                  <div className="text-[#555B6C] font-sf  text-[14px]">
                    {doctorsPerDept[dept] || 0} Doctors
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
