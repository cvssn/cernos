"use client";

import { motion } from "framer-motion";
import { Flower2 } from "lucide-react";
import type { PollenLevels } from "@/lib/types";

type Props = { pollen: PollenLevels | undefined };

const TYPES: Array<{ key: keyof PollenLevels; label: string }> = [
  { key: "grass", label: "grass" },
  { key: "birch", label: "birch" },
  { key: "alder", label: "alder" },
  { key: "olive", label: "olive" },
  { key: "ragweed", label: "ragweed" },
  { key: "mugwort", label: "mugwort" },
];

export default function PollenPanel({ pollen }: Props) {
  if (!pollen) return null;

  const entries = TYPES.map((t) => ({
    label: t.label,
    value: pollen[t.key],
    bucket: bucketFor(pollen[t.key]),
  }));

  const reported = entries.filter((e) => e.value != null);
  if (reported.length === 0) return null;

  const peak = reported.reduce<{ label: string; bucket: PollenBucket } | null>(
    (acc, e) => {
      if (!acc || e.bucket.rank > acc.bucket.rank) {
        return { label: e.label, bucket: e.bucket };
      }
      return acc;
    },
    null
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="glass p-4 min-w-0"
    >
      <div className="flex items-center justify-between text-sub text-[10px] uppercase tracking-wider mb-3">
        <div className="flex items-center gap-1.5">
          <Flower2 size={14} className="accent" />
          <span>pollen</span>
        </div>
        {peak && (
          <span
            className="text-[10px] normal-case tracking-normal px-2 py-0.5 rounded-full"
            style={{
              background: `color-mix(in srgb, ${peak.bucket.color} 22%, transparent)`,
              color: peak.bucket.color,
            }}
          >
            {peak.bucket.label} · {peak.label}
          </span>
        )}
      </div>
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
              style={{ color: e.value == null ? "var(--subtext)" : e.bucket.color }}
            >
              {e.value == null ? "—" : e.bucket.label}
            </div>
          </div>
        ))}
      </div>
      <div className="text-sub text-[10px] mt-3">
        grains/m³ · open-meteo (europe coverage)
      </div>
    </motion.div>
  );
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
