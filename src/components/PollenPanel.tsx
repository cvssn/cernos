"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flower2, CalendarDays, AlertTriangle } from "lucide-react";
import type { PollenDailyEntry, PollenLevels } from "@/lib/types";

type Props = { pollen: PollenLevels | undefined };

const TYPES: Array<{ key: keyof Omit<PollenLevels, "daily">; label: string }> = [
  { key: "grass", label: "grass" },
  { key: "birch", label: "birch" },
  { key: "alder", label: "alder" },
  { key: "olive", label: "olive" },
  { key: "ragweed", label: "ragweed" },
  { key: "mugwort", label: "mugwort" },
];

export default function PollenPanel({ pollen }: Props) {
  const [view, setView] = useState<"now" | "week">("now");

  const entries = useMemo(() => {
    if (!pollen) return [];
    return TYPES.map((t) => ({
      label: t.label,
      key: t.key,
      value: pollen[t.key],
      bucket: bucketFor(pollen[t.key]),
    }));
  }, [pollen]);

  const reported = entries.filter((e) => e.value != null);
  const daily = pollen?.daily ?? [];

  const peakNow = useMemo(() => {
    return reported.reduce<{ label: string; bucket: PollenBucket } | null>(
      (acc, e) => {
        if (!acc || e.bucket.rank > acc.bucket.rank) {
          return { label: e.label, bucket: e.bucket };
        }
        return acc;
      },
      null
    );
  }, [reported]);

  const weekPeak = useMemo(() => {
    if (!daily.length) return null;
    let best: {
      label: string;
      bucket: PollenBucket;
      date: string;
      value: number;
    } | null = null;
    for (const d of daily) {
      for (const t of TYPES) {
        const v = d[t.key];
        if (typeof v !== "number") continue;
        const bucket = bucketFor(v);
        if (!best || bucket.rank > best.bucket.rank) {
          best = { label: t.label, bucket, date: d.date, value: v };
        }
      }
    }
    return best;
  }, [daily]);

  const reportedTypes = useMemo(() => {
    if (!daily.length) return [];
    return TYPES.filter((t) =>
      daily.some((d) => typeof d[t.key] === "number" && (d[t.key] ?? 0) > 0)
    );
  }, [daily]);

  if (!pollen || (reported.length === 0 && daily.length === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="glass p-4 min-w-0"
    >
      <div className="flex items-center justify-between text-sub text-[10px] uppercase tracking-wider mb-3 gap-2">
        <div className="flex items-center gap-1.5">
          <Flower2 size={14} className="accent" />
          <span>pollen</span>
        </div>
        <div className="flex items-center gap-2">
          {view === "now" && peakNow && (
            <span
              className="text-[10px] normal-case tracking-normal px-2 py-0.5 rounded-full"
              style={{
                background: `color-mix(in srgb, ${peakNow.bucket.color} 22%, transparent)`,
                color: peakNow.bucket.color,
              }}
            >
              {peakNow.bucket.label} · {peakNow.label}
            </span>
          )}
          {daily.length > 0 && (
            <div className="flex rounded-full overflow-hidden border border-[var(--border)]">
              <button
                onClick={() => setView("now")}
                className={`text-[10px] normal-case tracking-normal px-2 py-0.5 transition ${
                  view === "now"
                    ? "bg-[var(--accent)]/20 text-main"
                    : "text-sub hover:text-main"
                }`}
                aria-pressed={view === "now"}
              >
                now
              </button>
              <button
                onClick={() => setView("week")}
                className={`text-[10px] normal-case tracking-normal px-2 py-0.5 transition ${
                  view === "week"
                    ? "bg-[var(--accent)]/20 text-main"
                    : "text-sub hover:text-main"
                }`}
                aria-pressed={view === "week"}
              >
                7-day
              </button>
            </div>
          )}
        </div>
      </div>

      {view === "now" ? (
        <NowView entries={entries} />
      ) : (
        <WeekView
          daily={daily}
          types={reportedTypes}
          weekPeak={weekPeak}
        />
      )}

      <div className="text-sub text-[10px] mt-3">
        grains/m³ · open-meteo (europe coverage)
      </div>
    </motion.div>
  );
}

function NowView({
  entries,
}: {
  entries: Array<{ label: string; value: number | null; bucket: PollenBucket }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {entries.map((e) => (
        <div key={e.label} className="flex items-center gap-3 min-w-0">
          <div className="text-sub text-[11px] w-16 shrink-0">{e.label}</div>
          <div className="relative flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300"
              style={{
                width: `${e.bucket.fill}%`,
                background: e.bucket.color,
                opacity: e.value == null ? 0 : 1,
              }}
            />
          </div>
          <div
            className="text-[11px] w-20 text-right shrink-0"
            style={{
              color: e.value == null ? "var(--subtext)" : e.bucket.color,
            }}
          >
            {e.value == null ? "—" : e.bucket.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function WeekView({
  daily,
  types,
  weekPeak,
}: {
  daily: PollenDailyEntry[];
  types: Array<{ key: keyof Omit<PollenLevels, "daily">; label: string }>;
  weekPeak: {
    label: string;
    bucket: PollenBucket;
    date: string;
    value: number;
  } | null;
}) {
  if (!daily.length) {
    return (
      <div className="text-sub text-xs flex items-center gap-2">
        <CalendarDays size={12} /> no 7-day pollen data here
      </div>
    );
  }

  if (!types.length) {
    return (
      <div className="text-sub text-xs">
        all pollen counts at zero this week.
      </div>
    );
  }

  const todayKey = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      {weekPeak && weekPeak.bucket.rank >= 2 && (
        <div
          className="flex items-center gap-2 text-[11px] rounded-md px-2.5 py-1.5"
          style={{
            background: `color-mix(in srgb, ${weekPeak.bucket.color} 18%, transparent)`,
            color: weekPeak.bucket.color,
          }}
        >
          <AlertTriangle size={12} />
          <span>
            week peak: <strong>{weekPeak.bucket.label}</strong> {weekPeak.label}{" "}
            <span style={{ opacity: 0.75 }}>
              · {formatDayLabel(weekPeak.date, todayKey)}
            </span>
          </span>
        </div>
      )}

      <div className="overflow-x-auto -mx-1 px-1">
        <div
          className="grid gap-x-1 gap-y-1 min-w-[280px]"
          style={{
            gridTemplateColumns: `minmax(56px, max-content) repeat(${daily.length}, minmax(28px, 1fr))`,
          }}
        >
          <div />
          {daily.map((d) => (
            <div
              key={`hd-${d.date}`}
              className={`text-center text-[10px] uppercase tracking-wider ${
                d.date === todayKey ? "text-main" : "text-sub"
              }`}
            >
              {formatWeekday(d.date, todayKey)}
            </div>
          ))}

          {types.map((t) => (
            <PollenRow
              key={t.key}
              label={t.label}
              dataKey={t.key}
              daily={daily}
              todayKey={todayKey}
            />
          ))}
        </div>
      </div>

      <Legend />
    </div>
  );
}

function PollenRow({
  label,
  dataKey,
  daily,
  todayKey,
}: {
  label: string;
  dataKey: keyof Omit<PollenLevels, "daily">;
  daily: PollenDailyEntry[];
  todayKey: string;
}) {
  return (
    <>
      <div className="text-sub text-[11px] flex items-center pr-2">
        {label}
      </div>
      {daily.map((d) => {
        const v = d[dataKey];
        const bucket = bucketFor(typeof v === "number" ? v : null);
        const isToday = d.date === todayKey;
        const title =
          v == null
            ? `${label} · ${formatDayLabel(d.date, todayKey)} · n/a`
            : `${label} · ${formatDayLabel(d.date, todayKey)} · ${bucket.label} (${Math.round(
                v
              )} grains/m³)`;
        return (
          <div
            key={`${dataKey}-${d.date}`}
            title={title}
            aria-label={title}
            className={`h-7 rounded-md transition relative ${
              isToday ? "ring-1 ring-[var(--accent)]" : ""
            }`}
            style={{
              background: v == null ? "var(--border)" : bucket.color,
              opacity: v == null ? 0.35 : Math.max(0.45, bucket.fill / 100),
            }}
          />
        );
      })}
    </>
  );
}

function Legend() {
  const items: Array<{ label: string; color: string }> = [
    { label: "none", color: "#86efac" },
    { label: "low", color: "#a3e635" },
    { label: "mod", color: "#fbbf24" },
    { label: "high", color: "#fb923c" },
    { label: "v.high", color: "#ef4444" },
  ];
  return (
    <div className="flex items-center justify-end gap-2 text-[10px] text-sub flex-wrap">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ background: i.color }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function formatWeekday(date: string, todayKey: string): string {
  if (date === todayKey) return "today";
  try {
    const d = new Date(date + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short" }).toLowerCase();
  } catch {
    return date.slice(5);
  }
}

function formatDayLabel(date: string, todayKey: string): string {
  if (date === todayKey) return "today";
  try {
    const d = new Date(date + "T00:00:00");
    return d
      .toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
      .toLowerCase();
  } catch {
    return date;
  }
}

type PollenBucket = {
  rank: number;
  label: string;
  color: string;
  fill: number;
};

function bucketFor(v: number | null): PollenBucket {
  if (v == null) return { rank: -1, label: "—", color: "var(--subtext)", fill: 0 };
  if (v < 1) return { rank: 0, label: "none", color: "#86efac", fill: 6 };
  if (v < 20) return { rank: 1, label: "low", color: "#a3e635", fill: 25 };
  if (v < 50) return { rank: 2, label: "moderate", color: "#fbbf24", fill: 50 };
  if (v < 100) return { rank: 3, label: "high", color: "#fb923c", fill: 75 };
  return { rank: 4, label: "very high", color: "#ef4444", fill: 100 };
}
