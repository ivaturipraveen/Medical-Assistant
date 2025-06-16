import React from "react";
import { FaClock, FaArrowLeft, FaArrowRight } from "react-icons/fa";

const appointments = Array(5).fill({
  patientName: "Vignesh Gorakala",
  time: "08:00 - 12:00",
  doctorName: "Dr. Robert Harris",
  specialization: "Cardiologist",
  avatar: "https://i.pravatar.cc/60?img=32", // Replace with your own image if needed
});

const AppointmentsCard = () => {
  return (
    <div className="bg-white rounded-[10px] p-6 flex flex-col gap-6 w-[455px] h-[600px]">
      {/* Header */}
      <div className="flex justify-between items-center w-full">
        <h2 className="text-lg font-semibold text-[#0D1A12]">Appointments</h2>
        <button
          className="text-teal-700 text-sm border border-teal-700 hover:bg-teal-50 transition rounded px-4 py-2"
        >
          View all
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-4 w-full">
        <button className="bg-[#F4F4F4] rounded-full p-2">
          <FaArrowLeft />
        </button>

        <div className="flex items-center gap-1.5 text-slate-800 overflow-x-auto">
          {[18, 19, 20, 21, 22, 23, 24].map((date, i) => {
            const days = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
            const active = date === 21;
            return (
              <div
                key={date}
                className={`flex flex-col items-center px-3 py-1 rounded-md ${
                  active ? "bg-[#F4F4F4] border border-teal-700" : ""
                }`}
              >
                <span className="text-sm font-semibold">{date}</span>
                <span className="text-xs font-semibold">{days[i]}</span>
              </div>
            );
          })}
        </div>

        <button className="bg-[#F4F4F4] rounded-full p-2">
          <FaArrowRight />
        </button>
      </div>

      {/* Appointments List */}
      <div className="flex flex-col gap-4 overflow-y-auto pr-1 w-full">
        {appointments.map((appt, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center border rounded-md overflow-hidden"
          >
            <div className="flex items-center gap-4 px-4 py-2">
              <img
                src={appt.avatar}
                alt={appt.patientName}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-semibold text-sm">{appt.patientName}</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <FaClock className="text-sm" />
                  <span>{appt.time}</span>
                </div>
              </div>
            </div>

            <div className="bg-teal-700 text-white px-4 py-3 flex flex-col items-start justify-center w-[150px]">
              <p className="text-sm font-semibold">{appt.doctorName}</p>
              <p className="text-xs">{appt.specialization}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default AppointmentsCard;
