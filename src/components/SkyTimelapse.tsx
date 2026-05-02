"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { DailyEntry, Snapshot } from "@/lib/types";
import { themeForCondition } from "@/lib/weather-codes";
import { paletteFor } from "@/lib/weather-themes";

type Props = {
  hourly: Snapshot[];
  nowIndex: number;
  daily: DailyEntry[];
};

const LOOP_MS = 12_000;
const FRAMES = 24;

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefers(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return prefers;
}

function minutesOfDay(iso: string): number {
  if (!iso || iso.length < 16) return 0;
  const [h, m] = iso.slice(11, 16).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export default function SkyTimelapse({ hourly, nowIndex, daily }: Props) {
  const window24 = useMemo(
    () => hourly.slice(nowIndex, nowIndex + FRAMES + 1),
    [hourly, nowIndex]
  );

  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setT(0);
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      setT((elapsed % LOOP_MS) / LOOP_MS);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      startRef.current = null;
    };
  }, [reduced]);

  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 70,
        r: 0.35 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 2.5,
      })),
    []
  );

  if (window24.length < 2) return null;

  const idx = t * (window24.length - 1);
  const i = Math.min(Math.floor(idx), window24.length - 2);
  const frac = idx - i;
  const cur = window24[i];
  const nxt = window24[i + 1];

  const palCur = paletteFor(themeForCondition(cur.weatherCode, cur.isDay));
  const palNxt = paletteFor(themeForCondition(nxt.weatherCode, nxt.isDay));

  const dayEntry = daily.find((d) => d.date === cur.time.slice(0, 10));
  const nextDayEntry = daily.find((d) => d.date === nxt.time.slice(0, 10));

  let arcFrac = 0.5;
  const m = minutesOfDay(cur.time) + frac * 60;
  if (cur.isDay && dayEntry) {
    const sr = minutesOfDay(dayEntry.sunrise);
    const ss = minutesOfDay(dayEntry.sunset);
    if (ss > sr) arcFrac = (m - sr) / (ss - sr);
  } else if (!cur.isDay && dayEntry) {
    const sr = minutesOfDay(dayEntry.sunrise);
    const ss = minutesOfDay(dayEntry.sunset);
    if (m < sr) {
      const ssYest = ss - 24 * 60;
      arcFrac = (m - ssYest) / (sr - ssYest);
    } else if (m > ss) {
      const srNext =
        (nextDayEntry ? minutesOfDay(nextDayEntry.sunrise) : sr) + 24 * 60;
      arcFrac = (m - ss) / (srNext - ss);
    }
  }
  arcFrac = clamp01(arcFrac);

  const angle = Math.PI * arcFrac;
  const bodyXPct = 8 + 84 * arcFrac;
  const bodyYPct = 80 - 60 * Math.sin(angle);

  const orbOpacity = Math.max(0.05, Math.sin(angle));
  const nightness =
    (1 - frac) * (cur.isDay ? 0 : 1) + frac * (nxt.isDay ? 0 : 1);
  const isSun = cur.isDay;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative w-full h-32 md:h-40 lg:h-44 overflow-hidden rounded-2xl border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      aria-label="24-hour sky timelapse"
    >
      <div
        className="absolute inset-0"
        style={{ background: palCur.gradient, opacity: 1 - frac }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{ background: palNxt.gradient, opacity: frac }}
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
        style={{ opacity: nightness }}
      >
        {stars.map((s, k) => {
          const tw =
            0.55 + 0.45 * Math.sin(t * Math.PI * 2 * s.speed + s.phase);
          return (
            <circle
              key={k}
              cx={s.x}
              cy={s.y}
              r={s.r * 0.4}
              fill="white"
              opacity={tw}
            />
          );
        })}
      </svg>

      <div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          left: `${bodyXPct}%`,
          top: `${bodyYPct}%`,
          transform: "translate(-50%, -50%)",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: isSun
            ? "radial-gradient(circle, rgba(254,243,199,0.55) 0%, rgba(251,191,36,0.25) 35%, transparent 70%)"
            : "radial-gradient(circle, rgba(196,181,253,0.35) 0%, transparent 65%)",
          opacity: orbOpacity * 0.9,
          filter: "blur(10px)",
        }}
      />

      <div
        className="absolute"
        aria-hidden="true"
        style={{
          left: `${bodyXPct}%`,
          top: `${bodyYPct}%`,
          transform: "translate(-50%, -50%)",
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          background: isSun
            ? "radial-gradient(circle, #fef3c7 0%, #fbbf24 60%, transparent 100%)"
            : "radial-gradient(circle at 35% 35%, #f1f5f9 0%, #cbd5e1 70%, #94a3b8 100%)",
          boxShadow: isSun
            ? "0 0 40px rgba(251,191,36,0.85), 0 0 90px rgba(253,230,138,0.5)"
            : "0 0 35px rgba(196,181,253,0.5)",
          opacity: orbOpacity,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </motion.div>
  );
}
