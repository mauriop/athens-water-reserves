import React from "react";
import { History } from "lucide-react";

const DateRangeSelector = ({ yearsBack, setYearsBack }) => {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Years Back Selector */}
        <div className="space-y-2 flex-grow w-full">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <History className="w-3 h-3" /> Select Historical Depth
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[1, 2, 3, 5, 10].map((y) => (
              <button
                key={y}
                onClick={() => setYearsBack(y)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex-1 md:flex-none ${
                  yearsBack === y
                    ? "bg-blue-600 text-white shadow-blue-200"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {y} Year{y > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector;
