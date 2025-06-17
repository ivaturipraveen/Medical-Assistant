import WelcomeBanner from '../components/WelcomeBanner';
import StatCards from '../components/StatCards';
import Specializations from '../components/Specializations';
import PatientsOverview from '../components/patientsoverviewchart';
import AppointmentsCard from '../components/AppointmentList';
import AppointmentTrendsContainer from '../components/AppointmentsChart';
import NewPatientsTable from '../components/NewPatients';
import DoctorListTable from '../components/DoctorListTable';

export default function Dashboard() {
  return (
    <>
      <div className="w-screen h-fit pt-[64px] bg-[#F4F8FB]  ">
        

        <div className="w-[1400px] h-[1425px]  py-6 mx-auto">
          <div className="w-full mb-4">
            <WelcomeBanner />
          </div>

          <div className="w-full mb-4">
            <StatCards />
          </div>

          {/* Specializations + Side Panel */}
          <div className="flex gap-[16px] items-start w-full">
            {/* Left Column */}
            
            <div className="w-[930px] flex-none">
              <div className="mb-4">
                 <Specializations />
              </div>
              {/* Charts Row */}
              <div className="mt-5 flex gap-[15px]">
                <PatientsOverview />
                <AppointmentTrendsContainer />
              </div>
            </div>

            {/* Right Column */}
            <div className="flex-none">
              <AppointmentsCard />
            </div>
          </div>

          <div className="w-full flex space-x-4 mt-5">
            <NewPatientsTable />
            <DoctorListTable />
          </div>
        </div>
      </div>
    </>
  );
}
