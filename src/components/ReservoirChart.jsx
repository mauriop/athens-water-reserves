import React from "react";
import { format } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { BarChart3, Loader2 } from "lucide-react";

const ReservoirChart = ({
  data,
  loading,
  visibleReservoirs,
  toggleReservoir,
  reservoirs,
  dateRangeLabel,
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Water Reserves Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Weekly records: {dateRangeLabel}
          </p>
        </div>

        {/* Reservoir Toggles within Chart Header */}
        <div className="flex flex-wrap gap-2">
          {reservoirs.map((res) => (
            <button
              key={res.key}
              onClick={() => toggleReservoir(res.key)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                visibleReservoirs[res.key]
                  ? "bg-slate-50 border-slate-200 text-slate-700"
                  : "bg-slate-50 border-slate-100 text-slate-300 line-through decoration-slate-300"
              }`}
              style={{
                color: visibleReservoirs[res.key] ? res.color : undefined,
                borderColor: visibleReservoirs[res.key]
                  ? res.color
                  : undefined,
              }}
            >
              {res.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow w-full h-[400px]">
        {loading && data.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="font-medium text-slate-500">
              Retrieving historical data...
            </p>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                {reservoirs.map((res) => (
                  <linearGradient
                    key={`grad-${res.key}`}
                    id={`color${res.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={res.color}
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor={res.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={["dataMin", "dataMax"]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                dy={10}
                minTickGap={40}
                tickFormatter={(unixTime) =>
                  format(new Date(unixTime), "MMM yyyy")
                }
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(value) => value.toLocaleString()}
                width={80}
                label={{
                  value: "m³",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#94a3b8",
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                }}
                labelFormatter={(unixTime) =>
                  format(new Date(unixTime), "EEE, MMM d, yyyy")
                }
                formatter={(value, name) => [
                  value.toLocaleString() + " m³",
                  name,
                ]}
                labelStyle={{ color: "#64748b", marginBottom: "0.5rem" }}
              />
              <Legend iconType="circle" />
              {reservoirs.map((res) => (
                <Area
                  key={res.key}
                  hide={!visibleReservoirs[res.key]}
                  type="monotone"
                  dataKey={res.key}
                  name={res.label}
                  stroke={res.color}
                  fillOpacity={1}
                  fill={`url(#color${res.key})`}
                  strokeWidth={2}
                  connectNulls={true}
                  animationDuration={800}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
            {!loading && "No data available."}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservoirChart;
