import React from 'react';

const Feedback: React.FC = () => {
  return (
    <div className="flex gap-2 p-4 bg-white shadow-sm w-full max-w-[1400px]">
      {/* Card 1 */}
      <div className="flex items-center justify-between w-[456px] h-[48px] min-w-[158px] gap-2 px-4 py-2 rounded-[10px] bg-gray-100">
        <span className="font-medium">Card 1</span>
      </div>

      {/* Card 2 */}
      <div className="flex items-center justify-between w-[456px] h-[48px] min-w-[158px] gap-2 px-4 py-2 rounded-[10px] bg-gray-100">
        <span className="font-medium">Card 2</span>
      </div>

      {/* Card 3 */}
      <div className="flex items-center justify-between w-[456px] h-[48px] min-w-[158px] gap-2 px-4 py-2 rounded-[10px] bg-gray-100">
        <span className="font-medium">Card 3</span>
      </div>
    </div>
  );
};

export default Feedback;
