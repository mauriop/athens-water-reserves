import { format, subYears, parse, isValid, isFriday } from "date-fns";

const API_BASE = "https://opendata-api-eydap.growthfund.gr/api/Savings";

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

// In-memory cache to store results by yearsBack
// In-memory cache to store results by yearsBack
const CACHE = new Map();

export const fetchReservoirData = async (
  yearsBack,
  onProgress,
  forceRefresh = false
) => {
  // Return cached data if available and not forced to refresh
  if (!forceRefresh && CACHE.has(yearsBack)) {
    if (onProgress) onProgress(100);
    return CACHE.get(yearsBack);
  }

  // Anchor to Today to ensure we get the latest available data
  const endObj = new Date();

  const allResults = [];
  const totalRequests = yearsBack;

  // Create an array of promises for concurrent fetching
  let completedRequests = 0;
  const fetchPromises = Array.from({ length: yearsBack }, async (_, i) => {
    // Determine the anchor date for this year offset using date-fns
    const currentAnchorDate = subYears(endObj, i);

    // Format for API: DD-MM-YYYY
    const apiDateString = format(currentAnchorDate, "dd-MM-yyyy");
    const url = `${API_BASE}/Year/${apiDateString}`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        return Array.isArray(json) ? json : [json];
      }
    } catch (err) {
      console.warn(`Failed to fetch data for year offset ${i}`, err);
    } finally {
      completedRequests++;
      if (onProgress) {
        onProgress(Math.round((completedRequests / totalRequests) * 100));
      }
    }
    return [];
  });

  const results = await Promise.all(fetchPromises);
  results.forEach((yearData) => allResults.push(...yearData));

  // --- Data Processing ---

  // 1. Parse and Standardize
  const parsedData = allResults
    .map((item) => {
      let dateObj;
      const dateStr = item.date || item.Date;

      if (!dateStr) return null;

      // Handle both / and - separators
      const normalizedDateStr = dateStr.replace(/\//g, "-");
      
      // Try parsing typical formats
      // 1. YYYY-MM-DD
      dateObj = parse(normalizedDateStr, "yyyy-MM-dd", new Date());
      
      if (!isValid(dateObj)) {
         // 2. DD-MM-YYYY
         dateObj = parse(normalizedDateStr, "dd-MM-yyyy", new Date());
      }
      
      if (!isValid(dateObj)) return null;

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
      Marathonas: item.Marathonas > 0 ? item.Marathonas : lastKnown.Marathonas,
    };
  });

  // 4. Filter for Weekly Data (using the cleaned, filled data)
  // Strategy: Select data points that fall on a Friday.
  // Always include the last available data point to show current status.
  const weeklyData = filledData.filter((item, index) => {
    const d = new Date(item.timestamp);
    // Use date-fns isFriday
    const friday = isFriday(d);
    const isLastItem = index === filledData.length - 1;
    return friday || isLastItem;
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
    throw new Error("No data returned from API. Please try again later.");
  }
  
  // Store in cache
  CACHE.set(yearsBack, finalData);

  return finalData;
};
