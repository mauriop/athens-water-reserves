import React, { useState, useEffect, useMemo } from "react";
import { format, subYears } from "date-fns";
import { fetchReservoirData } from "./api";
import Header from "./components/Header";
import DateRangeSelector from "./components/DateRangeSelector";
import ErrorMessage from "./components/ErrorMessage";
import ReservoirChart from "./components/ReservoirChart";
import StatsGrid from "./components/StatsGrid";
import Footer from "./components/Footer";

const MAX_YEARS = 10;

const App = () => {
  // --- State ---
  const [allData, setAllData] = useState([]); // Store full 10-year history
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Configuration State
  const [yearsBack, setYearsBack] = useState(10); // Default to 1 year back

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

  const toggleReservoir = (key) => {
    setVisibleReservoirs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- Data Fetching Logic ---
  const fetchData = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    // Do not clear allData immediately to avoid flash if just refreshing
    if (forceRefresh) setAllData([]);

    try {
      // Always fetch maximum history
      const finalData = await fetchReservoirData(
        MAX_YEARS,
        setProgress,
        forceRefresh
      );
      setAllData(finalData);
    } catch (e) {
      console.error(e);
      setError(
        e.message || "An unexpected error occurred while processing data."
      );
    } finally {
      setLoading(false);
    }
  };

  // Trigger initial fetch only on mount
  useEffect(() => {
    console.log("before fetchData, yearsBack", yearsBack);
    fetchData();
  }, [yearsBack]);

  // --- Derived Data for Display ---
  const displayedData = useMemo(() => {
    if (!allData.length) return [];

    // Filter data based on selected yearsBack
    const cutoffDate = subYears(new Date(), yearsBack);
    return allData.filter((item) => new Date(item.timestamp) >= cutoffDate);
  }, [allData, yearsBack]);

  // --- Render Helpers ---

  const latestStats = useMemo(() => {
    if (!allData.length) return null;
    return allData[allData.length - 1];
  }, [allData]);

  const getDateRangeLabel = () => {
    if (!displayedData.length) return "";
    const start = format(new Date(displayedData[0].timestamp), "MMM yyyy");
    const end = format(
      new Date(displayedData[displayedData.length - 1].timestamp),
      "MMM yyyy"
    );
    return `${start} - ${end}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8 space-y-6">
        <Header
          loading={loading}
          progress={progress}
          onRefresh={() => fetchData(true)}
        />
        <DateRangeSelector yearsBack={yearsBack} setYearsBack={setYearsBack} />
      </header>

      <main className="max-w-6xl mx-auto space-y-6">
        <ErrorMessage error={error} />

        <ReservoirChart
          data={displayedData}
          loading={loading && !allData.length}
          visibleReservoirs={visibleReservoirs}
          toggleReservoir={toggleReservoir}
          reservoirs={reservoirs}
          dateRangeLabel={getDateRangeLabel()}
        />

        <StatsGrid latestStats={latestStats} reservoirs={reservoirs} />
      </main>

      <Footer />
    </div>
  );
};

export default App;
