
// Import SVGs
import EndoIcon from '../assets/endo.svg';
import OrthoIcon from '../assets/ortho.svg';
import CardioIcon from '../assets/cardio.svg';

const specializations = [
  {
    icon: EndoIcon,
    title: 'Endocrinology',
    count: '207 Doctors',
  },
  {
    icon: OrthoIcon,
    title: 'Orthopedic',
    count: '586 Doctors',
  },
  {
    icon: CardioIcon,
    title: 'Cardiologist',
    count: '652 Doctors',
  },
  {
    icon: EndoIcon,
    title: 'Endocrinology',
    count: '207 Doctors',
  },
  {
    icon: OrthoIcon,
    title: 'Orthopedic',
    count: '586 Doctors',
  },
];

const Specializations = () => {
  return (
    <div className="w-[930px] h-[209px] p-6 rounded-[10px] bg-white flex flex-col justify-between shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start w-full">
        <h2 className="h-[40px] text-lg font-semibold text-gray-900">
          Latest Updates On Specializations
        </h2>
        <button className="text-emerald-800 border border-emerald-800 w-[82px] h-[40px] pt-[9px] pr-[16px] pb-[12px] pl-[16px] rounded-[4px] text-sm hover:bg-emerald-50 transition mt-[-4px]">
          View all
        </button>
      </div>

      {/* Specialization Cards */}
      <div className="flex gap-4 mt-4 overflow-x-auto">
        {specializations.map((item, index) => (
          <div
            key={index}
            className="flex flex-col justify-between w-[158px] h-[104px] border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition"
          >
            <img src={item.icon} alt={item.title} className="w-6 h-6 mb-1" />
            <div className="font-semibold text-gray-900 text-sm">
              {item.title}
            </div>
            <div className="text-xs text-gray-600">{item.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Specializations;
