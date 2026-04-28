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

export type Snapshot = {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  cloudCover: number;
  isDay: boolean;
  uvIndex: number;
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

export type AirQuality = {
  pm10?: number;
  pm2_5?: number;
  ozone?: number;
  europeanAqi?: number;
  usAqi?: number;
};

export type WeatherPayload = {
  place: Place;
  current: Snapshot;
  hourly: Snapshot[];
  daily: DailyEntry[];
  airQuality?: AirQuality;
  nowIndex: number;
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
