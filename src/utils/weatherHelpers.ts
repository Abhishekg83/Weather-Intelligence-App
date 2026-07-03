import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudDrizzle, 
  CloudSnow, 
  CloudLightning, 
  CloudFog, 
  Compass,
  LucideIcon
} from "lucide-react";

export interface WeatherConditionDetails {
  description: string;
  icon: LucideIcon;
  gradientClass: string;
  textClass: string;
  glowColor: string;
}

export function getWeatherCondition(code: number, isDay: boolean = true): WeatherConditionDetails {
  // WMO Weather interpretation codes (WW)
  switch (code) {
    case 0: // Clear sky
      return {
        description: isDay ? "Clear Sky" : "Clear Night",
        icon: Sun,
        gradientClass: isDay 
          ? "from-amber-400 via-orange-400 to-sky-500" 
          : "from-indigo-950 via-slate-900 to-slate-950",
        textClass: isDay ? "text-amber-950" : "text-indigo-100",
        glowColor: "rgba(245, 158, 11, 0.4)"
      };
    case 1: // Mainly clear
    case 2: // Partly cloudy
      return {
        description: "Partly Cloudy",
        icon: CloudSun,
        gradientClass: isDay 
          ? "from-sky-400 via-blue-400 to-slate-300" 
          : "from-slate-900 via-slate-800 to-indigo-950",
        textClass: isDay ? "text-slate-950" : "text-slate-100",
        glowColor: "rgba(96, 165, 250, 0.3)"
      };
    case 3: // Overcast
      return {
        description: "Overcast",
        icon: Cloud,
        gradientClass: isDay 
          ? "from-slate-400 via-slate-300 to-zinc-400" 
          : "from-zinc-900 via-slate-800 to-zinc-950",
        textClass: isDay ? "text-slate-900" : "text-zinc-200",
        glowColor: "rgba(148, 163, 184, 0.25)"
      };
    case 45: // Fog
    case 48: // Depositing rime fog
      return {
        description: "Foggy",
        icon: CloudFog,
        gradientClass: isDay 
          ? "from-zinc-300 via-slate-200 to-stone-300" 
          : "from-slate-900 via-zinc-800 to-zinc-900",
        textClass: isDay ? "text-stone-850" : "text-stone-300",
        glowColor: "rgba(156, 163, 175, 0.2)"
      };
    case 51: // Drizzle: Light
    case 53: // Drizzle: Moderate
    case 55: // Drizzle: Dense intensity
    case 56: // Freezing Drizzle: Light
    case 57: // Freezing Drizzle: Dense intensity
      return {
        description: "Drizzle",
        icon: CloudDrizzle,
        gradientClass: isDay 
          ? "from-cyan-300 via-sky-400 to-slate-400" 
          : "from-sky-950 via-slate-900 to-zinc-900",
        textClass: isDay ? "text-cyan-950" : "text-sky-200",
        glowColor: "rgba(34, 211, 238, 0.3)"
      };
    case 61: // Rain: Slight
    case 63: // Rain: Moderate
    case 65: // Rain: Heavy intensity
    case 80: // Rain showers: Slight
    case 81: // Rain showers: Moderate
    case 82: // Rain showers: Violent
      return {
        description: "Rainy",
        icon: CloudRain,
        gradientClass: isDay 
          ? "from-sky-500 via-blue-500 to-slate-500" 
          : "from-blue-950 via-slate-900 to-slate-950",
        textClass: isDay ? "text-blue-950" : "text-blue-100",
        glowColor: "rgba(59, 130, 246, 0.4)"
      };
    case 66: // Freezing Rain: Light
    case 67: // Freezing Rain: Heavy
    case 71: // Snow fall: Slight
    case 73: // Snow fall: Moderate
    case 75: // Snow fall: Heavy intensity
    case 77: // Snow grains
    case 85: // Snow showers: Slight
    case 86: // Snow showers: Heavy
      return {
        description: "Snowy",
        icon: CloudSnow,
        gradientClass: isDay 
          ? "from-indigo-100 via-sky-200 to-zinc-100" 
          : "from-indigo-950 via-slate-900 to-indigo-900",
        textClass: isDay ? "text-indigo-950" : "text-indigo-200",
        glowColor: "rgba(186, 230, 253, 0.5)"
      };
    case 95: // Thunderstorm: Slight or moderate
    case 96: // Thunderstorm with hail
    case 99: // Thunderstorm with heavy hail
      return {
        description: "Thunderstorm",
        icon: CloudLightning,
        gradientClass: "from-violet-950 via-slate-900 to-purple-950",
        textClass: "text-purple-100",
        glowColor: "rgba(139, 92, 246, 0.5)"
      };
    default:
      return {
        description: "Unknown",
        icon: Compass,
        gradientClass: isDay 
          ? "from-slate-400 via-blue-200 to-slate-300" 
          : "from-slate-900 via-slate-800 to-slate-950",
        textClass: isDay ? "text-slate-900" : "text-slate-200",
        glowColor: "rgba(148, 163, 184, 0.3)"
      };
  }
}

export function formatTemp(celsius: number, unit: "C" | "F"): string {
  if (unit === "F") {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatWind(kmh: number, unit: "kmh" | "mph"): string {
  if (unit === "mph") {
    const mph = kmh * 0.621371;
    return `${Math.round(mph)} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

export function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function getFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
