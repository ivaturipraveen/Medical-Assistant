import { useEffect, useState } from "react";

const WelcomeBanner = () => {
  const [previousLogin, setPreviousLogin] = useState<string>("Not available");
  const [welcomeName, setWelcomeName] = useState<string>("User");

  useEffect(() => {
    // 1. Retrieve previous login timestamp
    const storedPreviousLogin = localStorage.getItem("previousLogin");
    setPreviousLogin(storedPreviousLogin || "Not available");

    // Get user role and details
    const role = localStorage.getItem("userRole");
    const email = localStorage.getItem("userEmail");
    const fullName = localStorage.getItem("userName");

    if (role === "admin") {
      setWelcomeName("Admin");
    } else if (role === "doctor") {
      if (fullName && fullName.trim()) {
        setWelcomeName(fullName);
      } else if (email) {
        const namePart = email.split("@")[0];
        setWelcomeName(capitalizeName(namePart));
      } else {
        setWelcomeName("Doctor");
      }
    } else {
      setWelcomeName("User");
    }
  }, []);

  const capitalizeName = (name: string) => {
    return name
      .split(/[.\-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  return (
    <div className="mt-1 flex items-center font-geist justify-between bg-white rounded-[10px] px-4 py-[6px] w-full h-[52px]">
      <span className="text-lg font-regular text-gray-800">
        Welcome Back,{" "}
        <span className="text-black-600 font-bold">{welcomeName}</span>
      </span>
      <div className="text-sm font-sf text-gray-700">
        <div>Last logged-in: {previousLogin}</div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
