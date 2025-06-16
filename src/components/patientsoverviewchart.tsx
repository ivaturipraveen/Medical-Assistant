import { PieChart, Pie, Cell, Tooltip, Label } from "recharts";

const data = [
  { name: "Adult", value: 22, color: "#00A8A3" },
  { name: "Kids (below 10 yrs)", value: 9, color: "#00C4CC" },
  { name: "Teenagers", value: 16, color: "#04707D" },
  { name: "Senior Citizens", value: 53, color: "#004848" },
];

const total = data.reduce((sum, entry) => sum + entry.value, 0);

const PatientsOverview = () => {
  return (
    <div className="w-[457px] h-[367px] p-6 bg-white rounded-[10px] shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Patients Overview</h2>
        <div className="flex gap-2">
          <select className="border border-teal-600 text-sm px-3 py-1 rounded-md text-teal-700">
            <option>Month</option>
            <option>Jan</option>
            <option>Feb</option>
            <option>Mar</option>
            <option>Apr</option>
            <option>May</option>
            <option>June</option>
            <option>July</option>
            <option>Aug</option>
            <option>Sep</option>
            <option>Oct</option>
            <option>Nov</option>
            <option>Dec</option>
          </select>
          <select className="border border-teal-600 text-sm px-3 py-1 rounded-md text-teal-700">
            <option>Date</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart and Legend */}
      <div className="flex items-center gap-8">
        <PieChart width={200} height={200}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            <Label
              content={({ viewBox }: { viewBox?: any }) => {
                const { cx, cy } = viewBox;
                return (
                  <text
                    x={cx}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fill: "#1f2937", fontSize: 14 }}
                  >
                    <tspan
                      x={cx}
                      dy="-0.5em"
                      fontSize="14"
                      fill="#6B7280"
                      fontWeight="bold"
                    >
                      Total Patients
                    </tspan>
                    <tspan x={cx} dy="1.3em" fontSize="18" fontWeight="bold">
                      {total}
                    </tspan>
                  </text>
                );
              }}
            />
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "10px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
            labelStyle={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#374151",
            }}
            itemStyle={{
              fontSize: "13px",
              color: "#111827",
              marginBottom: "4px",
            }}
          />
        </PieChart>

        {/* Legend */}
        <div className="flex flex-col gap-2 text-sm text-gray-700">
          {data.map((entry, index) => (
            <div className="flex items-center gap-2" key={index}>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientsOverview;
