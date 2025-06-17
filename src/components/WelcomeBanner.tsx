const WelcomeBanner = () => {
  return (
    <div
      className="mt-1 flex items-center font-geist justify-between bg-white rounded-[10px] px-4 py-[6px]  w-full h-[52px]"
    > 
      <span className="text-lg font-regular text-gray-800">
        Welcome Back! <span className="text-black-600 font-bold">John Doe</span>
      </span>
      <span className="text-sm font-sf text-gray-500">
        Last Logged-in: 17-06-2025 05:40:11
      </span>
    </div>
  );
};

export default WelcomeBanner;
