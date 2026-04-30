"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Sparkles } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";
import { Soundscape, layerLabel } from "@/lib/soundscape";
import { describeWeather } from "@/lib/weather-codes";
import type { Place, Snapshot, ThemeName } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  theme: ThemeName;
  snapshot: Snapshot | null;
  place: Place;
};

export default function AmbientMode({ open, onClose, theme, snapshot, place }: Props) {
  const soundRef = useRef<Soundscape | null>(null);
  const [volume, setVolume] = useState(0.55);
  const [muted, setMuted] = useState(false);
  const [layers, setLayers] = useState<string[]>([]);
  const [audioReady, setAudioReady] = useState(false);

  // start / stop soundscape with the overlay
  useEffect(() => {
    if (open) {
      if (!soundRef.current) soundRef.current = new Soundscape();
      soundRef.current.setVolume(muted ? 0 : volume);
      soundRef.current.start(theme);
      setLayers(
        soundRef.current.getActiveLayerNames().map(layerLabel)
      );
      setAudioReady(true);
    } else {
      soundRef.current?.stop();
      setAudioReady(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // theme cross-fades while overlay is open
  useEffect(() => {
    if (!open || !soundRef.current) return;
    soundRef.current.setTheme(theme);
    setLayers(soundRef.current.getActiveLayerNames().map(layerLabel));
  }, [theme, open]);

  // volume / mute applies live
  useEffect(() => {
    soundRef.current?.setVolume(muted ? 0 : volume);
  }, [volume, muted]);

  // dispose audio context on unmount
  useEffect(() => {
    return () => {
      soundRef.current?.dispose();
      soundRef.current = null;
    };
  }, []);

  // Esc closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const condition = useMemo(
    () => (snapshot ? describeWeather(snapshot.weatherCode) : null),
    [snapshot]
  );

  const localTime = useMemo(() => {
    if (!snapshot) return "";
    try {
      return new Date(snapshot.time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [snapshot]);

  return (
    <AnimatePresence>
      {open && snapshot && condition ? (
        <motion.div
          key="ambient-mode"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* sky uses the live theme gradient */}
          <div
            className="absolute inset-0 transition-[background] duration-[1200ms]"
            style={{ background: "var(--bg-gradient)" }}
          />

          {/* gigantic centered celestial body — bigger than the dashboard's */}
          <CelestialBody theme={theme} />

          {/* reuse the existing weather particle system at full strength */}
          <AnimatedBackground theme={theme} />

          {/* readability vignette on the lower half */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-b from-transparent via-black/20 to-black/55 pointer-events-none" />

          {/* close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 glass p-3 hover:scale-110 active:scale-95 transition z-20"
            aria-label="Exit ambient mode"
            title="Exit (Esc)"
          >
            <X size={18} />
          </button>

          {/* corner label */}
          <div className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sub text-xs uppercase tracking-[0.3em]">
            <Sparkles size={14} className="accent" />
            Ambient
          </div>

          {/* big center text — temp, condition, place */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none z-10">
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="text-main font-light leading-none tracking-tighter"
              style={{
                fontSize: "clamp(7rem, 18vw, 18rem)",
                textShadow: "0 6px 60px rgba(0,0,0,0.45)",
              }}
            >
              {Math.round(snapshot.temperature)}°
            </motion.div>
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.9 }}
              className="text-main font-light mt-2"
              style={{
                fontSize: "clamp(1.25rem, 2.6vw, 2rem)",
                textShadow: "0 3px 30px rgba(0,0,0,0.55)",
              }}
            >
              {condition.label}
            </motion.div>
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.9 }}
              className="text-sub uppercase tracking-[0.35em] text-xs mt-8"
            >
              {place.name}
              {place.country ? ` · ${place.country}` : ""}
              {localTime ? ` · ${localTime}` : ""}
            </motion.div>
          </div>

          {/* bottom dock: layer pills + volume */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.7 }}
            className="absolute inset-x-0 bottom-8 px-6 flex flex-col items-center gap-3 z-20"
          >
            <div className="flex flex-wrap gap-2 justify-center min-h-[28px]">
              {!audioReady ? null : layers.length === 0 ? (
                <span className="text-sub text-[10px] uppercase tracking-[0.3em]">
                  Silent sky
                </span>
              ) : (
                layers.map((l) => (
                  <motion.span
                    key={l}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    className="glass px-3 py-1 text-[10px] uppercase tracking-[0.25em]"
                  >
                    {l}
                  </motion.span>
                ))
              )}
            </div>

            <div className="glass-strong flex items-center gap-3 px-4 py-3 w-full max-w-md">
              <button
                onClick={() => setMuted((m) => !m)}
                className="hover:scale-110 active:scale-95 transition"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} className="accent" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={muted ? 0 : Math.round(volume * 100)}
                onChange={(e) => {
                  const v = Number(e.target.value) / 100;
                  setVolume(v);
                  if (v > 0 && muted) setMuted(false);
                }}
                className="radar-range flex-1"
                aria-label="Soundscape volume"
              />
              <span className="text-sub text-xs tabular-nums w-8 text-right">
                {muted ? 0 : Math.round(volume * 100)}
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

// A larger, centered sun/moon backdrop — only when the sky would have one.
function CelestialBody({ theme }: { theme: ThemeName }) {
  const isSunny = theme === "clear-day";
  const isClearNight = theme === "clear-night";
  const isCloudy = theme === "cloudy-day" || theme === "cloudy-night";
  if (!isSunny && !isClearNight && !isCloudy) return null;

  if (isSunny) {
    return (
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "18%",
          left: "50%",
          width: "clamp(280px, 38vw, 560px)",
          height: "clamp(280px, 38vw, 560px)",
          x: "-50%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #fef3c7 0%, #fbbf24 45%, rgba(251,191,36,0.25) 75%, transparent 100%)",
          filter: "blur(2px)",
          boxShadow: "0 0 220px 60px rgba(251,191,36,0.45)",
        }}
        animate={{ scale: [1, 1.04, 1], opacity: [0.92, 1, 0.92] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  if (isClearNight) {
    return (
      <motion.div
        className="absolute pointer-events-none"
        style={{
          top: "18%",
          left: "50%",
          width: "clamp(220px, 30vw, 440px)",
          height: "clamp(220px, 30vw, 440px)",
          x: "-50%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 35%, #f1f5f9 0%, #cbd5e1 65%, #64748b 100%)",
          boxShadow: "0 0 160px 40px rgba(196,181,253,0.45)",
        }}
        animate={{ opacity: [0.88, 1, 0.88] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }

  // cloudy: a soft diffuse halo so the sky doesn't feel empty
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: "10%",
        left: "50%",
        width: "70vw",
        height: "60vh",
        transform: "translateX(-50%)",
        background:
          "radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, transparent 70%)",
        filter: "blur(40px)",
      }}
    />
  );
}
