import { useEffect, useState, useRef } from "react";
import { FaClock, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import axios from "axios";
import dayjs from "dayjs";

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

const AppointmentsCard = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [weekStart, setWeekStart] = useState(dayjs().startOf("week").add(1, "day")); // Monday
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios
      .get<{ appointments: Appointment[] }>("https://medical-assistant1.onrender.com/appointments")
      .then((res) => setAppointments(res.data.appointments))
      .catch((err) => console.error("Failed to fetch appointments:", err));
  }, []);

  const weekDates = Array.from({ length: 7 }).map((_, i) => weekStart.add(i, "day"));

  const filteredAppointments = appointments.filter(
    (appt) =>
      dayjs(appt.appointment_time).format("YYYY-MM-DD") ===
      selectedDate.format("YYYY-MM-DD")
  );

  const goToNextWeek = () => setWeekStart(weekStart.add(7, "day"));
  const goToPrevWeek = () => setWeekStart(weekStart.subtract(7, "day"));

  const isWeekend = (date: dayjs.Dayjs) => {
    const day = date.day();
    return day === 0 || day === 6;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModal]);

  return (
    <>
      <div className="bg-white rounded-[10px] p-4 sm:p-6 flex flex-col gap-6 w-full max-w-md sm:max-w-lg md:max-w-[455px] h-[600px]">
        {/* Header */}
        <div className="flex justify-between items-center w-full">
          <h2 className="text-base sm:text-lg font-semibold text-[#0D1A12]">Appointments</h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-teal-700 text-xs sm:text-sm border border-teal-700 hover:bg-teal-50 transition rounded px-3 py-1 sm:px-4 sm:py-2"
          >
            View all
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-[2px] w-full">
          <button onClick={goToPrevWeek} className="bg-[#F4F4F4] rounded-full p-2">
            <FaArrowLeft />
          </button>

          <div className="flex items-center gap-[1px] text-slate-800 overflow-x-auto">
            {weekDates.map((dateObj) => {
              const isSelected = dateObj.isSame(selectedDate, "day");
              const isDisabled = isWeekend(dateObj);

              return (
                <div
                  key={dateObj.format("YYYY-MM-DD")}
                  className={`flex flex-col items-center px-2 py-1 rounded-md w-[48px] h-[50px] text-center ${
                    isSelected ? "bg-[#F4F4F4] border border-teal-700" : ""
                  } ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer hover:bg-slate-100"
                  }`}
                  onClick={() => {
                    if (!isDisabled) setSelectedDate(dateObj);
                  }}
                >
                  <span className="text-sm font-semibold">{dateObj.date()}</span>
                  <span className="text-xs font-semibold">{dateObj.format("dd")}</span>
                </div>
              );
            })}
          </div>

          <button onClick={goToNextWeek} className="bg-[#F4F4F4] rounded-full p-2">
            <FaArrowRight />
          </button>
        </div>

        {/* Appointments List */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1 w-full">
          {filteredAppointments.length === 0 ? (
            <p className="text-sm text-gray-500">
              No appointments on {selectedDate.format("dddd, MMM D")}.
            </p>
          ) : (
            filteredAppointments.map((appt, idx) => (
              <div
                key={appt.appointment_id}
                className="flex justify-between items-center border rounded-md overflow-hidden"
              >
                <div className="flex items-center gap-3 px-3 py-2">
                  <img
                    src={`https://i.pravatar.cc/60?img=${(idx % 70) + 1}`}
                    alt={appt.patient_name || "Unnamed"}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold text-sm">
                      {appt.patient_name?.trim() || "Unnamed Patient"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FaClock className="text-sm" />
                      <span>{dayjs(appt.appointment_time).format("hh:mm A")}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-teal-700 text-white px-4 py-3 flex flex-col items-start justify-center w-[150px]">
                  <p className="text-sm font-semibold">{appt.doctor_name}</p>
                  <p className="text-xs">{appt.department}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div
            ref={modalRef}
            className="bg-white p-4 sm:p-6 rounded-lg max-h-[80vh] w-full max-w-[480px] overflow-y-auto scrollbar-hide relative shadow-lg"
          >
            <button
              className="absolute top-2 right-3 text-gray-600 hover:text-red-500 text-xl"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            <h3 className="text-lg font-semibold mb-4 text-left">All Appointments</h3>
            {[...appointments]
              .sort((a, b) => {
                const isAEmpty = !a.patient_name?.trim();
                const isBEmpty = !b.patient_name?.trim();
                return isAEmpty === isBEmpty ? 0 : isAEmpty ? 1 : -1;
              })
              .map((appt, idx) => (
                <div
                  key={appt.appointment_id}
                  className="flex justify-between items-center border rounded-md mb-3 overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-2 py-2 w-full">
                    <img
                      src={`https://i.pravatar.cc/60?img=${(idx % 70) + 1}`}
                      alt={appt.patient_name || "Unnamed"}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="text-left">
                      <p className="font-semibold text-sm">
                        {appt.patient_name?.trim() || "Unnamed Patient"}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FaClock className="text-sm" />
                        <span>
                          {dayjs(appt.appointment_time).format(
                            "dddd, MMM D - hh:mm A"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-teal-700 text-white px-4 py-3 flex flex-col items-start justify-center w-[210px]">
                    <p className="text-sm font-semibold">{appt.doctor_name}</p>
                    <p className="text-xs">{appt.department}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentsCard;
