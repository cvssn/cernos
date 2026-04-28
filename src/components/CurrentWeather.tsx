"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, HeartOff, History } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { describeWeather } from "@/lib/weather-codes";
import type { Snapshot, WeatherPayload } from "@/lib/types";

type Props = {
  weather: WeatherPayload;
  snapshot: Snapshot;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  scrubbing: boolean;
};

export default function CurrentWeather({
  weather,
  snapshot,
  isFavorite,
  onToggleFavorite,
  scrubbing,
}: Props) {
  const cond = describeWeather(snapshot.weatherCode);
  const place = weather.place;
  const dKey = snapshot.time.slice(0, 10);
  const day = weather.daily.find((d) => d.date === dKey) ?? weather.daily[0];

  const date = new Date(snapshot.time);
  const todayKey = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const dayLabel =
    dKey === todayKey
      ? "Today"
      : dKey === tomorrowKey
      ? "Tomorrow"
      : date.toLocaleDateString(undefined, { weekday: "long" });
  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-strong p-6 md:p-8 relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sub text-sm font-medium uppercase tracking-wider">
            {[place.admin1, place.country].filter(Boolean).join(" · ")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-main mt-1">{place.name}</h1>
          <div className="text-sub text-sm mt-1 flex items-center gap-2">
            {scrubbing ? (
              <span className="inline-flex items-center gap-1 accent">
                <History size={12} /> {dayLabel} · {timeLabel}
              </span>
            ) : (
              <span>Local time {timeLabel}</span>
            )}
          </div>
        </div>
        <button
          onClick={onToggleFavorite}
          className="glass px-3 py-2 flex items-center gap-2 text-sm hover:scale-[1.03] active:scale-[0.97] transition"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {isFavorite ? (
            <>
              <Heart size={16} fill="currentColor" /> Saved
            </>
          ) : (
            <>
              <HeartOff size={16} /> Save
            </>
          )}
        </button>
      </div>

      <div className="mt-6 md:mt-8 grid grid-cols-1 md:grid-cols-[1fr,auto] items-center gap-6">
        <div className="flex items-end gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${snapshot.weatherCode}-${snapshot.isDay ? "d" : "n"}`}
              initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 14 }}
              className="float accent"
              style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25))" }}
            >
              <WeatherIcon
                code={snapshot.weatherCode}
                isDay={snapshot.isDay}
                size={120}
                strokeWidth={1.2}
              />
            </motion.div>
          </AnimatePresence>
          <div className="leading-none">
            <div className="flex items-start gap-1">
              <motion.span
                key={Math.round(snapshot.temperature)}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="text-7xl md:text-8xl font-extralight tracking-tight text-main"
              >
                {Math.round(snapshot.temperature)}
              </motion.span>
              <span className="text-3xl text-sub mt-3">°C</span>
            </div>
            <div className="text-main text-lg md:text-xl mt-2">{cond.label}</div>
            <div className="text-sub text-sm mt-1">
              Feels like {Math.round(snapshot.apparentTemperature)}°
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4 md:min-w-[280px]">
          <Stat label="High" value={`${Math.round(day?.temperatureMax ?? snapshot.temperature)}°`} />
          <Stat label="Low" value={`${Math.round(day?.temperatureMin ?? snapshot.temperature)}°`} />
          <Stat label="Rain" value={`${Math.round(snapshot.precipitationProbability)}%`} />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass px-3 py-3 text-center">
      <div className="text-xs text-sub uppercase tracking-wider">{label}</div>
      <div className="text-main text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
