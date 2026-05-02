"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";
import type { StoredJournalEntry } from "@/lib/db";

type Props = {
  entries: StoredJournalEntry[];
  todayDate: string | null;
};

export default function SkyJournal({ entries, todayDate }: Props) {
  const today = todayDate
    ? entries.find((e) => e.date === todayDate)
    : undefined;
  const past = entries.filter((e) => e.date !== todayDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass p-4 min-w-0"
    >
      <div className="flex items-center justify-between text-sub text-[10px] uppercase tracking-wider mb-3">
        <div className="flex items-center gap-1.5">
          <BookOpen size={14} className="accent" />
          <span>sky journal</span>
        </div>
        <span className="text-[10px] normal-case tracking-normal text-sub">
          {entries.length} {entries.length === 1 ? "day" : "days"}
        </span>
      </div>

      {today && (
        <div
          className="rounded-xl p-3 mb-3 border"
          style={{
            background:
              "color-mix(in srgb, var(--accent) 10%, transparent)",
            borderColor:
              "color-mix(in srgb, var(--accent) 35%, transparent)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="accent">
              <WeatherIcon
                code={today.weatherCode}
                isDay={today.isDay}
                size={16}
              />
            </span>
            <span className="text-[10px] uppercase tracking-wider text-sub">
              today · {formatDateShort(today.date)}
            </span>
          </div>
          <p className="text-main text-sm leading-snug">{today.text}</p>
          <div className="text-sub text-[11px] mt-1.5">
            {today.tempMax}° / {today.tempMin}° · {today.place}
          </div>
        </div>
      )}

      {past.length === 0 && !today && (
        <p className="text-sub text-xs leading-relaxed">
          your year-in-skies starts here. a line a day, growing into a small
          weather autobiography.
        </p>
      )}

      {past.length === 0 && today && (
        <p className="text-sub text-xs leading-relaxed">
          come back tomorrow — the journal grows one line at a time.
        </p>
      )}

      {past.length > 0 && (
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 -mr-1">
          {past.map((entry) => (
            <div
              key={entry.date}
              className="flex gap-2.5 py-1.5 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="accent shrink-0 mt-0.5">
                <WeatherIcon
                  code={entry.weatherCode}
                  isDay={entry.isDay}
                  size={14}
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sub text-[10px] uppercase tracking-wider">
                    {formatDateShort(entry.date)}
                  </span>
                  <span className="text-sub text-[10px]">
                    {entry.tempMax}° / {entry.tempMin}°
                  </span>
                </div>
                <p className="text-main text-[12px] leading-snug">
                  {entry.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function formatDateShort(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
