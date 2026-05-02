"use client";

import { useEffect, useRef, useState } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Place } from "@/lib/types";

type Props = {
  onSelect: (place: Place) => void;
  onUseLocation: () => void;
  geolocating?: boolean;
};

export default function SearchBar({ onSelect, onUseLocation, geolocating }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const data = await r.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        // ignore aborts
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="glass flex items-center gap-2 px-4 py-3">
        <Search size={18} className="opacity-70" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="search any city, town, or place…"
          className="flex-1 bg-transparent text-main placeholder:text-sub outline-none text-sm md:text-base"
          aria-label="search location"
        />
        {q ? (
          <button
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            className="text-sub hover:text-main transition"
            aria-label="clear search"
          >
            <X size={16} />
          </button>
        ) : null}
        <div className="divider w-px h-6 mx-1" style={{ width: 1, height: 24 }} />
        <button
          onClick={onUseLocation}
          disabled={geolocating}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm text-main hover:bg-white/10 transition disabled:opacity-60"
          aria-label="use my location"
        >
          {geolocating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
          <span className="hidden sm:inline">locate</span>
        </button>
      </div>
      <AnimatePresence>
        {open && (results.length > 0 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute left-0 right-0 mt-2 z-30 overflow-hidden"
          >
            {loading && (
              <div className="px-4 py-3 text-sub text-sm flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> searching…
              </div>
            )}
            {results.map((r) => (
              <button
                key={`${r.id}-${r.latitude}-${r.longitude}`}
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                  setQ("");
                  setResults([]);
                }}
                className="w-full text-left px-4 py-3 hover:bg-white/10 transition flex items-center justify-between gap-3 border-b last:border-b-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <MapPin size={14} className="opacity-70" />
                  <div>
                    <div className="text-main text-sm font-medium">{r.name}</div>
                    <div className="text-sub text-xs">
                      {[r.admin1, r.country].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
                <span className="text-sub text-xs">
                  {r.latitude.toFixed(2)}, {r.longitude.toFixed(2)}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
