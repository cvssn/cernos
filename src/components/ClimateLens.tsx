"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Thermometer, X } from "lucide-react";
import type { ClimateLensPayload } from "@/app/api/climate-lens/route";

type Props = {
  enabled: boolean;
  latitude: number;
  longitude: number;
  timezone?: string;
  onClose: () => void;
};

export default function ClimateLens({
  enabled,
  latitude,
  longitude,
  timezone,
  onClose,
}: Props) {
  const [data, setData] = useState<ClimateLensPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    const url = new URL("/api/climate-lens", window.location.origin);
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    if (timezone) url.searchParams.set("timezone", timezone);
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error("Climate baseline unavailable");
        return (await r.json()) as ClimateLensPayload;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Climate baseline unavailable"
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, latitude, longitude, timezone]);

  return (
    <AnimatePresence>
      {enabled && (
        <motion.div
          key="climate-lens"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
          className="glass-strong p-5"
          aria-live="polite"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl p-2 bg-white/8 border border-[var(--border)] shrink-0">
              <Thermometer
                size={18}
                className="accent"
                strokeWidth={1.6}
              />
            </div>
            <div className="flex-1 min-w-0">
              {loading && (
                <div className="text-sub text-sm animate-pulse">
                  looking back to the 1990s…
                </div>
              )}
              {error && !loading && (
                <div className="text-sub text-sm">{error}</div>
              )}
              {data && !loading && <ClimateDelta data={data} />}
            </div>
            <button
              onClick={onClose}
              className="text-sub hover:text-main transition shrink-0"
              aria-label="Close climate lens"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ClimateDelta({ data }: { data: ClimateLensPayload }) {
  const sign = data.delta >= 0 ? "+" : "−";
  const abs = Math.abs(data.delta);
  const direction =
    data.delta >= 0.05
      ? "above"
      : data.delta <= -0.05
      ? "below"
      : "on";

  // Restrained, on-brand color shift — warm for warming, cool for cooling.
  const colorClass =
    data.delta >= 0.5
      ? "text-rose-300"
      : data.delta <= -0.5
      ? "text-sky-300"
      : "text-main";

  const phrase =
    direction === "on"
      ? `Right on the 1990s average for ${data.dateLabel}.`
      : `${capitalize(direction)} the 1990s average for ${data.dateLabel}.`;

  return (
    <div>
      <div
        className={`font-semibold leading-none tracking-tight tabular-nums text-3xl md:text-4xl ${colorClass}`}
      >
        {sign}
        {abs.toFixed(1)}°C
      </div>
      <div className="text-main text-sm md:text-base mt-2 leading-snug">
        {phrase}
      </div>
      <div className="text-sub text-[11px] uppercase tracking-wider mt-1">
        era5 daily-mean baseline · {data.baselineYears.from}–
        {data.baselineYears.to} · {data.baselineSampleCount} samples
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
