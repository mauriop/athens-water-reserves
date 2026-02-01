import React from "react";
import { Droplets, RefreshCw } from "lucide-react";

const Header = ({ loading, progress, onRefresh }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 text-blue-700">
          <Droplets className="w-8 h-8" />
          Athens Water Reserves
        </h1>
        <p className="text-slate-500 mt-1">Weekly Reservoir Levels</p>
      </div>

      <div className="flex items-center gap-2">
        {loading && (
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse">
            Fetching Data: {progress}%
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
};

export default Header;
