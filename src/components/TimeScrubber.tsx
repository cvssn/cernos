"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, RotateCcw } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import { describeWeather } from "@/lib/weather-codes";
import type { Snapshot } from "@/lib/types";

type Props = {
  hourly: Snapshot[];
  index: number;
  nowIndex: number;
  onChange: (i: number) => void;
  onScrubStateChange?: (scrubbing: boolean) => void;
};

const TRACK_W = 1000;
const TRACK_H = 80;

export default function TimeScrubber({
  hourly,
  index,
  nowIndex,
  onChange,
  onScrubStateChange,
}: Props) {
  const max = hourly.length - 1;
  const safeIndex = Math.min(Math.max(index, 0), max);
  const snapshot = hourly[safeIndex];

  const draggingRef = useRef(false);

  const dayBoundaries = useMemo(() => {
    const out: { i: number; label: string; isToday: boolean }[] = [];
    let lastDate = "";
    const todayKey = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < hourly.length; i++) {
      const dKey = hourly[i].time.slice(0, 10);
      if (dKey !== lastDate) {
        const date = new Date(hourly[i].time);
        const label =
          dKey === todayKey
            ? "Today"
            : date.toLocaleDateString(undefined, { weekday: "short" });
        out.push({ i, label, isToday: dKey === todayKey });
        lastDate = dKey;
      }
    }
    return out;
  }, [hourly]);

  const sparkline = useMemo(() => {
    if (hourly.length < 2) return "";
    const temps = hourly.map((h) => h.temperature);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const range = Math.max(1, max - min);
    const padTop = 20;
    const padBottom = 14;
    const usableH = TRACK_H - padTop - padBottom;
    const stepX = TRACK_W / (hourly.length - 1);
    return hourly
      .map((h, i) => {
        const x = i * stepX;
        const y = padTop + (1 - (h.temperature - min) / range) * usableH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [hourly]);

  const sparkArea = useMemo(() => {
    if (!sparkline) return "";
    return `${sparkline} L${TRACK_W},${TRACK_H} L0,${TRACK_H} Z`;
  }, [sparkline]);

  const handlePct = max === 0 ? 0 : (safeIndex / max) * 100;
  const nowPct = max === 0 ? 0 : (nowIndex / max) * 100;

  const cond = describeWeather(snapshot.weatherCode);
  const date = new Date(snapshot.time);
  const todayKey = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = tomorrow.toISOString().slice(0, 10);
  const dKey = snapshot.time.slice(0, 10);
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

  const setDragging = (on: boolean) => {
    if (draggingRef.current === on) return;
    draggingRef.current = on;
    onScrubStateChange?.(on);
  };

  const isAtNow = safeIndex === nowIndex;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="glass-strong p-4 md:p-5"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-sub text-xs uppercase tracking-wider">
          <span className="accent">
            <Clock size={14} />
          </span>
          Time travel
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="accent shrink-0">
            <WeatherIcon code={snapshot.weatherCode} isDay={snapshot.isDay} size={20} />
          </span>
          <div className="flex flex-col items-end leading-tight min-w-0">
            <div className="text-main text-sm font-semibold truncate">
              {dayLabel} · {timeLabel}
            </div>
            <div className="text-sub text-[11px] truncate">
              {Math.round(snapshot.temperature)}° · {cond.short}
            </div>
          </div>
        </div>
        <button
          onClick={() => onChange(nowIndex)}
          disabled={isAtNow}
          className="glass shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-xs hover:scale-[1.04] active:scale-[0.96] transition disabled:opacity-50 disabled:hover:scale-100"
          aria-label="Reset to now"
        >
          <RotateCcw size={12} />
          Now
        </button>
      </div>

      <div
        className="relative w-full select-none"
        style={{ height: TRACK_H }}
      >
        <svg
          viewBox={`0 0 ${TRACK_W} ${TRACK_H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full rounded-xl overflow-hidden"
          style={{ background: "rgba(0, 0, 0, 0.18)" }}
        >
          <defs>
            <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* day/night vertical bars */}
          {hourly.map((h, i) => (
            <rect
              key={i}
              x={(i / hourly.length) * TRACK_W}
              y={0}
              width={TRACK_W / hourly.length + 0.5}
              height={TRACK_H}
              fill={h.isDay ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.22)"}
            />
          ))}
          {/* day boundary lines */}
          {dayBoundaries.slice(1).map((b) => (
            <line
              key={b.i}
              x1={(b.i / max) * TRACK_W}
              x2={(b.i / max) * TRACK_W}
              y1={0}
              y2={TRACK_H}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={1}
            />
          ))}
          {/* temperature sparkline filled area */}
          {sparkArea && <path d={sparkArea} fill="url(#sparkFill)" />}
          {sparkline && (
            <path
              d={sparkline}
              stroke="var(--accent)"
              strokeWidth={1.5}
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {/* now marker */}
          <line
            x1={(nowIndex / max) * TRACK_W}
            x2={(nowIndex / max) * TRACK_W}
            y1={0}
            y2={TRACK_H}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={1}
            strokeDasharray="3,3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* scrub handle */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: `${handlePct}%`,
            transform: "translateX(-50%)",
            transition: draggingRef.current ? "none" : "left 0.18s ease-out",
          }}
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-white/80" />
          <div
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3 rounded-full bg-white border-2 ring-accent"
            style={{ borderColor: "var(--accent)" }}
          />
          <div
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 rounded-full bg-white border-2"
            style={{ borderColor: "var(--accent)" }}
          />
        </div>

        {/* now label */}
        <div
          className="absolute -top-1 text-[10px] text-sub uppercase tracking-wider pointer-events-none"
          style={{ left: `${nowPct}%`, transform: "translateX(-50%) translateY(-100%)" }}
        >
          now
        </div>

        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={safeIndex}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onBlur={() => setDragging(false)}
          aria-label="Scrub through forecast"
          className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
        />
      </div>

      <div
        className="relative mt-2 h-4 text-[11px] text-sub"
        aria-hidden="true"
      >
        {dayBoundaries.map((b) => (
          <span
            key={b.i}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${(b.i / max) * 100}%` }}
          >
            {b.label}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
