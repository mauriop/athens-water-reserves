import React from "react";
import { format } from "date-fns";

const StatsGrid = ({ latestStats, reservoirs }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {latestStats &&
        reservoirs.map((res) => (
          <div
            key={res.key}
            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: res.color }}
              ></div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                {res.label}
              </span>
            </div>
            <div className="text-xl font-bold text-slate-800">
              {latestStats[res.key]?.toLocaleString()}{" "}
              <span className="text-xs text-slate-400 font-normal">m³</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Latest Reading (
              {format(new Date(latestStats.timestamp), "EEE, MMM d, yyyy")})
            </div>
          </div>
        ))}
    </div>
  );
};

export default StatsGrid;
