"use client";

import { motion } from "framer-motion";
import { Wind, Droplets, Eye, Gauge, SunMedium, Sunrise, Sunset, Leaf } from "lucide-react";
import type { WeatherPayload } from "@/lib/types";

export default function WeatherDetails({ weather }: { weather: WeatherPayload }) {
  const c = weather.current;
  const today = weather.daily[0];
  const aqi = weather.airQuality?.europeanAqi;

  const aqiLabel = aqi == null ? null : aqi <= 20 ? "Good" : aqi <= 40 ? "Fair" : aqi <= 60 ? "Moderate" : aqi <= 80 ? "Poor" : "Very poor";
  const uvLabel =
    c.uvIndex == null
      ? "—"
      : c.uvIndex < 3
      ? "Low"
      : c.uvIndex < 6
      ? "Moderate"
      : c.uvIndex < 8
      ? "High"
      : c.uvIndex < 11
      ? "Very high"
      : "Extreme";

  const sunrise = today
    ? new Date(today.sunrise).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "—";
  const sunset = today
    ? new Date(today.sunset).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "—";

  const items = [
    {
      icon: <Wind size={18} />,
      label: "Wind",
      value: `${Math.round(c.windSpeed)} km/h`,
      hint: directionLabel(c.windDirection),
    },
    {
      icon: <Droplets size={18} />,
      label: "Humidity",
      value: `${c.humidity}%`,
      hint: c.humidity > 70 ? "Humid" : c.humidity < 30 ? "Dry" : "Comfortable",
    },
    {
      icon: <Gauge size={18} />,
      label: "Pressure",
      value: `${Math.round(c.pressure)} hPa`,
      hint: c.pressure < 1000 ? "Low" : c.pressure > 1020 ? "High" : "Steady",
    },
    {
      icon: <SunMedium size={18} />,
      label: "UV index",
      value: c.uvIndex != null ? Math.round(c.uvIndex).toString() : "—",
      hint: uvLabel,
    },
    {
      icon: <Eye size={18} />,
      label: "Cloud cover",
      value: `${c.cloudCover}%`,
      hint: c.cloudCover < 25 ? "Clear" : c.cloudCover < 70 ? "Partly cloudy" : "Overcast",
    },
    {
      icon: <Leaf size={18} />,
      label: "Air quality",
      value: aqi != null ? Math.round(aqi).toString() : "—",
      hint: aqiLabel ?? "—",
    },
    {
      icon: <Sunrise size={18} />,
      label: "Sunrise",
      value: sunrise,
      hint: "Today",
    },
    {
      icon: <Sunset size={18} />,
      label: "Sunset",
      value: sunset,
      hint: "Today",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-3"
    >
      {items.map((it) => (
        <div key={it.label} className="glass p-3 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 text-sub text-[10px] uppercase tracking-wider min-w-0">
            <span className="accent shrink-0">{it.icon}</span>
            <span className="truncate">{it.label}</span>
          </div>
          <div className="text-main text-lg font-semibold mt-2 leading-tight break-words">
            {it.value}
          </div>
          <div className="text-sub text-[11px] mt-1 truncate">{it.hint}</div>
        </div>
      ))}
    </motion.div>
  );
}

function directionLabel(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(((deg % 360) / 45)) % 8];
}
