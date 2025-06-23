import { useEffect, useState } from "react";

// WelcomeBanner Component
const WelcomeBanner = () => {
  const [previousLogin, setPreviousLogin] = useState<string>("");

  useEffect(() => {
    // Retrieve the previous login timestamp from localStorage
    const storedPreviousLogin = localStorage.getItem("previousLogin");

    // If there's no previous login in localStorage, set a default message
    if (storedPreviousLogin) {
      setPreviousLogin(storedPreviousLogin);
    } else {
      setPreviousLogin("Not available"); // or set any default message you prefer
    }
  }, []);

  return (
    <div className="mt-1 flex items-center font-geist justify-between bg-white rounded-[10px] px-4 py-[6px] w-full h-[52px]">
      <span className="text-lg font-regular text-gray-800">
        Welcome Back! <span className="text-black-600 font-bold">Admin</span>
      </span>
      <div className="text-sm font-sf text-gray-700">
        <div>Last logged-in: {previousLogin}</div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
