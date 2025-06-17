import React, { useEffect, useState } from 'react';
import { Users, UserPlus, CalendarDays, CalendarCheck2 } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendColor: string;
}

const StatCard = ({ title, value, icon, trend, trendColor }: StatCardProps) => {
  return (
    <div
      className="relative bg-white rounded-[10px] shadow-sm p-4"
      // The width is defined here and includes its own padding due to Tailwind's box-sizing.
      // 4 * 332px (cards) + 3 * 6px (gaps) = 1328 + 18 = 1346px. This will fit within 1400px.
      style={{ width: '332px', height: '140px' }}
    >
      {/* Title at top-left */}
      <h3 className="text-sm font-medium text-black-400 absolute top-4 left-4">
        {title}
      </h3>

      {/* Icon shifted slightly down on the right */}
      <div className="absolute top-[52px] right-4 w-[60px] h-[60px] p-[6px] rounded-[4px] flex items-center justify-center text-[rgb(9,130,137)] text-opacity-[0.15]">
        {icon}
      </div>

      {/* Value and Trend on the left below title */}
      <div className="mt-7 text-align-right justify-baseline absolute left-4">
        <h2 className="text-5xl font-bold text-gray-900 text-left ">{value}</h2>
        <p className={`text-xs font-medium mt-3 ${trendColor}`}>{trend} <span className='text-gray-500'>vs last month</span></p>
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
        icon={<Users className="w-12 h-12" />}
        trend="▲ 40% "
        trendColor="text-green-500"
      />
      <StatCard
        title="Total Doctors"
        value={stats.total_doctors.toLocaleString()}
        icon={<UserPlus className="w-12 h-12" />}
        trend="▲ 22% "
        trendColor="text-green-500"
      />
      <StatCard
        title="Total Appointments"
        value={stats.total_appointments.toLocaleString()}
        icon={<CalendarDays className="w-12 h-12" />}
        trend="▼ 13% "
        trendColor="text-red-500"
      />
      <StatCard
        title="Upcoming Appointments"
        value={stats.upcoming_appointments.toLocaleString()} 
        icon={<CalendarCheck2 className="w-12 h-12" />}
        trend="▲ 5% today"
        trendColor="text-green-500"
      />
    </div>
  );
};

export default StatCards;
