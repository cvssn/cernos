"use client";

import { motion } from "framer-motion";
import { WeatherIcon } from "./WeatherIcon";
import { describeWeather } from "@/lib/weather-codes";
import type { DailyEntry, Snapshot } from "@/lib/types";
import { Droplets } from "lucide-react";

type Props = {
  daily: DailyEntry[];
  hourly: Snapshot[];
  scrubIndex: number;
  onPickDay: (firstHourIndex: number) => void;
};

export default function DailyForecast({ daily, hourly, scrubIndex, onPickDay }: Props) {
  const minOverall = Math.min(...daily.map((d) => d.temperatureMin));
  const maxOverall = Math.max(...daily.map((d) => d.temperatureMax));
  const scrubbedDate = hourly[scrubIndex]?.time.slice(0, 10);

  // index of the first hour that falls on date d.date
  const firstHourFor = (date: string) => {
    for (let i = 0; i < hourly.length; i++) {
      if (hourly[i].time.slice(0, 10) === date) return i;
    }
    return 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="glass-strong p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-main font-semibold">7-day forecast</h2>
        <span className="text-sub text-xs uppercase tracking-wider">Daily</span>
      </div>
      <div className="space-y-1">
        {daily.map((d, i) => {
          const date = new Date(d.date);
          const label =
            i === 0
              ? "Today"
              : date.toLocaleDateString(undefined, { weekday: "short" });
          const cond = describeWeather(d.weatherCode);
          const leftPct =
            ((d.temperatureMin - minOverall) / Math.max(1, maxOverall - minOverall)) * 100;
          const rightPct =
            ((d.temperatureMax - minOverall) / Math.max(1, maxOverall - minOverall)) * 100;
          const isSelected = scrubbedDate === d.date;
          return (
            <button
              key={d.date}
              onClick={() => onPickDay(firstHourFor(d.date))}
              className={`w-full grid grid-cols-[60px,40px,1fr,80px] md:grid-cols-[80px,40px,1fr,120px] items-center gap-3 py-2 px-2 rounded-lg transition ${
                isSelected ? "bg-white/10" : "hover:bg-white/5"
              }`}
              aria-pressed={isSelected}
            >
              <div className="text-main text-sm font-medium text-left">{label}</div>
              <div className="accent flex justify-center" title={cond.label}>
                <WeatherIcon code={d.weatherCode} isDay={true} size={22} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sub text-xs w-7 text-right">
                  {Math.round(d.temperatureMin)}°
                </span>
                <div className="relative flex-1 h-1.5 rounded-full overflow-hidden bg-white/15">
                  <div
                    className="absolute h-full rounded-full"
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(8, rightPct - leftPct)}%`,
                      background:
                        "linear-gradient(90deg, #60a5fa 0%, var(--accent) 100%)",
                    }}
                  />
                </div>
                <span className="text-main text-xs w-7 text-left">
                  {Math.round(d.temperatureMax)}°
                </span>
              </div>
              <div className="flex items-center justify-end gap-1 text-xs text-sub">
                {d.precipitationProbabilityMax > 10 ? (
                  <>
                    <Droplets size={11} /> {d.precipitationProbabilityMax}%
                  </>
                ) : (
                  <span className="opacity-50">—</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
