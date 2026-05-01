"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Gauge, ArrowDown, ArrowUp, Minus } from "lucide-react";
import {
  summarize,
  tendencyLabel,
  type PressureSummary,
  type Tendency,
} from "@/lib/pressure";
import type {
  PressureHistoryPayload,
  PressureReading,
} from "@/app/api/pressure-history/route";

type Props = {
  latitude: number;
  longitude: number;
  timezone?: string;
};

const SVG_W = 320;
const SVG_H = 72;
const PAD_X = 6;
const PAD_Y = 8;

export default function PressureTendency({
  latitude,
  longitude,
  timezone,
}: Props) {
  const [readings, setReadings] = useState<PressureReading[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReadings(null);
    setError(null);
    const url = new URL("/api/pressure-history", window.location.origin);
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    if (timezone) url.searchParams.set("timezone", timezone);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Pressure feed offline");
        return r.json() as Promise<PressureHistoryPayload>;
      })
      .then((d) => {
        if (cancelled) return;
        setReadings(d.readings ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Pressure feed offline");
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, timezone]);

  const summary = useMemo<PressureSummary | null>(
    () => (readings ? summarize(readings) : null),
    [readings]
  );

  const path = useMemo(() => {
    if (!readings || readings.length < 2) return null;
    return buildPath(readings);
  }, [readings]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="accent shrink-0" size={18} strokeWidth={1.6} />
        <div className="text-main font-medium leading-tight">
          Barometric Pressure
        </div>
        <div className="text-sub text-xs ml-auto uppercase tracking-wider">
          24 h trend
        </div>
      </div>

      {error ? (
        <div className="text-sub text-sm">{error}</div>
      ) : !readings ? (
        <div className="text-sub text-sm animate-pulse">Reading the glass…</div>
      ) : !summary || !path ? (
        <div className="text-sub text-sm">
          Not enough pressure data for this location.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline gap-3">
            <div className="text-main text-2xl font-semibold tabular-nums">
              {summary.current.toFixed(0)}
              <span className="text-sub text-sm font-normal ml-1">hPa</span>
            </div>
            <TrendChip
              tendency={summary.tendency}
              delta3h={summary.delta3h}
            />
          </div>

          <Sparkline path={path} tendency={summary.tendency} />

          <div>
            <div className="text-main text-sm font-medium leading-snug">
              {summary.headline}
            </div>
            <div className="text-sub text-xs mt-1 leading-relaxed">
              {summary.detail}
            </div>
          </div>

          {summary.sensitiveNote && (
            <div className="text-xs leading-relaxed rounded-lg border border-[var(--border)] px-3 py-2 bg-white/5">
              <span className="accent">●</span>{" "}
              <span className="text-sub">{summary.sensitiveNote}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function TrendChip({
  tendency,
  delta3h,
}: {
  tendency: Tendency;
  delta3h: number;
}) {
  const sign = delta3h >= 0 ? "+" : "−";
  const Icon =
    tendency === "steady"
      ? Minus
      : tendency.includes("fall")
      ? ArrowDown
      : ArrowUp;
  const colorClass = tendency.includes("fall")
    ? "text-rose-300"
    : tendency.includes("rise")
    ? "text-emerald-300"
    : "text-sub";
  return (
    <div
      className={`inline-flex items-center gap-1 text-xs ${colorClass}`}
      aria-label={`${tendencyLabel(tendency)}, ${sign}${Math.abs(
        delta3h
      ).toFixed(1)} hPa in 3 hours`}
    >
      <Icon size={14} strokeWidth={2} />
      <span className="tabular-nums">
        {sign}
        {Math.abs(delta3h).toFixed(1)} hPa / 3 h
      </span>
      <span className="text-sub">· {tendencyLabel(tendency)}</span>
    </div>
  );
}

function Sparkline({
  path,
  tendency,
}: {
  path: { line: string; fill: string; lastX: number; lastY: number };
  tendency: Tendency;
}) {
  const stroke = tendency.includes("fall")
    ? "rgba(252, 165, 165, 0.95)"
    : tendency.includes("rise")
    ? "rgba(110, 231, 183, 0.95)"
    : "rgba(248, 250, 252, 0.85)";
  const fill = tendency.includes("fall")
    ? "rgba(252, 165, 165, 0.25)"
    : tendency.includes("rise")
    ? "rgba(110, 231, 183, 0.25)"
    : "rgba(248, 250, 252, 0.18)";
  const id = `pressure-fill-${tendency}`;
  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width="100%"
      height={SVG_H}
      preserveAspectRatio="none"
      className="block"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={path.fill} fill={`url(#${id})`} stroke="none" />
      <path
        d={path.line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={path.lastX}
        cy={path.lastY}
        r={3.2}
        fill={stroke}
        stroke="rgba(255,255,255,0.95)"
        strokeWidth={1.2}
      />
    </svg>
  );
}

function buildPath(readings: PressureReading[]): {
  line: string;
  fill: string;
  lastX: number;
  lastY: number;
} {
  const sorted = [...readings].sort((a, b) =>
    a.time.localeCompare(b.time)
  );
  const values = sorted.map((r) => r.pressure);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.5, max - min);
  const innerW = SVG_W - PAD_X * 2;
  const innerH = SVG_H - PAD_Y * 2;
  const points = sorted.map((r, i) => {
    const x = PAD_X + (i / Math.max(1, sorted.length - 1)) * innerW;
    const y = PAD_Y + (1 - (r.pressure - min) / range) * innerH;
    return { x, y };
  });
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const fill =
    line +
    ` L${points[points.length - 1].x.toFixed(2)} ${SVG_H - 0.5}` +
    ` L${points[0].x.toFixed(2)} ${SVG_H - 0.5} Z`;
  const lastP = points[points.length - 1];
  return { line, fill, lastX: lastP.x, lastY: lastP.y };
}
