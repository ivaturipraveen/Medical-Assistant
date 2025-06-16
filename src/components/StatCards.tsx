import React from 'react';
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
      className="flex flex-col justify-between rounded-[10px] bg-white p-4 gap-2 shadow-sm min-w-[158px]"
      style={{ width: '332px', height: '140px' }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="text-blue-500">{icon}</div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{value}</h2>
        <p className={`text-xs font-medium ${trendColor}`}>{trend}</p>
      </div>
    </div>
  );
};

const StatCards = () => {
  return (
    <div
      className="flex gap-6"
      style={{ width: '1400px', height: '140px' }}
    >
      <StatCard
        title="Total Patients"
        value="1,24,587"
        icon={<Users className="w-5 h-5" />}
        trend="▲ 40% vs last month"
        trendColor="text-green-500"
      />
      <StatCard
        title="Total Doctors"
        value="876"
        icon={<UserPlus className="w-5 h-5" />}
        trend="▲ 40% vs last month"
        trendColor="text-green-500"
      />
      <StatCard
        title="Total Appointments"
        value="60,543"
        icon={<CalendarDays className="w-5 h-5" />}
        trend="▼ 13% vs last month"
        trendColor="text-red-500"
      />
      <StatCard
        title="Upcoming Appointments"
        value="4,587"
        icon={<CalendarCheck2 className="w-5 h-5" />}
        trend="▼ 8% vs last month"
        trendColor="text-red-500"
      />
    </div>
  );
};

export default StatCards;
