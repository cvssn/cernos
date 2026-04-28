"use client";

import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Snowflake,
} from "lucide-react";
import { describeWeather } from "@/lib/weather-codes";

type Props = {
  code: number;
  isDay: boolean;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export function WeatherIcon({ code, isDay, size = 48, className, strokeWidth = 1.5 }: Props) {
  const cond = describeWeather(code);
  const props = { size, className, strokeWidth };

  switch (cond.icon) {
    case "sun":
      return isDay ? <Sun {...props} /> : <Moon {...props} />;
    case "cloud-sun":
      return isDay ? <CloudSun {...props} /> : <CloudMoon {...props} />;
    case "cloud":
      return <Cloud {...props} />;
    case "cloud-rain":
      return <CloudRain {...props} />;
    case "cloud-drizzle":
      return <CloudDrizzle {...props} />;
    case "cloud-snow":
      return <CloudSnow {...props} />;
    case "cloud-lightning":
      return <CloudLightning {...props} />;
    case "cloud-fog":
      return <CloudFog {...props} />;
    case "snowflake":
      return <Snowflake {...props} />;
    default:
      return <Cloud {...props} />;
  }
}
