import React, { useEffect, useState } from 'react';
import Person from '../assets/person.svg';
import Doctor from '../assets/Doctor.svg';
import calender from '../assets/calender.svg';
import appointments from '../assets/appointment.svg';
import up from '../assets/up.png';
import down from '../assets/down.png';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendColor: string;
}

const StatCard = ({ title, value, icon, trend, trendColor }: StatCardProps) => {
  const isNegativeTrend = trendColor.includes('red');

  return (
    <div className="w-[332px] h-[140px] relative z-0 bg-white rounded-[10px] p-4">
      <h3 className="text-sm font-sf font-regular text-black-400 absolute top-4 left-4">
        {title}
      </h3>

      {/* Main icon */}
      <div className="absolute top-[40px] right-4 flex text-[rgb(9,130,137)]">
        <img src={icon as string} alt="icon" className="w-full h-full" />
      </div>

      {/* Value and trend */}
      <div className="mt-7 absolute left-4">
        <h2 className="text-5xl font-bold text-gray-900 text-left">{value}</h2>

        <div className="flex items-center justify-center gap-2 mt-3">
          <img
            src={isNegativeTrend ? down : up}
            alt="trend icon"
            className="w-3 h-3 "
          />
          <p className={`text-xs font-medium ${trendColor}`}>
            {trend} <span className="text-gray-500">vs last month</span>
          </p>
        </div>
      </div>
    </div>
  );
};



const StatCards = () => {
  const [stats, setStats] = useState({
    total_patients: 0,
    total_doctors: 0,
    total_appointments: 0,
    todays_appointments: 0,
    upcoming_appointments: 0, // added field
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('https://medical-assistant1.onrender.com/dashboard/stats');
        const data = await response.json();
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    // Removed the explicit `width: '1400px'` inline style.
    // This div will now correctly take `w-full` from its parent in dashboard.tsx (which is 1400px),
    // and its internal flex items (StatCards) with their defined widths and gaps will fit correctly.
    <div
      className="flex gap-6 w-full" // Added w-full here to ensure it takes the full parent width
      style={{ height: '140px' }} // Only keep the height style
    >
      <StatCard
        title="Total Patients"
        value={stats.total_patients.toLocaleString()}
        icon={Person}
        trend=" 40% "
        trendColor="text-green-500"
      />
      <StatCard
        title="Total Doctors"
        value={stats.total_doctors.toLocaleString()}
        icon={Doctor}
        trend="22% "
        trendColor="text-green-500"
      />
      <StatCard
        title="Total Appointments"
        value={stats.total_appointments.toLocaleString()}
        icon={calender}
        trend=" 13% "
        trendColor="text-red-500"
      />
      <StatCard
        title="Upcoming Appointments"
        value={stats.upcoming_appointments.toLocaleString()} 
        icon={appointments}
        trend="5% today"
        trendColor="text-green-500"
      />
    </div>
  );
};

export default StatCards;
