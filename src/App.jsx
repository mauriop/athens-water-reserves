import React, { useState, useEffect, useMemo } from "react";
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
import {
  Droplets,
  BarChart3,
  AlertCircle,
  Loader2,
  RefreshCw,
  History,
} from "lucide-react";

const API_BASE = "https://opendata-api-eydap.growthfund.gr/api/Savings";

const App = () => {
  // --- State ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Configuration State
  const [yearsBack, setYearsBack] = useState(1); // Default to 1 year back

  // Visibility State
  const [visibleReservoirs, setVisibleReservoirs] = useState({
    Mornos: true,
    Eyinos: true,
    Yliko: true,
    Marathonas: true,
  });

  const reservoirs = [
    { key: "Mornos", color: "#3b82f6", label: "Mornos" },
    { key: "Eyinos", color: "#10b981", label: "Evinos" },
    { key: "Yliko", color: "#f59e0b", label: "Yliki" },
    { key: "Marathonas", color: "#ef4444", label: "Marathonas" },
  ];

  // --- Helpers ---

  const formatDateForApi = (dateObj) => {
    const d = String(dateObj.getDate()).padStart(2, "0");
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const y = dateObj.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const toggleReservoir = (key) => {
    setVisibleReservoirs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Improved helper to find float values safely from multiple keys
  const getVal = (item, keys) => {
    for (let k of keys) {
      if (item[k] !== undefined && item[k] !== null && item[k] !== "") {
        const val = parseFloat(item[k]);
        if (!isNaN(val)) return val;
      }
    }
    return 0;
  };

  // --- Data Fetching Logic ---

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setData([]);

    try {
      // Anchor to Today to ensure we get the latest available data
      const endObj = new Date();

      const allResults = [];
      const totalRequests = yearsBack;

      // Loop backwards from 0 to yearsBack - 1
      for (let i = 0; i < yearsBack; i++) {
        // Calculate the specific end date for this year offset
        const currentAnchorDate = new Date(endObj);
        currentAnchorDate.setFullYear(endObj.getFullYear() - i);

        const apiDateString = formatDateForApi(currentAnchorDate);
        const url = `${API_BASE}/Year/${apiDateString}`;

        try {
          const response = await fetch(url);
          if (response.ok) {
            const json = await response.json();
            const yearData = Array.isArray(json) ? json : [json];
            allResults.push(...yearData);
          }
        } catch (err) {
          console.warn(`Failed to fetch data for year offset ${i}`, err);
        }

        setProgress(Math.round(((i + 1) / totalRequests) * 100));
        await new Promise((r) => setTimeout(r, 100)); // Rate limiting
      }

      // --- Data Processing ---

      // 1. Parse and Standardize
      const parsedData = allResults
        .map((item) => {
          let dateObj;
          const dateStr = item.date || item.Date;

          if (!dateStr) return null;

          const normalizedDateStr = dateStr.replace(/\//g, "-");
          const parts = normalizedDateStr.split("-");

          if (parts.length === 3) {
            if (parts[0].length === 4) {
              // YYYY-MM-DD
              dateObj = new Date(normalizedDateStr);
            } else {
              // DD-MM-YYYY
              dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            }
          }

          if (!dateObj || isNaN(dateObj.getTime())) return null;

          return {
            ...item,
            timestamp: dateObj.getTime(),
            // Robustly check multiple keys
            Mornos: getVal(item, ["Mornos", "mornos"]),
            Eyinos: getVal(item, ["Eyinos", "eyinos", "Evinos", "evinos"]),
            Yliko: getVal(item, ["Yliko", "yliko", "Yliki", "yliki"]),
            Marathonas: getVal(item, [
              "Marathonas",
              "marathonas",
              "Marathon",
              "marathon",
            ]),
          };
        })
        .filter(Boolean);

      // 2. Sort Chronologically
      parsedData.sort((a, b) => a.timestamp - b.timestamp);

      // 3. Forward Fill Strategy (Fix for 0 values)
      // We iterate through the daily data. If a specific reservoir has a 0 value
      // (missing data), we use the last known valid value from previous days.
      let lastKnown = {
        Mornos: 0,
        Eyinos: 0,
        Yliko: 0,
        Marathonas: 0,
      };

      const filledData = parsedData.map((item) => {
        // Update lastKnown if current item has valid data > 0
        if (item.Mornos > 0) lastKnown.Mornos = item.Mornos;
        if (item.Eyinos > 0) lastKnown.Eyinos = item.Eyinos;
        if (item.Yliko > 0) lastKnown.Yliko = item.Yliko;
        if (item.Marathonas > 0) lastKnown.Marathonas = item.Marathonas;

        // Return a new item using the best available data
        return {
          ...item,
          Mornos: item.Mornos > 0 ? item.Mornos : lastKnown.Mornos,
          Eyinos: item.Eyinos > 0 ? item.Eyinos : lastKnown.Eyinos,
          Yliko: item.Yliko > 0 ? item.Yliko : lastKnown.Yliko,
          Marathonas:
            item.Marathonas > 0 ? item.Marathonas : lastKnown.Marathonas,
        };
      });

      // 4. Filter for Weekly Data (using the cleaned, filled data)
      // Strategy: Select data points that fall on a Friday.
      // Always include the last available data point to show current status.
      const weeklyData = filledData.filter((item, index) => {
        const d = new Date(item.timestamp);
        const isFriday = d.getDay() === 5; // 5 = Friday
        const isLastItem = index === filledData.length - 1;
        return isFriday || isLastItem;
      });

      // Deduplicate in case the last item is also a Friday
      const uniqueWeeklyData = [
        ...new Map(weeklyData.map((item) => [item.timestamp, item])).values(),
      ];

      // 5. Prepare Final Data
      const finalData = uniqueWeeklyData.map((item) => {
        const mVal = item.Mornos;
        const eVal = item.Eyinos;
        const yVal = item.Yliko;
        const maVal = item.Marathonas;

        return {
          timestamp: item.timestamp,
          Mornos: mVal,
          Eyinos: eVal,
          Yliko: yVal,
          Marathonas: maVal,
          // Total for tooltip
          total: mVal + eVal + yVal + maVal,
        };
      });

      if (finalData.length === 0) {
        setError("No data returned from API. Please try again later.");
      } else {
        setData(finalData);
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred while processing data.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when yearsBack changes
  useEffect(() => {
    fetchData();
  }, [yearsBack]);

  // --- Render Helpers ---

  const latestStats = useMemo(() => {
    if (!data.length) return null;
    return data[data.length - 1];
  }, [data]);

  const getDateRangeLabel = () => {
    if (!data.length) return "";
    const start = new Date(data[0].timestamp).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    const end = new Date(data[data.length - 1].timestamp).toLocaleDateString(
      "en-US",
      { month: "short", year: "numeric" },
    );
    return `${start} - ${end}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8 space-y-6">
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
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Configuration Panel */}
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
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Chart Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Water Reserves Timeline
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Weekly records: {getDateRangeLabel()}
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
                      new Date(unixTime).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
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
                      new Date(unixTime).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
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

        {/* Current Stats Summary */}
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
                  {new Date(latestStats.timestamp).toLocaleDateString()})
                </div>
              </div>
            ))}
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 pt-6 border-t border-slate-200 text-slate-400 text-xs text-center">
        <p>© 2026 Athens Water Dashboard • Data Source: EYDAP Open Data</p>
      </footer>
    </div>
  );
};

export default App;
