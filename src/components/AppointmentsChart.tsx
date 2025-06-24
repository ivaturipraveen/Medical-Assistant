import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { scheduled: 240, completed: 200, day: 'Mon' },
  { scheduled: 300, completed: 250, day: 'Tue' },
  { scheduled: 200, completed: 170, day: 'Wed' },
  { scheduled: 278, completed: 230, day: 'Thu' },
  { scheduled: 189, completed: 150, day: 'Fri' },
  { scheduled: 239, completed: 210, day: 'Sat' },
  { scheduled: 349, completed: 300, day: 'Sun' },
];

const latest = [...data].reverse().find(d => d.scheduled !== null);

const AppointmentTrendsContainer = () => {
  return (
    <div className="w-[457px] p-6 bg-white rounded-[10px] h-[367px]">
      {/* Header */}
      <div className="flex items-center justify-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Appointment Trends</h2>
      </div>
      {/* Chart */}
      <div className="pt-4" style={{ height: '227px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#CBD5E1"
              tick={{ fontSize: 11, fill: '#64748B' }}
              style={{ marginBottom: '20px' }}  // Add margin bottom to create space
            />
            <YAxis
              stroke="#CBD5E1"
              tick={{ fontSize: 11, fill: '#64748B' }}
              label={{
                value: 'Patients',
                angle: -90,
                position: 'insideLeft',
                style: {
                  textAnchor: 'middle',
                  fontSize: 12,
                  fill: '#64748B',
                },
              }}
              style={{ marginBottom: '20px' }}  // Add margin bottom to create space
            />
            <Tooltip />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', marginTop: 16 }}
            />
            <ReferenceLine
              y={400}
              stroke="#A855F7"
              strokeDasharray="6 6"
              label={{
                value: 'Target',
                position: 'top',
                fill: '#A855F7',
                fontSize: 11,
                offset: 10,
              }}
            />
            {latest && (
              <ReferenceDot
                x={latest.day}
                y={latest.scheduled}
                r={6}
                fill="#14B8A6"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            )}
            <Line
              type="linear"
              dataKey="scheduled"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={false}
              name="Scheduled"
              style={{ marginBottom: '5px' }}  // Adds gap between the lines
            />
            <Line
              type="linear"
              dataKey="completed"
              stroke="#0F766E"
              strokeWidth={2}
              dot={false}
              name="Completed"
              style={{ marginBottom: '5px' }}  // Adds gap between the lines
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AppointmentTrendsContainer;
