import { FaRegHeart } from 'react-icons/fa';

type StatusType = 'Pending' | 'Approved' | 'Rejected';

interface Patient {
  name: string;
  dob: string;
  contact: string;
  dept: string;
  status: StatusType;
}

const patients: Patient[] = [
  { name: 'Adhitya Sarkar', dob: '2005-08-14', contact: '+91 9900000000', dept: 'Cardiology', status: 'Pending' },
  { name: 'Adhitya Sarkar', dob: '2005-08-14', contact: '+91 9900000000', dept: 'Cardiology', status: 'Pending' },
  { name: 'Adhitya Sarkar', dob: '2005-08-14', contact: '+91 9900000000', dept: 'Cardiology', status: 'Approved' },
  { name: 'Adhitya Sarkar', dob: '2005-08-14', contact: '+91 9900000000', dept: 'Cardiology', status: 'Rejected' },
  { name: 'Adhitya Sarkar', dob: '2005-08-14', contact: '+91 9900000000', dept: 'Cardiology', status: 'Pending' },
];

const statusStyles: Record<StatusType, string> = {
  Pending: 'text-orange-500 border-orange-500',
  Approved: 'text-green-600 border-green-500',
  Rejected: 'text-red-600 border-red-500',
};

export default function NewPatientsTable() {
  return (
    <div className="mt-5 w-[692px] h-[404px] bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 text-[#0D1A12]">
          <img
            src="/Vector - 0.svg"
            alt="Add User"
            className="w-[20px] h-[20px] object-contain"
          />
          <h2 className="custom-header">New Patients</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-gray-100 text-gray-700 font-medium">
              <tr>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">DOB</th>
                <th className="px-4 py-2">Contact</th>
                <th className="px-4 py-2">Department</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="custom-patient-name">{patient.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="custom-dob">{patient.dob}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="custom-number">{patient.contact}</span>
                  </td>
                  <td className="px-4 py-3 text-teal-600 flex items-center gap-1 whitespace-nowrap">
                    <FaRegHeart className="text-teal-600" /> {patient.dept}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`border rounded-full px-3 py-1 text-xs font-medium ${statusStyles[patient.status]}`}
                    >
                      {patient.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
