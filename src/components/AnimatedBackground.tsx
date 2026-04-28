"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { ThemeName } from "@/lib/types";

type Props = { theme: ThemeName };

export default function AnimatedBackground({ theme }: Props) {
  return (
    <>
      {theme === "rain" || theme === "drizzle" ? <Rain dense={theme === "rain"} /> : null}
      {theme === "snow" ? <Snow /> : null}
      {theme === "thunderstorm" ? (
        <>
          <Rain dense />
          <div className="lightning-flash" />
        </>
      ) : null}
      {theme === "clear-day" ? <SunRays /> : null}
      {theme === "clear-night" ? <Stars /> : null}
      {theme === "cloudy-day" || theme === "cloudy-night" || theme === "fog" ? <Clouds /> : null}
    </>
  );
}

function Rain({ dense = false }: { dense?: boolean }) {
  const drops = useMemo(() => {
    const count = dense ? 90 : 50;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 0.6 + Math.random() * 0.7,
      length: 12 + Math.random() * 18,
      opacity: 0.4 + Math.random() * 0.5,
    }));
  }, [dense]);
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {drops.map((d) => (
        <span
          key={d.id}
          className="absolute block w-[1.5px] rounded-full"
          style={{
            left: `${d.left}%`,
            top: "-10vh",
            height: `${d.length}px`,
            background: "linear-gradient(to bottom, transparent, rgba(186,230,253,0.85))",
            opacity: d.opacity,
            animation: `raindrop ${d.duration}s linear ${d.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function Snow() {
  const flakes = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
      size: 4 + Math.random() * 8,
      opacity: 0.5 + Math.random() * 0.5,
    }));
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute block rounded-full bg-white"
          style={{
            left: `${f.left}%`,
            top: "-10vh",
            width: `${f.size}px`,
            height: `${f.size}px`,
            opacity: f.opacity,
            filter: "blur(0.5px)",
            animation: `snowflake ${f.duration}s linear ${f.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function SunRays() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute"
        style={{
          top: "-10vh",
          right: "-10vw",
          width: "70vh",
          height: "70vh",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(253, 230, 138, 0.55) 0%, rgba(251, 191, 36, 0.25) 35%, transparent 70%)",
          filter: "blur(8px)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute"
        style={{
          top: "10vh",
          right: "5vw",
          width: "20vh",
          height: "20vh",
          borderRadius: "50%",
          background: "radial-gradient(circle, #fef3c7 0%, #fbbf24 60%, transparent 100%)",
          boxShadow: "0 0 80px rgba(251, 191, 36, 0.7)",
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function Stars() {
  const stars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 70,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 3,
    }));
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute"
        style={{
          top: "8vh",
          right: "8vw",
          width: "14vh",
          height: "14vh",
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 35%, #f1f5f9 0%, #cbd5e1 70%, #94a3b8 100%)",
          boxShadow: "0 0 60px rgba(196, 181, 253, 0.5)",
        }}
      />
      {stars.map((s) => (
        <motion.span
          key={s.id}
          className="absolute block rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: s.delay }}
        />
      ))}
    </div>
  );
}

function Clouds() {
  const clouds = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      top: 5 + Math.random() * 50,
      size: 200 + Math.random() * 220,
      duration: 60 + Math.random() * 80,
      delay: -Math.random() * 60,
      opacity: 0.18 + Math.random() * 0.22,
    }));
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{
            top: `${c.top}%`,
            width: `${c.size}px`,
            height: `${c.size * 0.45}px`,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)",
            opacity: c.opacity,
            filter: "blur(20px)",
          }}
          initial={{ x: "-30vw" }}
          animate={{ x: "130vw" }}
          transition={{
            duration: c.duration,
            delay: c.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
