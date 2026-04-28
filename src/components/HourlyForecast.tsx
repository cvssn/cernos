"use client";

import { motion } from "framer-motion";
import { WeatherIcon } from "./WeatherIcon";
import type { HourlyEntry } from "@/lib/types";
import { Droplets } from "lucide-react";

export default function HourlyForecast({ hourly }: { hourly: HourlyEntry[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-strong p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-main font-semibold">Next 24 hours</h2>
        <span className="text-sub text-xs uppercase tracking-wider">Hourly</span>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
        {hourly.map((h, i) => {
          const date = new Date(h.time);
          const label =
            i === 0
              ? "Now"
              : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
          return (
            <div
              key={h.time}
              className="glass min-w-[90px] flex flex-col items-center px-3 py-3 text-center"
            >
              <div className="text-sub text-xs">{label}</div>
              <div className="my-2 accent">
                <WeatherIcon code={h.weatherCode} isDay={h.isDay} size={28} />
              </div>
              <div className="text-main text-lg font-semibold leading-none">
                {Math.round(h.temperature)}°
              </div>
              {h.precipitationProbability > 10 ? (
                <div className="mt-2 flex items-center gap-1 text-[11px] text-sub">
                  <Droplets size={10} /> {h.precipitationProbability}%
                </div>
              ) : (
                <div className="mt-2 h-3" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
