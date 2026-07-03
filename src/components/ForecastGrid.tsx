import { DailyForecast, WeatherUnit } from "../types";
import { formatTemp, getDayName, getFullDate, getWeatherCondition } from "../utils/weatherHelpers";
import { motion } from "motion/react";

interface ForecastGridProps {
  daily: DailyForecast;
  unit: WeatherUnit;
}

export default function ForecastGrid({ daily, unit }: ForecastGridProps) {
  return (
    <div className="flex flex-col bg-slate-900/40 dark:bg-slate-900/40 light:bg-slate-50/70 p-6 md:p-8 border border-slate-800/80 dark:border-slate-800/80 border-slate-200 rounded-2xl h-full shadow-lg" id="forecast-grid-container">
      <h3 className="text-xs font-mono uppercase tracking-[0.3em] text-slate-500 dark:text-slate-500 light:text-slate-600 mb-6 border-b border-slate-800 dark:border-slate-800 border-slate-200 pb-4">
        7-Day Trajectory
      </h3>
      <div className="flex-1 space-y-4 md:space-y-5 overflow-y-auto pr-1">
        {daily.time.map((timeStr, index) => {
          const condition = getWeatherCondition(daily.weatherCode[index], true);
          const ConditionIcon = condition.icon;
          const dayName = getDayName(timeStr);
          const dateLabel = getFullDate(timeStr);
          const isToday = dayName === "Today";

          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={timeStr}
              className={`flex items-center justify-between group py-1.5 ${
                isToday ? "text-amber-500 dark:text-amber-400 font-semibold" : "text-slate-350 dark:text-slate-300 light:text-slate-800"
              }`}
              id={`forecast-day-${timeStr}`}
            >
              <div className="flex flex-col min-w-[70px]">
                <span className="text-[10px] font-mono opacity-60 tracking-wider">
                  {dateLabel.toUpperCase()}
                </span>
                <span className="font-bold text-sm tracking-tight">{dayName.toUpperCase()}</span>
              </div>

              {/* Weather Condition Icon + Text */}
              <div className="flex items-center gap-2 w-28 md:w-32 justify-start pl-2">
                <ConditionIcon className={`w-4 h-4 shrink-0 ${isToday ? "text-amber-500" : "text-slate-400"}`} />
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 light:text-slate-600 truncate max-w-[100px] md:max-w-none">
                  {condition.description.toUpperCase()}
                </span>
              </div>

              {/* Progress Line */}
              <div className={`hidden sm:block flex-1 mx-4 h-[1px] ${
                isToday ? "bg-amber-500/30 dark:bg-amber-500/30" : "bg-slate-800 dark:bg-slate-800 bg-slate-200"
              }`} />

              {/* High/Low Temperature */}
              <div className="flex gap-4 font-mono text-xs text-right whitespace-nowrap min-w-[70px] justify-end">
                <span className="text-blue-500 dark:text-blue-400">{formatTemp(daily.tempMin[index], unit.temp)}</span>
                <span className="text-slate-600 dark:text-slate-600">/</span>
                <span className="text-orange-500 dark:text-orange-400">{formatTemp(daily.tempMax[index], unit.temp)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
