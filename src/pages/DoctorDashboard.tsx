import React from 'react';
import WelcomeBanner from '../components/WelcomeBanner';  // Import the WelcomeBanner component
import StatCards from '../components/StatCards';  // Import the StatCards component
import Feedback from '../components/Feedback';
import PatientsOverview from '../components/patientsoverviewchart';
import AppointmentTrendsContainer from '../components/AppointmentsChart';
import AppointmentsCard from '../components/AppointmentList';
import TodaysAppointment from '../components/TodaysAppointments';


const DoctorDashboard: React.FC = () => {
  return (
    <div className="w-screen h-fit pt-[64px] bg-[#F4F8FB]">
      {/* Main container with width and height for consistent dimensions */}
      <div className="w-[1400px] h-[1425px]  py-6 mx-auto">
        
        {/* Welcome Banner */}
        <div className="w-full mb-4"> {/* Added margin-bottom here for gap */}
          <WelcomeBanner />
        </div>

        {/* Stat Cards */}
        <div className="w-full mb-4"> {/* Added margin-bottom here for consistency */}
          <StatCards />
        </div>
        <div className="w-full mb-4">
            <Feedback/>
        </div>
        <div className="mt-5 flex gap-[15px]">
                <AppointmentTrendsContainer />
                <PatientsOverview />
                <AppointmentsCard/>
        </div>
        <div className="w-full flex space-x-4 mt-5">
                    <TodaysAppointment />
        </div>
    

        
      </div>
    </div>
  );
};

export default DoctorDashboard;
