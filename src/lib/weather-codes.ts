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
  { code: 0, label: "clear sky", short: "clear", icon: "sun", theme: "clear-day", themeNight: "clear-night" },
  { code: 1, label: "mainly clear", short: "mostly clear", icon: "sun", theme: "clear-day", themeNight: "clear-night" },
  { code: 2, label: "partly cloudy", short: "partly cloudy", icon: "cloud-sun", theme: "cloudy-day", themeNight: "cloudy-night" },
  { code: 3, label: "overcast", short: "overcast", icon: "cloud", theme: "cloudy-day", themeNight: "cloudy-night" },
  { code: 45, label: "fog", short: "foggy", icon: "cloud-fog", theme: "fog", themeNight: "fog" },
  { code: 48, label: "depositing rime fog", short: "rime fog", icon: "cloud-fog", theme: "fog", themeNight: "fog" },
  { code: 51, label: "light drizzle", short: "drizzle", icon: "cloud-drizzle", theme: "drizzle", themeNight: "drizzle" },
  { code: 53, label: "moderate drizzle", short: "drizzle", icon: "cloud-drizzle", theme: "drizzle", themeNight: "drizzle" },
  { code: 55, label: "dense drizzle", short: "drizzle", icon: "cloud-drizzle", theme: "drizzle", themeNight: "drizzle" },
  { code: 56, label: "light freezing drizzle", short: "freezing drizzle", icon: "cloud-drizzle", theme: "drizzle", themeNight: "drizzle" },
  { code: 57, label: "dense freezing drizzle", short: "freezing drizzle", icon: "cloud-drizzle", theme: "drizzle", themeNight: "drizzle" },
  { code: 61, label: "light rain", short: "rain", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 63, label: "moderate rain", short: "rain", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 65, label: "heavy rain", short: "heavy rain", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 66, label: "light freezing rain", short: "freezing rain", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 67, label: "heavy freezing rain", short: "freezing rain", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 71, label: "light snow", short: "snow", icon: "snowflake", theme: "snow", themeNight: "snow" },
  { code: 73, label: "moderate snow", short: "snow", icon: "snowflake", theme: "snow", themeNight: "snow" },
  { code: 75, label: "heavy snow", short: "heavy snow", icon: "snowflake", theme: "snow", themeNight: "snow" },
  { code: 77, label: "snow grains", short: "snow grains", icon: "snowflake", theme: "snow", themeNight: "snow" },
  { code: 80, label: "light rain showers", short: "showers", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 81, label: "moderate rain showers", short: "showers", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 82, label: "violent rain showers", short: "heavy showers", icon: "cloud-rain", theme: "rain", themeNight: "rain" },
  { code: 85, label: "light snow showers", short: "snow showers", icon: "cloud-snow", theme: "snow", themeNight: "snow" },
  { code: 86, label: "heavy snow showers", short: "snow showers", icon: "cloud-snow", theme: "snow", themeNight: "snow" },
  { code: 95, label: "thunderstorm", short: "storm", icon: "cloud-lightning", theme: "thunderstorm", themeNight: "thunderstorm" },
  { code: 96, label: "thunderstorm with light hail", short: "storm + hail", icon: "cloud-lightning", theme: "thunderstorm", themeNight: "thunderstorm" },
  { code: 99, label: "thunderstorm with heavy hail", short: "severe storm", icon: "cloud-lightning", theme: "thunderstorm", themeNight: "thunderstorm" },
];

const CODE_MAP = new Map<number, WeatherCondition>(ENTRIES.map((e) => [e.code, e]));

export function describeWeather(code: number): WeatherCondition {
  return (
    CODE_MAP.get(code) ?? {
      code,
      label: "unknown",
      short: "unknown",
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
