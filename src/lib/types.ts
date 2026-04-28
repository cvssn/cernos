export type Coords = { latitude: number; longitude: number };

export type Place = {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

export type CurrentWeather = {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  cloudCover: number;
  isDay: boolean;
  uvIndex: number;
  time: string;
};

export type HourlyEntry = {
  time: string;
  temperature: number;
  weatherCode: number;
  precipitation: number;
  precipitationProbability: number;
  isDay: boolean;
};

export type DailyEntry = {
  date: string;
  weatherCode: number;
  temperatureMax: number;
  temperatureMin: number;
  sunrise: string;
  sunset: string;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  uvIndexMax: number;
};

export type WeatherPayload = {
  place: Place;
  current: CurrentWeather;
  hourly: HourlyEntry[];
  daily: DailyEntry[];
  airQuality?: AirQuality;
};

export type AirQuality = {
  pm10?: number;
  pm2_5?: number;
  ozone?: number;
  europeanAqi?: number;
  usAqi?: number;
};

export type ThemeName =
  | "clear-day"
  | "clear-night"
  | "cloudy-day"
  | "cloudy-night"
  | "rain"
  | "thunderstorm"
  | "snow"
  | "fog"
  | "drizzle";

export type ThemePalette = {
  name: ThemeName;
  label: string;
  gradient: string;
  accent: string;
  glass: string;
  text: string;
  subtext: string;
  border: string;
  ring: string;
  particle: string;
};

export type FavoriteRow = {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
};

export type HistoryRow = FavoriteRow;
