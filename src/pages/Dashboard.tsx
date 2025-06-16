import Topbar from '../components/Topbar';
import WelcomeBanner from '../components/WelcomeBanner';
import StatCards from '../components/StatCards';
import Specializations from '../components/Specializations';
import PatientsOverview from '../components/patientsoverviewchart';
import AppointmentsCard from '../components/AppointmentList';
import AppointmentTrendsContainer from '../components/AppointmentsChart';
import NewPatientsTable from '../components/NewPatients';

export default function Dashboard() {
  return (
    <div className="w-[1920px] h-[1488px] bg-gray-50">
      <Topbar />
      <div className="px-10 py-6 space-y-6">
        <WelcomeBanner />
        <StatCards />

        {/* Specializations + Appointments */}
        <div className="flex gap-[15px] items-start">
          <div className="w-[930px]">
            <Specializations />

            {/* ↓ Below Specializations with 20px gap */}
            <div className="mt-5 flex gap-[15px]">
              <PatientsOverview />
              <AppointmentTrendsContainer />
            </div>
          </div>

          <div className="w-[455px]">
            <AppointmentsCard />
          </div>
        </div>
        {/* New Patients Table */}
  <NewPatientsTable />


      </div>
    </div>
  );
}
