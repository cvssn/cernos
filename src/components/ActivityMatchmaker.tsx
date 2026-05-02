"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Bike,
  Footprints,
  Apple,
  Waves,
  Flower2,
  Camera,
  Landmark,
  Coffee,
  BookOpen,
  Film,
  ChefHat,
  Stars,
  ListChecks,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { WeatherPayload } from "@/lib/types";

type Confidence = "high" | "medium" | "low";

type Suggestion = {
  kind: string;
  title: string;
  confidence: Confidence;
  reason: string;
};

type Props = {
  weather: WeatherPayload | null;
  scrubbing: boolean;
};

const ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  run: Activity,
  bike: Bike,
  walk: Footprints,
  picnic: Apple,
  beach: Waves,
  garden: Flower2,
  photo: Camera,
  museum: Landmark,
  cafe: Coffee,
  read: BookOpen,
  movie: Film,
  cook: ChefHat,
  stargaze: Stars,
  errand: ListChecks,
};

function chipClasses(c: Confidence): string {
  if (c === "high")
    return "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40";
  if (c === "medium")
    return "bg-amber-500/20 text-amber-200 border border-amber-400/40";
  return "bg-rose-500/20 text-rose-200 border border-rose-400/40";
}

export default function ActivityMatchmaker({ weather, scrubbing }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"claude" | "heuristic" | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!weather || scrubbing) return;
    const key = `${weather.place.latitude},${weather.place.longitude},${weather.current.time}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    ctrl.current?.abort();
    ctrl.current = new AbortController();
    setLoading(true);

    fetch("/api/activity-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weather }),
      signal: ctrl.current.signal,
    })
      .then((r) => r.json())
      .then((d: { suggestions?: Suggestion[]; source?: "claude" | "heuristic" }) => {
        setSuggestions(d.suggestions ?? null);
        setSource(d.source ?? "heuristic");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [weather, scrubbing]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass-strong p-5 md:p-6"
    >
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="accent shrink-0">
            <Sparkles size={16} />
          </span>
          <h2 className="text-main font-semibold truncate">
            next 4 hours
          </h2>
        </div>
        <span className="text-sub text-xs uppercase tracking-wider shrink-0">
          {scrubbing ? "live only" : source === "claude" ? "claude" : "smart"}
        </span>
      </div>

      {scrubbing ? (
        <div className="text-sub text-sm">
          activity ideas appear when viewing now
        </div>
      ) : loading || !suggestions ? (
        <div className="space-y-3">
          <div className="h-12 rounded-md shimmer" />
          <div className="h-12 rounded-md shimmer w-[92%]" />
          <div className="h-12 rounded-md shimmer w-[85%]" />
          {loading && (
            <div className="text-sub text-xs flex items-center gap-2 mt-2">
              <Loader2 size={12} className="animate-spin" /> matchmaking…
            </div>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.ul
            key={lastKey.current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2.5"
          >
            {suggestions.map((s, i) => {
              const Icon = ICON[s.kind] ?? Sparkles;
              return (
                <motion.li
                  key={`${s.kind}-${i}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass p-3 flex items-start gap-3"
                >
                  <span className="accent shrink-0 mt-0.5">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-main text-sm font-medium">
                        {s.title}
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ${chipClasses(s.confidence)}`}
                      >
                        {s.confidence}
                      </span>
                    </div>
                    <div className="text-sub text-xs mt-0.5 leading-snug">
                      {s.reason}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
