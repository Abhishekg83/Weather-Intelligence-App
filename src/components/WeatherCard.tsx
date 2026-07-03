import { Compass, Thermometer, Wind, Droplets, CloudRain, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { CurrentWeather, CitySearchResult, WeatherUnit } from "../types";
import { getWeatherCondition, formatTemp, formatWind } from "../utils/weatherHelpers";

interface WeatherCardProps {
  current: CurrentWeather;
  city: CitySearchResult;
  unit: WeatherUnit;
  onToggleUnit: () => void;
}

export default function WeatherCard({ current, city, unit, onToggleUnit }: WeatherCardProps) {
  const details = getWeatherCondition(current.weatherCode, current.isDay);
  const WeatherIcon = details.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative w-full overflow-hidden rounded-3xl p-6 text-white shadow-2xl transition-all duration-500`}
      style={{
        background: `linear-gradient(135deg, ${details.gradientClass.split(" ").map(cls => {
          if (cls.startsWith("from-")) return cls.replace("from-", "");
          if (cls.startsWith("via-")) return cls.replace("via-", "");
          if (cls.startsWith("to-")) return cls.replace("to-", "");
          return cls;
        }).join(", ")})`,
        boxShadow: `0 20px 40px -15px ${details.glowColor}`
      }}
      id="current-weather-card"
    >
      {/* Decorative background visual elements */}
      <div className="absolute -right-10 -top-10 opacity-10 blur-xl pointer-events-none">
        <WeatherIcon className="w-56 h-56 text-white" />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full gap-6">
        {/* Header Block */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-1.5 opacity-90 text-sm font-medium tracking-wide uppercase">
              <Compass className="w-4 h-4 animate-spin-slow" />
              <span>Current Weather</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 leading-tight text-white drop-shadow-sm">
              {city.name}
            </h2>
            <p className="text-sm opacity-80 mt-0.5">
              {city.admin1 ? `${city.admin1}, ` : ""}{city.country || "Unknown Country"}
            </p>
          </div>

          {/* Unit Toggle Button */}
          <button
            onClick={onToggleUnit}
            className="px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold transition flex items-center gap-1 hover:scale-105 active:scale-95 border border-white/10"
            id="unit-toggle-btn"
          >
            <span>{unit.temp === "C" ? "°C" : "°F"}</span>
            <span className="opacity-40">|</span>
            <span className="opacity-75">{unit.temp === "C" ? "°F" : "°C"}</span>
          </button>
        </div>

        {/* Temperature Block */}
        <div className="flex flex-wrap items-center justify-between gap-6 py-2">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-md shadow-inner">
              <WeatherIcon className="w-12 h-12 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-baseline">
                <span className="text-5xl md:text-6xl font-black tracking-tighter drop-shadow-md">
                  {formatTemp(current.temp, unit.temp)}
                </span>
              </div>
              <p className="text-base font-semibold drop-shadow-sm flex items-center gap-1.5 mt-0.5 capitalize">
                {details.description}
                {current.isDay ? <Sun className="w-4 h-4 text-amber-200" /> : <Moon className="w-4 h-4 text-indigo-200" />}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-right bg-black/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/5">
            <span className="text-xs opacity-75 uppercase tracking-wider font-semibold">Feels Like</span>
            <span className="text-xl font-bold">
              {formatTemp(current.apparent, unit.temp)}
            </span>
          </div>
        </div>

        {/* Detailed Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl flex flex-col gap-1 border border-white/10 hover:bg-white/15 transition duration-300">
            <div className="flex items-center gap-1.5 opacity-80">
              <Droplets className="w-4 h-4 text-sky-200" />
              <span className="text-xs font-semibold uppercase tracking-wider">Humidity</span>
            </div>
            <span className="text-lg font-bold mt-1">{current.humidity}%</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl flex flex-col gap-1 border border-white/10 hover:bg-white/15 transition duration-300">
            <div className="flex items-center gap-1.5 opacity-80">
              <Wind className="w-4 h-4 text-amber-200 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider">Wind</span>
            </div>
            <span className="text-lg font-bold mt-1">
              {formatWind(current.windSpeed, unit.wind)}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl flex flex-col gap-1 border border-white/10 hover:bg-white/15 transition duration-300">
            <div className="flex items-center gap-1.5 opacity-80">
              <CloudRain className="w-4 h-4 text-blue-200" />
              <span className="text-xs font-semibold uppercase tracking-wider">Precip</span>
            </div>
            <span className="text-lg font-bold mt-1">{current.rain} mm</span>
          </div>
        </div>

        {/* Coordinates Footer */}
        <div className="flex justify-between items-center text-[10px] opacity-75 border-t border-white/10 pt-3">
          <span>Lat: {city.latitude.toFixed(4)}° | Lon: {city.longitude.toFixed(4)}°</span>
          <span>Timezone: {city.timezone || "UTC"}</span>
        </div>
      </div>
    </motion.div>
  );
}
