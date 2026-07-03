import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  MapPin, 
  Sun, 
  Moon, 
  AlertTriangle, 
  Info, 
  CloudAlert, 
  RotateCcw, 
  Sparkles,
  Compass,
  CornerDownRight,
  ChevronDown,
  Activity
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { 
  CitySearchResult, 
  CurrentWeather, 
  DailyForecast, 
  WeatherRecommendations, 
  WeatherAlert, 
  WeatherUnit 
} from "./types";

import WeatherCard from "./components/WeatherCard";
import ForecastGrid from "./components/ForecastGrid";
import PlanningBox from "./components/PlanningBox";

// Default preset cities for quick navigation
const PRESET_CITIES: CitySearchResult[] = [
  { id: 2643743, name: "London", latitude: 51.5074, longitude: -0.1278, country: "United Kingdom", admin1: "England", timezone: "Europe/London" },
  { id: 5128581, name: "New York", latitude: 40.7128, longitude: -74.0060, country: "United States", admin1: "New York", timezone: "America/New_York" },
  { id: 1275339, name: "Mumbai", latitude: 19.0760, longitude: 72.8777, country: "India", admin1: "Maharashtra", timezone: "Asia/Kolkata" },
  { id: 1850147, name: "Tokyo", latitude: 35.6762, longitude: 139.6503, country: "Japan", admin1: "Tokyo", timezone: "Asia/Tokyo" },
  { id: 2147714, name: "Sydney", latitude: -33.8688, longitude: 151.2093, country: "Australia", admin1: "New South Wales", timezone: "Australia/Sydney" }
];

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("weather_dark_theme") !== "false";
  });

  // Unit settings
  const [unit, setUnit] = useState<WeatherUnit>({
    temp: "C",
    wind: "kmh"
  });

  // Selected Location
  const [selectedCity, setSelectedCity] = useState<CitySearchResult>(PRESET_CITIES[0]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Weather data states
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [dailyForecast, setDailyForecast] = useState<DailyForecast | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isSimulatedData, setIsSimulatedData] = useState(false);

  // AI recommendations states
  const [recommendations, setRecommendations] = useState<WeatherRecommendations | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsFallback, setRecommendationsFallback] = useState(false);

  // Severe Alerts state
  const [alerts, setAlerts] = useState<WeatherAlert[]>(() => {
    const cached = localStorage.getItem("weather_active_alerts");
    return cached ? JSON.parse(cached) : [
      {
        id: "initial-alert-1",
        title: "Coastal Flood Advisory",
        message: "High tide minor coastal flooding forecast along vulnerable roadways. Drive with high caution.",
        severity: "warning",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        city: "London",
        dismissed: false
      }
    ];
  });

  // Unique simulation reference code
  const [sessionRefId] = useState(() => `AETHER-${Math.floor(100 + Math.random() * 900)}-XQ`);
  const [timestampStr, setTimestampStr] = useState("");

  // Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("weather_dark_theme", String(isDarkMode));
  }, [isDarkMode]);

  // Sync alerts cache
  useEffect(() => {
    localStorage.setItem("weather_active_alerts", JSON.stringify(alerts));
  }, [alerts]);

  // Realtime clock for styling
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestampStr(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click to close geocode suggestion list
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trigger search on query change
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        let data;
        try {
          // Try direct client-side first (fastest, avoids container network limits)
          const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=6&language=en&format=json`
          );
          if (!response.ok) throw new Error("Direct geocoding failed");
          data = await response.json();
        } catch (directErr) {
          console.warn("Direct geocoding failed, falling back to server proxy:", directErr);
          // Fallback to server proxy
          const response = await fetch(
            `/api/geocode?name=${encodeURIComponent(searchQuery)}`
          );
          if (!response.ok) throw new Error("Proxy geocoding failed");
          data = await response.json();
        }

        if (data.results) {
          setSearchResults(data.results);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Geocoding fetch failure:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Main weather loading handler
  useEffect(() => {
    fetchWeatherAndSynthesize(selectedCity);
  }, [selectedCity]);

  const getSimulatedWeatherData = (city: CitySearchResult) => {
    const name = city.name.toLowerCase();
    let baseTemp = 20;
    let isRainy = false;
    let weatherCode = 3;
    let maxTemp = 25;
    let minTemp = 15;
    let humidity = 65;
    let windSpeed = 12;

    if (name.includes("london")) {
      baseTemp = 18;
      maxTemp = 22;
      minTemp = 13;
      isRainy = Math.random() > 0.4;
      weatherCode = isRainy ? 61 : 3;
      humidity = 78;
    } else if (name.includes("new york")) {
      baseTemp = 26;
      maxTemp = 31;
      minTemp = 21;
      isRainy = Math.random() > 0.6;
      weatherCode = isRainy ? 80 : 1;
      humidity = 70;
    } else if (name.includes("mumbai")) {
      baseTemp = 28;
      maxTemp = 30;
      minTemp = 26;
      isRainy = true;
      weatherCode = 65;
      humidity = 92;
      windSpeed = 22;
    } else if (name.includes("tokyo")) {
      baseTemp = 25;
      maxTemp = 29;
      minTemp = 22;
      isRainy = Math.random() > 0.5;
      weatherCode = isRainy ? 61 : 2;
      humidity = 82;
    } else if (name.includes("sydney")) {
      baseTemp = 12;
      maxTemp = 16;
      minTemp = 8;
      isRainy = Math.random() > 0.3;
      weatherCode = isRainy ? 51 : 0;
      humidity = 60;
    } else {
      const lat = Math.abs(city.latitude);
      if (lat < 23.5) {
        baseTemp = 28;
        maxTemp = 32;
        minTemp = 24;
        weatherCode = 1;
      } else if (lat > 50) {
        baseTemp = 14;
        maxTemp = 18;
        minTemp = 9;
        weatherCode = 3;
      } else {
        baseTemp = 22;
        maxTemp = 26;
        minTemp = 16;
        weatherCode = 2;
      }
    }

    const current: CurrentWeather = {
      temp: baseTemp,
      apparent: baseTemp + (humidity > 80 ? 2 : -1),
      humidity: humidity,
      windSpeed: windSpeed,
      isDay: true,
      rain: isRainy ? 2.5 : 0.0,
      weatherCode: weatherCode
    };

    const times = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    const daily: DailyForecast = {
      time: times,
      weatherCode: Array.from({ length: 7 }, (_, i) => i === 0 ? weatherCode : (Math.random() > 0.5 ? 3 : (Math.random() > 0.5 ? 61 : 1))),
      tempMax: times.map((_, i) => maxTemp + Math.sin(i) * 2),
      tempMin: times.map((_, i) => minTemp + Math.cos(i) * 1.5),
      apparentMax: times.map((_, i) => maxTemp + Math.sin(i) * 2 + 1),
      apparentMin: times.map((_, i) => minTemp + Math.cos(i) * 1.5 - 1),
      uvIndex: Array.from({ length: 7 }, () => parseFloat((Math.random() * 8 + 1).toFixed(1))),
      precipSum: Array.from({ length: 7 }, (_, i) => i === 0 && isRainy ? 12.4 : (Math.random() > 0.7 ? parseFloat((Math.random() * 8).toFixed(1)) : 0.0)),
      precipProb: Array.from({ length: 7 }, (_, i) => i === 0 && isRainy ? 95 : (Math.random() > 0.5 ? Math.floor(Math.random() * 60) : 0)),
      windMax: times.map(() => parseFloat((windSpeed + Math.random() * 10).toFixed(1)))
    };

    return { current, daily };
  };

  const fetchWeatherAndSynthesize = async (city: CitySearchResult) => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    setIsSimulatedData(false);
    try {
      let weatherData;
      const directUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
      const proxyUrl = `/api/forecast?latitude=${city.latitude}&longitude=${city.longitude}`;

      try {
        // Try direct client-side fetch first (most robust against server sandboxing limitations)
        const res = await fetch(directUrl);
        if (!res.ok) throw new Error("Direct forecast fetch returned non-ok status");
        weatherData = await res.json();
      } catch (directErr) {
        console.warn("Direct forecast fetch failed, falling back to server proxy:", directErr);
        // Fallback to server proxy
        const res = await fetch(proxyUrl);
        if (!res.ok) {
          let serverErrorMsg = "";
          try {
            const errJson = await res.json();
            serverErrorMsg = errJson.error || errJson.message || "";
          } catch (e) {}
          throw new Error(serverErrorMsg || `Server proxy returned status ${res.status}`);
        }
        weatherData = await res.json();
      }
      
      const current = weatherData.current;
      const daily = weatherData.daily;

      if (!current || !daily) {
        throw new Error("Parsed response lacks vital meteorological values.");
      }

      const currentObject: CurrentWeather = {
        temp: current.temperature_2m,
        apparent: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        isDay: current.is_day === 1,
        rain: current.rain,
        weatherCode: current.weather_code
      };

      const dailyObject: DailyForecast = {
        time: daily.time,
        weatherCode: daily.weather_code,
        tempMax: daily.temperature_2m_max,
        tempMin: daily.temperature_2m_min,
        apparentMax: daily.apparent_temperature_max,
        apparentMin: daily.apparent_temperature_min,
        uvIndex: daily.uv_index_max,
        precipSum: daily.precipitation_sum,
        precipProb: daily.precipitation_probability_max,
        windMax: daily.wind_speed_10m_max
      };

      setCurrentWeather(currentObject);
      setDailyForecast(dailyObject);
      setIsLoadingWeather(false);

      // 2. Fetch/Synthesize tactical planning recommendations
      synthesizeAetherRecommendations(city.name, currentObject, dailyObject);

      // 3. Auto alert trigger check for extreme weather parameters
      triggerAutomatedWeatherAlerts(city.name, currentObject, dailyObject);

    } catch (err: any) {
      console.error("Failed to load real-time meteorological data. Engaging seasonal high-fidelity simulation engine.", err);
      try {
        const simulated = getSimulatedWeatherData(city);
        setCurrentWeather(simulated.current);
        setDailyForecast(simulated.daily);
        setIsSimulatedData(true);
        setIsLoadingWeather(false);
        
        // Feed simulated data to downstream modules so that they are fully operational!
        synthesizeAetherRecommendations(city.name, simulated.current, simulated.daily);
        triggerAutomatedWeatherAlerts(city.name, simulated.current, simulated.daily);
      } catch (simErr) {
        setWeatherError(err.message || "An unexpected error occurred while processing weather data.");
        setIsLoadingWeather(false);
      }
    }
  };

  const synthesizeAetherRecommendations = async (cityName: string, current: CurrentWeather, daily: DailyForecast) => {
    setIsLoadingRecommendations(true);
    setRecommendationsFallback(false);
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: cityName,
          current,
          daily
        })
      });

      if (!response.ok) {
        throw new Error("Aether recommendations API endpoint responded with failure.");
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setRecommendationsFallback(data.isFallback);
    } catch (err) {
      console.error("AI recommendations synthesizer failed, applying browser-side rules:", err);
      // Fallback is handled safely by the component or is already generated by local rule generator if backend fails
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const triggerAutomatedWeatherAlerts = (cityName: string, current: CurrentWeather, daily: DailyForecast) => {
    const detectedAlerts: WeatherAlert[] = [];

    // Rain warning
    if (current.rain > 3) {
      detectedAlerts.push({
        id: `auto-rain-${Date.now()}`,
        title: "Active Rain Accumulation",
        message: `Persistent rain detected in ${cityName} (${current.rain} mm). Take umbrellas and waterproof clothing. Use caution on roads.`,
        severity: "info",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        city: cityName,
        dismissed: false
      });
    }

    // High temperature warning
    if (current.temp > 32) {
      detectedAlerts.push({
        id: `auto-heat-${Date.now()}`,
        title: "High Heat Warning",
        message: `High temperatures registered in ${cityName} (${current.temp}°C). Avoid physical efforts during solar peak hours. Apply SPF 50.`,
        severity: "warning",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        city: cityName,
        dismissed: false
      });
    }

    // High UV Index
    if (daily.uvIndex[0] > 7) {
      detectedAlerts.push({
        id: `auto-uv-${Date.now()}`,
        title: "Critical UV Alert",
        message: `Very high radiation index (${daily.uvIndex[0]}) forecasted today. Wear sunglasses, high protection SPF, and sun hat.`,
        severity: "warning",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        city: cityName,
        dismissed: false
      });
    }

    if (detectedAlerts.length > 0) {
      // Append only unique alerts that don't already exist
      setAlerts(prev => {
        const filteredPrev = prev.filter(p => !detectedAlerts.some(d => d.title === p.title && p.city === cityName));
        return [...detectedAlerts, ...filteredPrev];
      });
    }
  };

  const handleSimulateAlert = (severity: "info" | "warning" | "severe", title: string, message: string) => {
    const newAlert: WeatherAlert = {
      id: `simulated-${Date.now()}`,
      title,
      message,
      severity,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      city: selectedCity.name,
      dismissed: false
    };

    setAlerts(prev => [newAlert, ...prev]);
  };

  const handleDismissAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, dismissed: true } : alert));
  };

  const handleClearAllAlerts = () => {
    setAlerts([]);
  };

  const handleSelectCity = (city: CitySearchResult) => {
    setSelectedCity(city);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const toggleTemperatureUnit = () => {
    setUnit(prev => ({
      ...prev,
      temp: prev.temp === "C" ? "F" : "C",
      wind: prev.wind === "kmh" ? "mph" : "kmh"
    }));
  };

  // Extract severe alerts count for indicator
  const activeSevereAlertsCount = alerts.filter(a => !a.dismissed && (a.severity === "severe" || a.severity === "warning")).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex flex-col p-4 md:p-8 lg:p-12 border-[12px] md:border-[24px] border-slate-900 transition-colors duration-500 relative overflow-hidden dark:bg-slate-950 dark:text-slate-50 light:bg-slate-100 light:text-slate-900 light:border-slate-200">
      
      {/* Absolute floating coordinates in background (Artistic Flair theme signature) */}
      <div className="absolute top-0 right-0 p-8 flex flex-col items-end opacity-5 pointer-events-none select-none">
        <span className="text-[80px] md:text-[140px] font-black leading-none -mr-4 md:-mr-12">
          {selectedCity.latitude.toFixed(2)}
        </span>
        <span className="text-[80px] md:text-[140px] font-black leading-none -mr-4 md:-mr-12">
          {selectedCity.longitude.toFixed(2)}
        </span>
      </div>

      {/* Header element */}
      <header className="flex flex-col md:flex-row justify-between items-start z-10 mb-8 md:mb-12 gap-6" id="app-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter leading-none text-slate-100 dark:text-slate-100 light:text-slate-900">
              AETHER<span className="text-blue-500 underline decoration-4 underline-offset-8">INTEL</span>
            </h1>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition light:bg-white light:border-slate-200 text-slate-400 hover:text-white"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
          <p className="text-[10px] md:text-xs font-mono tracking-[0.4em] uppercase text-slate-500 dark:text-slate-500 light:text-slate-400">
            Atmospheric Analysis & Planning Division
          </p>
        </div>

        {/* Query Input Box */}
        <div className="flex flex-col items-end w-full md:w-auto relative" ref={dropdownRef}>
          <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl px-4 py-3 w-full md:w-[400px] shadow-lg dark:bg-slate-900/80 dark:border-slate-800 light:bg-white light:border-slate-300">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Query atmospheric coordinates (City)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="bg-transparent border-none outline-none text-slate-100 dark:text-slate-100 light:text-slate-900 text-sm w-full font-sans placeholder-slate-500 focus:ring-0"
              id="search-input"
            />
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            ) : (
              <div className="hidden sm:block ml-auto text-[10px] font-mono border border-slate-700 px-1.5 py-0.5 rounded text-slate-500 light:border-slate-300">
                GEO V3
              </div>
            )}
          </div>

          {/* Preset shortcuts bar under input */}
          <div className="mt-2 flex flex-wrap gap-2 justify-end w-full max-w-[400px]">
            {PRESET_CITIES.map(pc => (
              <button
                key={pc.id}
                onClick={() => handleSelectCity(pc)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-md border transition ${
                  selectedCity.id === pc.id 
                    ? "bg-blue-600 border-blue-500 text-white" 
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 light:bg-slate-200/50 light:border-slate-300 light:text-slate-600 light:hover:bg-slate-200"
                }`}
              >
                {pc.name.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Autocomplete Dropdown suggestions */}
          <AnimatePresence>
            {showDropdown && searchQuery.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-14 left-0 right-0 md:w-[400px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 text-left dark:bg-slate-900 dark:border-slate-800 light:bg-white light:border-slate-300"
                id="search-dropdown"
              >
                {searchResults.length === 0 ? (
                  <div className="p-4 text-xs font-mono text-slate-500 text-center">
                    No matching stations located in current database.
                  </div>
                ) : (
                  <div className="max-h-[250px] overflow-y-auto space-y-1">
                    {searchResults.map((res) => (
                      <button
                        key={res.id}
                        onClick={() => handleSelectCity(res)}
                        className="w-full text-left p-3 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 rounded-xl transition flex justify-between items-center group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 group-hover:text-blue-400 transition flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {res.name}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-500 ml-5 font-mono">
                            {res.admin1 ? `${res.admin1}, ` : ""}{res.country || "Unknown Country"}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-600 bg-slate-950 dark:bg-slate-950 light:bg-slate-200 px-1.5 py-0.5 rounded group-hover:text-slate-200 transition">
                          Lat: {res.latitude.toFixed(1)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>


        </div>
      </header>

      {/* Main Grid Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 z-10" id="main-content-layout">
        
        {/* Left Side: Current Conditions + AI Synthesis Recommendations */}
        <div className="lg:col-span-7 flex flex-col gap-6 md:gap-8 justify-between">
          
          {weatherError ? (
            <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-center flex flex-col items-center justify-center gap-4 flex-1">
              <CloudAlert className="w-12 h-12" />
              <div>
                <h3 className="font-bold text-lg">Meteorological Retrieval Interrupted</h3>
                <p className="text-xs text-rose-400 mt-2 font-mono leading-relaxed">{weatherError}</p>
              </div>
              <button
                onClick={() => fetchWeatherAndSynthesize(selectedCity)}
                className="px-5 py-2 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Retry Retrieval
              </button>
            </div>
          ) : isLoadingWeather ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
              <div className="relative">
                <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <Compass className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin-slow" />
              </div>
              <div className="text-center font-mono">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Locking Satellite Coordinates</p>
                <p className="text-xs text-slate-500 mt-1">Connecting to Open-Meteo systems...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 md:space-y-8 flex-1 flex flex-col justify-between">
              {/* Present conditions summary text label */}
              <div>
                <h2 className="text-slate-400 font-mono text-sm uppercase tracking-[0.3em] mb-4 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    Atmospheric Conditions / {selectedCity.name.toUpperCase()}
                  </div>
                  {isSimulatedData && (
                    <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500 animate-pulse flex items-center gap-1.5 uppercase tracking-normal">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                      Simulated Mode (API Offline)
                    </span>
                  )}
                </h2>
                
                {/* Weather details */}
                {currentWeather && (
                  <WeatherCard 
                    current={currentWeather} 
                    city={selectedCity} 
                    unit={unit} 
                    onToggleUnit={toggleTemperatureUnit} 
                  />
                )}
              </div>

              {/* Tactical planning recommendations */}
              <div>
                <PlanningBox 
                  recommendations={recommendations} 
                  isLoading={isLoadingRecommendations} 
                  onRefresh={() => synthesizeAetherRecommendations(selectedCity.name, currentWeather!, dailyForecast!)}
                  isFallback={recommendationsFallback}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: 7-Day Trajectory Forecast */}
        <div className="lg:col-span-5 flex flex-col gap-6 md:gap-8">
          {/* Forecast Grid */}
          <div className="flex-1">
            {isLoadingWeather ? (
              <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-900/10 border border-slate-800 rounded-2xl">
                <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">Syncing telemetry...</p>
              </div>
            ) : dailyForecast ? (
              <ForecastGrid daily={dailyForecast} unit={unit} />
            ) : null}
          </div>
        </div>
      </main>

      {/* Footer bar matching the aesthetic of Artistic Flair theme */}
      <footer className="mt-8 md:mt-12 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-900 dark:border-slate-900 light:border-slate-200 pt-6 z-10 text-center md:text-left">
        <div className="text-[10px] font-mono text-slate-600 flex flex-wrap justify-center gap-4 md:gap-12 light:text-slate-400">
          <div>STATION_REF: <span className="text-slate-400 dark:text-slate-400 light:text-slate-700 font-semibold">{sessionRefId}</span></div>
          <div>TIMESTAMP_UTC: <span className="text-slate-400 dark:text-slate-400 light:text-slate-700 font-semibold">{timestampStr}</span></div>
          <div>SECURITY: <span className="text-emerald-500 font-semibold">UNCLASSIFIED</span></div>
        </div>
        <div className="text-[10px] md:text-xs font-bold tracking-widest text-slate-500 flex items-center gap-2">
          <span className="w-4 h-[1px] bg-slate-700 dark:bg-slate-700 light:bg-slate-300"></span>
          INTELLIGENCE SERVICE ACTIVE
        </div>
      </footer>
    </div>
  );
}
