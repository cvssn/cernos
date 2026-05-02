"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Loader2,
  X,
  Search,
  MapPin,
  CircleCheck,
  CircleDot,
  Circle,
  AlertCircle,
} from "lucide-react";
import type { Place } from "@/lib/types";
import { WeatherIcon } from "./WeatherIcon";

type Priority = "essential" | "smart" | "optional";

type PackingItem = {
  item: string;
  why: string;
  priority: Priority;
};

type DailyOut = {
  date: string;
  weatherCode: number;
  label: string;
  tMax: number;
  tMin: number;
  precipMm: number;
  precipProb: number;
  windMax: number;
  uvMax: number;
  sunrise: string;
  sunset: string;
};

type Brief = {
  place: Place;
  span: { start: string; end: string; days: number };
  daily: DailyOut[];
  headline: string;
  packing: PackingItem[];
  source: "claude" | "heuristic";
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function plusDaysStr(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function priorityStyle(p: Priority): { color: string; label: string } {
  if (p === "essential") return { color: "bg-emerald-500/20 text-emerald-200 border border-emerald-400/40", label: "essential" };
  if (p === "smart") return { color: "bg-amber-500/20 text-amber-200 border border-amber-400/40", label: "smart" };
  return { color: "bg-white/10 text-sub border border-white/20", label: "optional" };
}

function priorityIcon(p: Priority) {
  if (p === "essential") return <CircleCheck size={14} />;
  if (p === "smart") return <CircleDot size={14} />;
  return <Circle size={14} />;
}

export default function TripBrief({ open, onClose }: Props) {
  const [place, setPlace] = useState<Place | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(plusDaysStr(3));
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const c = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: c.signal,
        });
        const d = await r.json();
        setResults(d.results ?? []);
        setShowResults(true);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      c.abort();
      clearTimeout(t);
    };
  }, [q, open]);

  // reset when closed
  useEffect(() => {
    if (!open) {
      setBrief(null);
      setError(null);
      ctrl.current?.abort();
    }
  }, [open]);

  const submit = async () => {
    setError(null);
    setBrief(null);
    if (!place) {
      setError("Pick a destination first.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Pick a start and end date.");
      return;
    }
    if (startDate > endDate) {
      setError("End date must be after the start date.");
      return;
    }
    ctrl.current?.abort();
    ctrl.current = new AbortController();
    setLoading(true);
    try {
      const r = await fetch("/api/trip-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ place, startDate, endDate }),
        signal: ctrl.current.signal,
      });
      const d = await r.json();
      if (!r.ok) {
        throw new Error(d.message ?? d.error ?? "request_failed");
      }
      setBrief(d as Brief);
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const minDate = todayStr();
  const maxDate = plusDaysStr(16);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="glass-strong w-full max-w-2xl my-auto p-5 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="accent shrink-0">
                  <Briefcase size={18} />
                </span>
                <h2 className="text-main font-semibold truncate">
                  trip brief
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="close"
                className="text-sub hover:text-main transition p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <div className="glass flex items-center gap-2 px-3 py-2.5">
                  <Search size={16} className="opacity-70" />
                  <input
                    value={place ? `${place.name}${place.admin1 ? ", " + place.admin1 : ""}${place.country ? ", " + place.country : ""}` : q}
                    onChange={(e) => {
                      setPlace(null);
                      setQ(e.target.value);
                    }}
                    onFocus={() => results.length && setShowResults(true)}
                    placeholder="destination city or town…"
                    className="flex-1 bg-transparent text-main placeholder:text-sub outline-none text-sm"
                  />
                  {searching && <Loader2 size={14} className="animate-spin opacity-70" />}
                  {place && (
                    <button
                      onClick={() => {
                        setPlace(null);
                        setQ("");
                      }}
                      className="text-sub hover:text-main"
                      aria-label="clear destination"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {showResults && !place && results.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="glass-strong absolute left-0 right-0 mt-2 z-10 overflow-hidden max-h-64 overflow-y-auto"
                    >
                      {results.map((r) => (
                        <button
                          key={`${r.id}-${r.latitude}-${r.longitude}`}
                          onClick={() => {
                            setPlace(r);
                            setShowResults(false);
                            setQ("");
                            setResults([]);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-white/10 transition flex items-center gap-2 border-b last:border-b-0"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <MapPin size={14} className="opacity-70" />
                          <div className="min-w-0">
                            <div className="text-main text-sm font-medium truncate">
                              {r.name}
                            </div>
                            <div className="text-sub text-xs truncate">
                              {[r.admin1, r.country].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="glass flex items-center gap-2 px-3 py-2.5 cursor-pointer">
                  <Calendar size={16} className="opacity-70 shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sub text-[10px] uppercase tracking-wider">start</span>
                    <input
                      type="date"
                      value={startDate}
                      min={minDate}
                      max={maxDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-transparent text-main outline-none text-sm"
                    />
                  </div>
                </label>
                <label className="glass flex items-center gap-2 px-3 py-2.5 cursor-pointer">
                  <Calendar size={16} className="opacity-70 shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sub text-[10px] uppercase tracking-wider">end</span>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || minDate}
                      max={maxDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-transparent text-main outline-none text-sm"
                    />
                  </div>
                </label>
              </div>

              <button
                onClick={submit}
                disabled={loading || !place}
                className="glass w-full px-4 py-3 text-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed ring-accent"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin accent" /> brewing brief…
                  </>
                ) : (
                  <>
                    <Briefcase size={14} className="accent" /> generate trip brief
                  </>
                )}
              </button>

              {error && (
                <div className="glass p-3 flex items-center gap-2 text-sm">
                  <AlertCircle size={14} className="accent shrink-0" />
                  <span className="text-main">{error}</span>
                </div>
              )}
            </div>

            {brief && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 space-y-4"
              >
                <div className="glass p-4">
                  <div className="text-sub text-xs uppercase tracking-wider mb-1">
                    {brief.place.name}{brief.place.country ? ` · ${brief.place.country}` : ""} · {brief.span.days} day{brief.span.days > 1 ? "s" : ""}
                  </div>
                  <div className="text-main text-base leading-snug">
                    {brief.headline}
                  </div>
                  <div className="text-sub text-[10px] uppercase tracking-wider mt-2">
                    {brief.source}
                  </div>
                </div>

                <div>
                  <h3 className="text-sub text-xs uppercase tracking-wider mb-2">daily</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {brief.daily.map((d) => (
                      <div key={d.date} className="glass p-3">
                        <div className="text-sub text-[10px] uppercase tracking-wider">
                          {d.date.slice(5)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <WeatherIcon code={d.weatherCode} isDay={true} size={22} />
                          <div className="text-main text-sm">
                            {Math.round(d.tMin)}° / {Math.round(d.tMax)}°
                          </div>
                        </div>
                        <div className="text-sub text-xs mt-1 leading-tight">
                          {d.label.toLowerCase()}
                        </div>
                        <div className="text-sub text-[10px] mt-0.5">
                          {Math.round(d.precipProb)}% rain · UV {Math.round(d.uvMax)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sub text-xs uppercase tracking-wider mb-2">packing list</h3>
                  <ul className="space-y-2">
                    {brief.packing.map((p, i) => {
                      const ps = priorityStyle(p.priority);
                      return (
                        <li key={i} className="glass p-3 flex items-start gap-3">
                          <span className="accent shrink-0 mt-0.5">
                            {priorityIcon(p.priority)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-main text-sm font-medium">{p.item}</span>
                              <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ${ps.color}`}>
                                {ps.label}
                              </span>
                            </div>
                            <div className="text-sub text-xs mt-0.5 leading-snug">
                              {p.why}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
