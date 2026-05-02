"use client";

import { motion } from "framer-motion";
import { WeatherIcon } from "./WeatherIcon";
import type { Snapshot } from "@/lib/types";
import { Droplets } from "lucide-react";

type Props = {
  hourly: Snapshot[];
  nowIndex: number;
  scrubIndex: number;
  onPickHour: (i: number) => void;
};

export default function HourlyForecast({ hourly, nowIndex, scrubIndex, onPickHour }: Props) {
  const start = nowIndex;
  const end = Math.min(nowIndex + 24, hourly.length);
  const window = hourly.slice(start, end);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-strong p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-main font-semibold">next 24 hours</h2>
        <span className="text-sub text-xs uppercase tracking-wider">hourly</span>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
        {window.map((h, i) => {
          const absIndex = start + i;
          const date = new Date(h.time);
          const label =
            i === 0
              ? "Now"
              : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
          const isSelected = absIndex === scrubIndex;
          return (
            <button
              key={h.time}
              onClick={() => onPickHour(absIndex)}
              className={`min-w-[90px] flex flex-col items-center px-3 py-3 text-center transition glass ${
                isSelected ? "ring-accent scale-[1.04]" : "hover:scale-[1.03]"
              }`}
              style={isSelected ? { borderColor: "var(--accent)" } : undefined}
              aria-pressed={isSelected}
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
                  <Droplets size={10} /> {Math.round(h.precipitationProbability)}%
                </div>
              ) : (
                <div className="mt-2 h-3" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
