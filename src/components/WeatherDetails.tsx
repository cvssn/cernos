"use client";

import { motion } from "framer-motion";
import { Droplets, Eye, Gauge, SunMedium, Leaf } from "lucide-react";
import SunArc from "./SunArc";
import WindCompass from "./WindCompass";
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
      ? "good"
      : aqi <= 40
      ? "fair"
      : aqi <= 60
      ? "moderate"
      : aqi <= 80
      ? "poor"
      : "very poor";
  const uvLabel =
    snapshot.uvIndex == null
      ? "—"
      : snapshot.uvIndex < 3
      ? "low"
      : snapshot.uvIndex < 6
      ? "moderate"
      : snapshot.uvIndex < 8
      ? "high"
      : snapshot.uvIndex < 11
      ? "very high"
      : "extreme";

  const items = [
    {
      icon: <Droplets size={18} />,
      label: "humidity",
      value: `${snapshot.humidity}%`,
      hint:
        snapshot.humidity > 70 ? "humid" : snapshot.humidity < 30 ? "dry" : "comfortable",
    },
    {
      icon: <Gauge size={18} />,
      label: "pressure",
      value: `${Math.round(snapshot.pressure)} hpa`,
      hint:
        snapshot.pressure < 1000 ? "low" : snapshot.pressure > 1020 ? "high" : "steady",
    },
    {
      icon: <SunMedium size={18} />,
      label: "uv index",
      value: snapshot.uvIndex != null ? Math.round(snapshot.uvIndex).toString() : "—",
      hint: uvLabel,
    },
    {
      icon: <Eye size={18} />,
      label: "cloud cover",
      value: `${snapshot.cloudCover}%`,
      hint:
        snapshot.cloudCover < 25
          ? "clear"
          : snapshot.cloudCover < 70
          ? "partly cloudy"
          : "overcast",
    },
    {
      icon: <Leaf size={18} />,
      label: "air quality",
      value: aqi != null ? Math.round(aqi).toString() : "—",
      hint: aqiLabel ?? "—",
    },
  ];

  return (
    <div className="space-y-3">
      <SunArc day={day} nowTime={snapshot.time} />
      <WindCompass
        speed={snapshot.windSpeed}
        direction={snapshot.windDirection}
      />
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

