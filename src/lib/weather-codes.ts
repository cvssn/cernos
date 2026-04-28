import type { ThemeName } from "./types";

export type WeatherCondition = {
  code: number;
  label: string;
  short: string;
  icon: string;
  theme: ThemeName;
  themeNight: ThemeName;
};

const ENTRIES: WeatherCondition[] = [
  { code: 0, label: "Clear sky", short: "Clear", icon: "sun", theme: "clear-day", themeNight: "clear-night" },
  { code: 1, label: "Mainly clear", short: "Mostly clear", icon: "sun", theme: "clear-day", themeNight: "clear-night" },
  { code: 2, label: "Partly cloudy", short: "Partly cloudy", icon: "cloud-sun", theme: "cloudy-day", themeNight: "cloudy-night" },
  { code: 3, label: "Overcast", short: "Overcast", icon: "cloud", theme: "cloudy-day", themeNight: "cloudy-night" },
  { code: 45, label: "Fog", short: "Foggy", icon: "cloud-fog", theme: "fog", themeNight: "fog" },
  { code: 48, label: "Depositing rime fog", short: "Rime fog", icon: "cloud-fog", theme: "fog", themeNight: "fog" },
  { code: 51, label: "Light drizzle", short: "Drizzle", icon: "cloud-drizzle", theme: "drizzle", themeNight: "drizzle" },
  { code: 53, label: "Moderate drizzle", short: "Drizzle", icon: "cloud-drizzle", theme: "drizzle", themeNight: "drizzle" },
  { code: 55, label: "Dense drizzle", short: "Drizzle", icon: "cloud-drizzle", theme: "drizzle", themeNight: "drizzle" },
  { code: 56, label: "Light freezing drizzle", short: "Freezing drizzle", icon: "cloud-drizzle", theme: "drizzle", themeNight: "drizzle" },
  { code: 57, label: "Dense freezing drizzle", short: "Freezing drizzle", icon: "cloud-drizzle", theme: "drizzle", themeNight: "drizzle" },
  { code: 61, label: "Light rain", short: "Rain", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 63, label: "Moderate rain", short: "Rain", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 65, label: "Heavy rain", short: "Heavy rain", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 66, label: "Light freezing rain", short: "Freezing rain", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 67, label: "Heavy freezing rain", short: "Freezing rain", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 71, label: "Light snow", short: "Snow", icon: "snowflake", theme: "snow", themeNight: "snow" },
  { code: 73, label: "Moderate snow", short: "Snow", icon: "snowflake", theme: "snow", themeNight: "snow" },
  { code: 75, label: "Heavy snow", short: "Heavy snow", icon: "snowflake", theme: "snow", themeNight: "snow" },
  { code: 77, label: "Snow grains", short: "Snow grains", icon: "snowflake", theme: "snow", themeNight: "snow" },
  { code: 80, label: "Light rain showers", short: "Showers", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 81, label: "Moderate rain showers", short: "Showers", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 82, label: "Violent rain showers", short: "Heavy showers", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 85, label: "Light snow showers", short: "Snow showers", icon: "cloud-snow", theme: "snow", themeNight: "snow" },
  { code: 86, label: "Heavy snow showers", short: "Snow showers", icon: "cloud-snow", theme: "snow", themeNight: "snow" },
  { code: 95, label: "Thunderstorm", short: "Storm", icon: "cloud-lightning", theme: "thunderstorm", themeNight: "thunderstorm" },
  { code: 96, label: "Thunderstorm with light hail", short: "Storm + hail", icon: "cloud-lightning", theme: "thunderstorm", themeNight: "thunderstorm" },
  { code: 99, label: "Thunderstorm with heavy hail", short: "Severe storm", icon: "cloud-lightning", theme: "thunderstorm", themeNight: "thunderstorm" },
];

const CODE_MAP = new Map<number, WeatherCondition>(ENTRIES.map((e) => [e.code, e]));

export function describeWeather(code: number): WeatherCondition {
  return (
    CODE_MAP.get(code) ?? {
      code,
      label: "Unknown",
      short: "Unknown",
      icon: "cloud",
      theme: "cloudy-day",
      themeNight: "cloudy-night",
    }
  );
}

export function themeForCondition(code: number, isDay: boolean): ThemeName {
  const c = describeWeather(code);
  return isDay ? c.theme : c.themeNight;
}
