export interface CitySearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code?: string;
  admin1?: string;
  country?: string;
  timezone?: string;
}

export interface CurrentWeather {
  temp: number;
  apparent: number;
  humidity: number;
  windSpeed: number;
  isDay: boolean;
  rain: number;
  weatherCode: number;
}

export interface DailyForecast {
  time: string[];
  weatherCode: number[];
  tempMax: number[];
  tempMin: number[];
  apparentMax: number[];
  apparentMin: number[];
  uvIndex: number[];
  precipSum: number[];
  precipProb: number[];
  windMax: number[];
}

export interface WeatherRecommendations {
  summary: string;
  clothing: string[];
  activities: string[];
  precautions: string[];
  hourly_best: string;
}

export interface WeatherAlert {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "severe";
  timestamp: string;
  city: string;
  dismissed: boolean;
}

export interface WeatherUnit {
  temp: "C" | "F";
  wind: "kmh" | "mph";
}
