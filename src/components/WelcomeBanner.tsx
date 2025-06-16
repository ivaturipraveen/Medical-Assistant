
const WelcomeBanner = () => {
  return (
    <div
      className="flex items-center justify-between bg-white rounded-[10px] px-4 py-[6px] shadow-sm"
      style={{ width: '1400px', height: '52px' }}
    >
      <span className="text-lg font-semibold text-gray-800">
        Welcome Back! <span className="text-blue-600">John Doe</span>
      </span>
      <span className="text-sm text-gray-500">
        Last Logged-in: 12-06-2025 12:05:11
      </span>
    </div>
  );
};

export default WelcomeBanner;
