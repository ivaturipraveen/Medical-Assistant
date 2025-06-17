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
    <>
      <div className="w-[1920px] h-[1488px] bg-gray-50 mx-auto overflow-x-auto overflow-y-hidden">
        {/* Topbar Section */}
        <div className="w-full h-[64px]">
          <Topbar />
        </div>

        {/* Main Content: 1400x1425 centered inside 1920 */}
        <div className="w-[1400px] h-[1425px] mx-[260px] py-6">
          {/* Welcome Banner */}
          <div className="w-full mb-4">
            <WelcomeBanner />
          </div>

          {/* StatCards with bottom margin of exactly 20px */}
          <div className="w-full mb-5">
            <StatCards />
          </div>

          {/* Specializations + Side Panel */}
          <div className="flex gap-[15px] items-start w-full">
            {/* Left Column */}
            
            <div className="w-[930px] flex-none">
              <div className="mb-5">
                 <Specializations />
              </div>
              {/* Charts Row */}
              <div className="mt-5 flex gap-[15px]">
                <PatientsOverview />
                <AppointmentTrendsContainer />
              </div>
            </div>

            {/* Right Column */}
            <div className="w-[455px] flex-none">
              <AppointmentsCard />
            </div>
          </div>

          {/* New Patients Table */}
          <div className="w-full mt-5">
            <NewPatientsTable />
          </div>
        </div>
      </div>
    </>
  );
}
