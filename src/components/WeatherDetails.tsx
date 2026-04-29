"use client";

import { motion } from "framer-motion";
import { Wind, Droplets, Eye, Gauge, SunMedium, Leaf } from "lucide-react";
import SunArc from "./SunArc";
import type { Snapshot, WeatherPayload } from "@/lib/types";

type Props = { weather: WeatherPayload; snapshot: Snapshot };

export default function WeatherDetails({ weather, snapshot }: Props) {
  const dKey = snapshot.time.slice(0, 10);
  const day = weather.daily.find((d) => d.date === dKey) ?? weather.daily[0];
  const aqi = weather.airQuality?.europeanAqi;

  const aqiLabel =
    aqi == null
      ? null
      : aqi <= 20
      ? "Good"
      : aqi <= 40
      ? "Fair"
      : aqi <= 60
      ? "Moderate"
      : aqi <= 80
      ? "Poor"
      : "Very poor";
  const uvLabel =
    snapshot.uvIndex == null
      ? "—"
      : snapshot.uvIndex < 3
      ? "Low"
      : snapshot.uvIndex < 6
      ? "Moderate"
      : snapshot.uvIndex < 8
      ? "High"
      : snapshot.uvIndex < 11
      ? "Very high"
      : "Extreme";

  const items = [
    {
      icon: <Wind size={18} />,
      label: "Wind",
      value: `${Math.round(snapshot.windSpeed)} km/h`,
      hint: directionLabel(snapshot.windDirection),
    },
    {
      icon: <Droplets size={18} />,
      label: "Humidity",
      value: `${snapshot.humidity}%`,
      hint:
        snapshot.humidity > 70 ? "Humid" : snapshot.humidity < 30 ? "Dry" : "Comfortable",
    },
    {
      icon: <Gauge size={18} />,
      label: "Pressure",
      value: `${Math.round(snapshot.pressure)} hPa`,
      hint:
        snapshot.pressure < 1000 ? "Low" : snapshot.pressure > 1020 ? "High" : "Steady",
    },
    {
      icon: <SunMedium size={18} />,
      label: "UV index",
      value: snapshot.uvIndex != null ? Math.round(snapshot.uvIndex).toString() : "—",
      hint: uvLabel,
    },
    {
      icon: <Eye size={18} />,
      label: "Cloud cover",
      value: `${snapshot.cloudCover}%`,
      hint:
        snapshot.cloudCover < 25
          ? "Clear"
          : snapshot.cloudCover < 70
          ? "Partly cloudy"
          : "Overcast",
    },
    {
      icon: <Leaf size={18} />,
      label: "Air quality",
      value: aqi != null ? Math.round(aqi).toString() : "—",
      hint: aqiLabel ?? "—",
    },
  ];

  return (
    <div className="space-y-3">
      <SunArc day={day} nowTime={snapshot.time} />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-3"
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
    </div>
  );
}

function directionLabel(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round((deg % 360) / 45) % 8];
}
