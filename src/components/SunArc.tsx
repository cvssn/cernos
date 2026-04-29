"use client";

import { motion } from "framer-motion";
import { Moon, Sunrise, Sunset } from "lucide-react";
import type { DailyEntry } from "@/lib/types";

type Props = {
  day: DailyEntry | undefined;
  nowTime: string;
};

export default function SunArc({ day, nowTime }: Props) {
  if (!day) return null;

  const sunriseMin = minutesOfDay(day.sunrise);
  const sunsetMin = minutesOfDay(day.sunset);
  const nowMin = minutesOfDay(nowTime);

  const dayLength = sunsetMin - sunriseMin;
  const isDay = nowMin >= sunriseMin && nowMin <= sunsetMin;
  const frac = dayLength > 0
    ? clamp((nowMin - sunriseMin) / dayLength, 0, 1)
    : 0.5;

  // Arc geometry: ellipse from (20, 100) to (220, 100), peaking at (120, 20).
  // Semi-major rx=100, semi-minor ry=80, center (120, 100).
  const angle = Math.PI * frac; // 0 = sunrise, π = sunset
  const sunX = 120 - 100 * Math.cos(angle);
  const sunY = 100 - 80 * Math.sin(angle);

  const sunrise = formatTime(day.sunrise);
  const sunset = formatTime(day.sunset);
  const dayHours = Math.floor(dayLength / 60);
  const dayMinutes = dayLength % 60;
  const dayLengthLabel = `${dayHours}h ${dayMinutes}m`;

  let centerLabel: string;
  if (isDay) {
    const remainingMin = sunsetMin - nowMin;
    const rh = Math.floor(remainingMin / 60);
    const rm = remainingMin % 60;
    centerLabel = remainingMin > 0
      ? `${rh}h ${rm}m of daylight left`
      : "Sunset";
  } else if (nowMin < sunriseMin) {
    const untilMin = sunriseMin - nowMin;
    const uh = Math.floor(untilMin / 60);
    const um = untilMin % 60;
    centerLabel = `Sunrise in ${uh}h ${um}m`;
  } else {
    const sinceMin = nowMin - sunsetMin;
    const sh = Math.floor(sinceMin / 60);
    const sm = sinceMin % 60;
    centerLabel = `Night · ${sh}h ${sm}m past sunset`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="glass p-4 min-w-0"
    >
      <div className="flex items-center justify-between text-sub text-[10px] uppercase tracking-wider mb-2">
        <span>Sun</span>
        <span className="text-sub text-[11px] normal-case tracking-normal">
          {dayLengthLabel} of daylight
        </span>
      </div>
      <div className="relative w-full">
        <svg
          viewBox="0 0 240 116"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto block"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="sun-arc-track" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.05" />
              <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="sun-arc-progress" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
            </linearGradient>
          </defs>
          <line
            x1="10"
            y1="100"
            x2="230"
            y2="100"
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
          <path
            d="M 20 100 A 100 80 0 0 1 220 100"
            fill="none"
            stroke="url(#sun-arc-track)"
            strokeWidth="2"
          />
          {isDay && (
            <path
              d={arcPath(frac)}
              fill="none"
              stroke="url(#sun-arc-progress)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}
          <circle
            cx="20"
            cy="100"
            r="3"
            fill="var(--border)"
          />
          <circle
            cx="220"
            cy="100"
            r="3"
            fill="var(--border)"
          />
          {isDay ? (
            <g transform={`translate(${sunX}, ${sunY})`}>
              <circle r="14" fill="var(--accent)" opacity="0.18" />
              <circle r="9" fill="var(--accent)" opacity="0.35" />
              <circle r="5" fill="var(--accent)" />
            </g>
          ) : (
            <g transform={`translate(${nowMin < sunriseMin ? 20 : 220}, 100)`}>
              <circle r="5" fill="var(--subtext)" opacity="0.6" />
            </g>
          )}
        </svg>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 text-sub text-[11px]">
          <Sunrise size={14} className="accent" />
          <span className="text-main font-medium">{sunrise}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sub text-[11px]">
          {isDay ? null : <Moon size={12} className="text-sub" />}
          <span className="truncate max-w-[160px] text-center">{centerLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sub text-[11px]">
          <span className="text-main font-medium">{sunset}</span>
          <Sunset size={14} className="accent" />
        </div>
      </div>
    </motion.div>
  );
}

function arcPath(frac: number): string {
  const angle = Math.PI * clamp(frac, 0, 1);
  const x = 120 - 100 * Math.cos(angle);
  const y = 100 - 80 * Math.sin(angle);
  // large-arc-flag = 0 (frac always <= 1, so always minor arc)
  return `M 20 100 A 100 80 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;
}

function minutesOfDay(iso: string): number {
  if (!iso) return 0;
  const t = iso.length >= 16 ? iso.slice(11, 16) : "00:00";
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
