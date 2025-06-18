import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import axios from "axios";
import dayjs from "dayjs";
import { Clock } from "lucide-react";

// Props Interface
interface DoctorAppointmentsPageProps {
  doctorName: string;
  onClose: () => void;
}

// Appointment Header Component
const AppointmentHeader: React.FC<{
  view: string;
  setView: (view: string) => void;
}> = ({ view, setView }) => {
  return (
    <div className="font-geist flex items-center justify-between w-[407px] h-[40px] bg-white px-0 mx-auto">
      <div className="flex items-center">
        <h1 className="font-geist font-semibold text-[18px] leading-[28px] tracking-[0px] text-black">
          Appointments
        </h1>
      </div>
      <div className="flex">
        <button
          onClick={() => setView("month")}
          className={`w-[79px] h-[40px] border border-gray-300 text-center transition-all duration-200 flex items-center justify-center
            ${view === "month" ? "bg-teal-600 text-white" : "bg-white text-teal-600"}`}
          style={{ borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px", borderRight: "none" }}
        >
          <span className="font-[500] text-[15px] leading-[100%] tracking-[0%] text-center align-middle">
            Month
          </span>
        </button>
        <button
          onClick={() => setView("week")}
          className={`w-[79px] h-[40px] border border-gray-300 text-center transition-all duration-200 flex items-center justify-center
            ${view === "week" ? "bg-teal-600 text-white" : "bg-white text-teal-600"}`}
          style={{ borderTopRightRadius: "8px", borderBottomRightRadius: "8px" }}
        >
          <span className="font-[500] text-[15px] leading-[100%] tracking-[0%] text-center align-middle">
            Week
          </span>
        </button>
      </div>
    </div>
  );
};

// Custom Calendar Component
const CustomCalendar: React.FC<{
  selectedDate: dayjs.Dayjs;
  onDateChange: (date: dayjs.Dayjs) => void;
}> = ({ selectedDate, onDateChange }) => {
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate.startOf("month"));

  const goToPrevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
  const goToNextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));

  const firstDayOfMonth = currentMonth.startOf("month");
  const startOfWeek = firstDayOfMonth.startOf("week"); // This starts on Sunday

  const calendarDays = Array.from({ length: 42 }).map((_, index) => {
    return startOfWeek.add(index, "day");
  });

  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const isCurrentMonth = (date: dayjs.Dayjs) => date.month() === currentMonth.month();
  const isSelected = (date: dayjs.Dayjs) => date.isSame(selectedDate, "day");
  const isToday = (date: dayjs.Dayjs) => date.isSame(dayjs(), "day");

  return (
    <div className="w-[407px] h-[374px] bg-white rounded-lg border border-gray-200 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <button onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <FaArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">{currentMonth.format("MMMM YYYY")}</h2>
        <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <FaArrowRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-3 text-center">
            <span className="text-sm font-medium text-gray-500">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="p-2 flex-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((date) => {
              const inCurrentMonth = isCurrentMonth(date);
              const selected = isSelected(date);
              const today = isToday(date);

              return (
                <button
                  key={date.format("YYYY-MM-DD")}
                  onClick={() => onDateChange(date)}
                  className={`relative h-10 w-10 mx-auto flex items-center justify-center text-sm rounded-full transition-all duration-200
                    ${selected
                      ? "bg-teal-600 text-white font-semibold shadow-md"
                      : today && inCurrentMonth
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : inCurrentMonth
                      ? "text-gray-900 hover:bg-gray-100"
                      : "text-gray-400 hover:bg-gray-50"
                    }
                  `}
                >
                  {date.date()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Week View Component
const WeekView: React.FC<{
  selectedDate: dayjs.Dayjs;
  onDateChange: (date: dayjs.Dayjs) => void;
  weekStart: dayjs.Dayjs;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
}> = ({ selectedDate, onDateChange, weekStart, goToPrevWeek, goToNextWeek }) => {
  const weekDates = Array.from({ length: 7 }).map((_, i) => weekStart.add(i, "day"));

  return (
    <div className="w-[408px] h-[60px] flex items-center justify-between gap-2 px-2">
      <button onClick={goToPrevWeek} className="bg-[#F4F4F4] rounded-full p-2 hover:bg-gray-200 transition-colors duration-200">
        <FaArrowLeft className="text-gray-600" />
      </button>
      <div className="flex flex-grow justify-around">
        {weekDates.map((dateObj) => {
          const isSelected = dateObj.isSame(selectedDate, "day");
          const isToday = dateObj.isSame(dayjs(), "day");
          return (
            <div
              key={dateObj.format("YYYY-MM-DD")}
              className={`flex flex-col items-center px-2 py-1 rounded-md w-[48px] h-[50px] text-center flex-shrink-0 cursor-pointer transition-all duration-200
                ${isSelected
                  ? "bg-teal-700 text-white shadow-md border border-teal-700"
                  : isToday
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-transparent"
                }
              `}
              onClick={() => onDateChange(dateObj)}
            >
              <span className={`font-inter font-semibold text-[18px] leading-[26px] tracking-[0.3px] text-center align-middle ${isSelected ? "text-white" : ""}`}>
                {dateObj.date()}
              </span>
              <span className={`font-sf font-normal text-[12px] leading-[26px] tracking-[0.3px] text-center align-middle ${isSelected ? "text-white" : ""}`}>
                {dateObj.format("dd")}
              </span>
            </div>
          );
        })}
      </div>
      <button onClick={goToNextWeek} className="bg-[#F4F4F4] rounded-full p-2 hover:bg-gray-200 transition-colors duration-200">
        <FaArrowRight className="text-gray-600" />
      </button>
    </div>
  );
};

// Appointment Cards Component
const AppointmentCards: React.FC<{
  appointments: Appointment[];
  selectedDate: dayjs.Dayjs;
}> = ({ appointments, selectedDate }) => {
  const formattedSelectedDate = selectedDate.format("YYYY-MM-DD");

  const filteredAppointments = appointments.filter((appt) => {
    const appointmentDate = dayjs(appt.appointment_time).format("YYYY-MM-DD");
    return appointmentDate === formattedSelectedDate;
  });

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "finished":
        return "bg-green-500 text-white";
      case "up-coming":
        return "bg-orange-500 text-white";
      case "re-scheduled":
        return "bg-gray-800 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="w-[408px] flex flex-col gap-3 mx-auto" style={{ height: "calc(100vh - 70px - 40px - 374px - 60px)" }}>
      <div className="overflow-y-auto flex flex-col gap-3 pr-1">
        {filteredAppointments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No appointments on {selectedDate.format("dddd, MMM D")}.
          </p>
        ) : (
          filteredAppointments.map((appt, idx) => {
            const isUpcoming = dayjs(appt.appointment_time).isAfter(dayjs());
            let customStatus = appt.status;

            if (appt.status.toLowerCase() === "completed") {
              customStatus = "Finished";
            } else if (appt.status.toLowerCase() === "upcoming" || isUpcoming) {
              customStatus = "Up-Coming";
            } else if (appt.status.toLowerCase() === "rescheduled") {
              customStatus = "Re-Scheduled";
            }

            return (
              <div key={appt.appointment_id} className="w-[408px] h-[68px] flex items-center bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 flex-1">
                  <img
                    src={`https://i.pravatar.cc/40?img=${(idx % 70) + 1}`}
                    alt={appt.patient_name || "Patient"}
                    className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-sf text-[16px] text-black mb-1">{appt.patient_name?.trim() || "Vignesh Gorakala"}</p>
                    <div className="font-sf flex items-center gap-1 text-gray-600">
                      <div className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded-full">
                        <Clock className="w-3.5 h-3.5" stroke="black" fill="white" />
                      </div>
                      <span className="text-[14px]">
                        {dayjs(appt.appointment_time).format("HH:mm")} - {dayjs(appt.appointment_time).add(appt.duration || 60, "minute").format("HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div
                    className={`px-4 py-2 rounded-md text-[14px] font-medium ${getStatusStyle(customStatus)} min-w-[100px] text-center`}
                  >
                    {customStatus}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

interface Appointment {
  appointment_id: number;
  appointment_time: string;
  patient_id: number;
  patient_name: string;
  doctor_name: string;
  department: string;
  status: string;
  duration: number;
  calendar_event_id: string;
}

// DoctorAppointmentsPage Component
const DoctorAppointmentsPage: React.FC<DoctorAppointmentsPageProps> = ({ doctorName }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [weekStart, setWeekStart] = useState(dayjs().startOf("week").add(1, "day")); // Start week on Monday
  const [view, setView] = useState("week");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const doctorResponse = await axios.get(`https://medical-assistant1.onrender.com/doctors?name=${doctorName}`);
        const doctorData = doctorResponse.data.doctors;
        const doctor = doctorData.find((doc: any) => doc.name === doctorName);
        const doctorId = doctor?.id;

        if (!doctorId) {
          console.warn(`Doctor with name "${doctorName}" not found.`);
          setAppointments([]); // Clear appointments if doctor not found
          return;
        }

        const formattedDate = selectedDate.format("YYYY-MM-DD");

        const appointmentsResponse = await axios.get<{ appointments: Appointment[] }>(
          `https://medical-assistant1.onrender.com/appointments?doctor_id=${doctorId}&date=${formattedDate}`
        );
        setAppointments(appointmentsResponse.data.appointments || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setAppointments([]); // Ensure appointments are cleared on error
      }
    };

    if (doctorName) {
      fetchAppointments();
    }
  }, [doctorName, selectedDate]);

  const goToNextWeek = () => setWeekStart(weekStart.add(7, "day"));
  const goToPrevWeek = () => setWeekStart(weekStart.subtract(7, "day"));

  return (
    <div className="w-[455px] h-screen mx-auto bg-white flex flex-col">

      <div className="flex flex-col gap-[20px] px-6 py-5 flex-1">
        <AppointmentHeader view={view} setView={setView} />

        {view === "week" ? (
          <WeekView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            weekStart={weekStart}
            goToPrevWeek={goToPrevWeek}
            goToNextWeek={goToNextWeek}
          />
        ) : (
          <CustomCalendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}

        <AppointmentCards
          appointments={appointments}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
};

export default DoctorAppointmentsPage;
