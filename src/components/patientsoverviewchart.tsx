import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import axios from "axios";

const COLORS = ["#00C4CC", "#04707D", "#00A8A3", "#004848"];

const PatientsOverview = () => {
  const [chartData, setChartData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    axios
      .get<{ data: { ageGroup: string; count: number }[] }>(
        "https://medical-assistant1.onrender.com/dashboard/age-distribution"
      )
      .then((res) => {
        const apiData = res.data.data;
        const coloredData = apiData.map((item, index) => ({
          name: formatLabel(item.ageGroup),
          value: item.count,
          color: COLORS[index % COLORS.length],
        }));
        setChartData(coloredData);
      })
      .catch((err: unknown) =>
        console.error('Failed to fetch age distribution data:', err)
      );
  }, []);

  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);

  const formatLabel = (ageGroup: string) => {
    switch (ageGroup) {
      case "0-10":
        return "Kids (below 10 yrs)";
      case "11-17":
        return "Teenagers";
      case "18-35":
        return "Adult";
      case "35-50":
        return "Middle Aged";
      case "50+":
        return "Senior Citizens";
      default:
        return ageGroup;
    }
  };

  return (
    <div className=" max-w-[457px] h-[345px] bg-white rounded-[10px]  p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 w-full h-[40px]">
        <h2 className="text-lg font-semibold text-gray-900">Patients Overview</h2>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <select className="border border-teal-600 text-sm px-3 py-1 rounded-md text-teal-700">
            <option>Month</option>
            {["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => (
              <option key={month}>{month}</option>
            ))}
          </select>
          <select className="border border-teal-600 text-sm px-3 py-1 rounded-md text-teal-700">
            <option>Date</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      <div
        className="flex flex-col md:flex-row md:items-center md:justify-between w-full"
        style={{
           gap: "58px",
          paddingTop: "16.02px",
          paddingBottom: "16.02px",
        }}
      >
        {/* Pie Chart */}
        <div className="flex justify-center">
          <PieChart width={200} height={225.24}>
            <Pie
              data={chartData}
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
                      <tspan x={cx} dy="-0.5em" fill="#6B7280" fontWeight="bold">
                        Total Patients
                      </tspan>
                      <tspan x={cx} dy="1.3em" fontSize="18" fontWeight="bold">
                        {total}
                      </tspan>
                    </text>
                  );
                }}
              />
              {chartData.map((entry, index) => (
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
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 text-sm text-gray-700 mt-4 md:mt-0">
          {chartData.map((entry, index) => (
            <div className="flex items-center gap-2" key={index}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientsOverview;
