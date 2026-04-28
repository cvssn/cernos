"use client";

import { motion } from "framer-motion";
import { Heart, HeartOff } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { describeWeather } from "@/lib/weather-codes";
import type { WeatherPayload } from "@/lib/types";

type Props = {
  weather: WeatherPayload;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export default function CurrentWeather({ weather, isFavorite, onToggleFavorite }: Props) {
  const c = weather.current;
  const cond = describeWeather(c.weatherCode);
  const place = weather.place;
  const localTime = new Date(c.time).toLocaleTimeString(undefined, {
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
          <div className="text-sub text-sm mt-1">Local time {localTime}</div>
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
          <motion.div
            key={c.weatherCode}
            initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="float accent"
            style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.25))" }}
          >
            <WeatherIcon code={c.weatherCode} isDay={c.isDay} size={120} strokeWidth={1.2} />
          </motion.div>
          <div className="leading-none">
            <div className="flex items-start gap-1">
              <span className="text-7xl md:text-8xl font-extralight tracking-tight text-main">
                {Math.round(c.temperature)}
              </span>
              <span className="text-3xl text-sub mt-3">°C</span>
            </div>
            <div className="text-main text-lg md:text-xl mt-2">{cond.label}</div>
            <div className="text-sub text-sm mt-1">
              Feels like {Math.round(c.apparentTemperature)}°
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-4 md:min-w-[280px]">
          <Stat label="High" value={`${Math.round(weather.daily[0]?.temperatureMax ?? c.temperature)}°`} />
          <Stat label="Low" value={`${Math.round(weather.daily[0]?.temperatureMin ?? c.temperature)}°`} />
          <Stat label="Rain" value={`${weather.daily[0]?.precipitationProbabilityMax ?? 0}%`} />
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
