const WelcomeBanner = () => {
  return (
    // Removed the explicit `width: '1400px'` inline style.
    // The `w-full` from the parent in dashboard.tsx will now correctly define its width,
    // and `px-4` padding will be applied within that full width.
    <div
      className="flex items-center justify-between bg-white rounded-[10px] px-4 py-[6px] shadow-sm w-full"
      style={{ height: '52px' }} // Only keep the height, as width is now handled by w-full
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
