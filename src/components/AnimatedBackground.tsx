"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { ThemeName } from "@/lib/types";

type Props = { theme: ThemeName };

export default function AnimatedBackground({ theme }: Props) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* SKY BODIES */}
      {theme === "clear-day" && <Sun />}
      {theme === "cloudy-day" && <DiffuseSun />}
      {theme === "clear-night" && <Moon />}
      {theme === "cloudy-night" && <Moon dim />}

      {/* STARS — only on clear nights */}
      {theme === "clear-night" && <Stars />}
      {theme === "clear-night" && <ShootingStars />}

      {/* CLOUDS — multi-layer parallax */}
      {theme === "clear-day" && <Clouds tone="bright" density="light" />}
      {theme === "cloudy-day" && <Clouds tone="bright" density="dense" />}
      {theme === "cloudy-night" && <Clouds tone="dark" density="dense" />}
      {(theme === "rain" || theme === "drizzle") && (
        <Clouds tone="storm" density="dense" />
      )}
      {theme === "thunderstorm" && <Clouds tone="thunder" density="dense" />}

      {/* BIRDS — flapping silhouettes during day */}
      {theme === "clear-day" && <Birds count={4} />}
      {theme === "cloudy-day" && <Birds count={2} />}

      {/* PRECIPITATION */}
      {theme === "rain" && <Rain dense />}
      {theme === "rain" && <RainSplashes />}
      {theme === "drizzle" && <Rain dense={false} />}
      {theme === "thunderstorm" && (
        <>
          <Rain dense />
          <LightningBolt />
          <div className="lightning-flash" />
        </>
      )}
      {theme === "snow" && <Snow />}

      {/* MIST */}
      {theme === "fog" && <Mist dense />}
      {theme === "drizzle" && <Mist dense={false} />}

      {/* MOUNTAINS — distant silhouette */}
      {theme !== "fog" && <Mountains theme={theme} />}

      {/* TREES — foreground silhouette */}
      {theme !== "fog" && <TreeLine theme={theme} />}

      {/* FIREFLIES — clear nights only, near treeline */}
      {theme === "clear-night" && <Fireflies />}
    </div>
  );
}

function Sun() {
  return (
    <>
      <motion.div
        className="absolute"
        style={{
          top: "-12vh",
          right: "-8vw",
          width: "85vh",
          height: "85vh",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(253,230,138,0.5) 0%, rgba(251,191,36,0.18) 40%, transparent 70%)",
          filter: "blur(10px)",
        }}
        animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute"
        style={{
          top: "8vh",
          right: "6vw",
          width: "16vh",
          height: "16vh",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, #fffbeb 0%, #fde68a 38%, #fbbf24 72%, transparent 100%)",
          boxShadow:
            "0 0 100px rgba(251, 191, 36, 0.7), 0 0 180px rgba(253, 230, 138, 0.45)",
        }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute"
        style={{
          top: "16vh",
          right: 0,
          width: "60vw",
          height: "8vh",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(254,243,199,0.18) 35%, rgba(254,243,199,0.45) 50%, rgba(254,243,199,0.18) 65%, transparent 100%)",
          filter: "blur(20px)",
          mixBlendMode: "screen",
          animation: "sun-flare-shimmer 9s ease-in-out infinite",
        }}
      />
    </>
  );
}

function DiffuseSun() {
  return (
    <div
      className="absolute"
      style={{
        top: "-12vh",
        left: "55%",
        width: "60vh",
        height: "60vh",
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.12) 45%, transparent 72%)",
        filter: "blur(22px)",
        animation: "sun-flare-shimmer 12s ease-in-out infinite",
      }}
    />
  );
}

function Moon({ dim = false }: { dim?: boolean }) {
  return (
    <div
      className="absolute"
      style={{
        top: "8vh",
        right: "8vw",
        width: "14vh",
        height: "14vh",
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 35% 35%, #f1f5f9 0%, #cbd5e1 65%, #94a3b8 100%)",
        animation: "moon-glow 8s ease-in-out infinite",
        opacity: dim ? 0.55 : 1,
      }}
    />
  );
}

function Stars() {
  const stars = useMemo(
    () =>
      Array.from({ length: 110 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 65,
        size: 1 + Math.random() * 2.2,
        delay: Math.random() * 4,
        duration: 2.5 + Math.random() * 4,
        bright: Math.random() < 0.18,
      })),
    []
  );
  return (
    <>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute block rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            boxShadow: s.bright
              ? "0 0 6px rgba(255,255,255,0.95), 0 0 12px rgba(196,181,253,0.55)"
              : undefined,
            animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

function ShootingStars() {
  const meteors = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => ({
        id: i,
        top: Math.random() * 32,
        left: Math.random() * 35,
        delay: 6 + i * 11 + Math.random() * 5,
        duration: 2.4 + Math.random() * 0.8,
      })),
    []
  );
  return (
    <>
      {meteors.map((m) => (
        <span
          key={m.id}
          className="absolute"
          style={{
            top: `${m.top}%`,
            left: `${m.left}%`,
            width: "120px",
            height: "1.5px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 60%, rgba(196,181,253,0.95) 100%)",
            filter: "drop-shadow(0 0 4px rgba(196,181,253,0.85))",
            animation: `shoot-star ${m.duration}s ease-out ${m.delay}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </>
  );
}

function Clouds({
  tone,
  density,
}: {
  tone: "bright" | "dark" | "storm" | "thunder";
  density: "light" | "dense";
}) {
  const clouds = useMemo(() => {
    const count = density === "dense" ? 9 : 4;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      top: 2 + Math.random() * 48,
      width: 280 + Math.random() * 360,
      duration: 70 + Math.random() * 90,
      delay: -Math.random() * 70,
      opacity:
        density === "dense"
          ? 0.32 + Math.random() * 0.32
          : 0.18 + Math.random() * 0.18,
      reverse: Math.random() < 0.3,
      blur: 18 + Math.random() * 16,
    }));
  }, [density]);

  const fill =
    tone === "bright"
      ? "rgba(255,255,255,0.95)"
      : tone === "dark"
      ? "rgba(148,163,184,0.85)"
      : tone === "storm"
      ? "rgba(71,85,105,0.95)"
      : "rgba(30,41,59,0.95)";

  return (
    <>
      {clouds.map((c) => (
        <div
          key={c.id}
          className="absolute"
          style={{
            top: `${c.top}%`,
            width: `${c.width}px`,
            height: `${c.width * 0.42}px`,
            borderRadius: "50%",
            background: `radial-gradient(ellipse at 50% 60%, ${fill} 0%, transparent 70%)`,
            opacity: c.opacity,
            filter: `blur(${c.blur}px)`,
            animation: `${
              c.reverse ? "cloud-drift-reverse" : "cloud-drift"
            } ${c.duration}s linear ${c.delay}s infinite`,
            willChange: "transform",
          }}
        />
      ))}
    </>
  );
}

function Rain({ dense = false }: { dense?: boolean }) {
  const drops = useMemo(() => {
    const count = dense ? 110 : 50;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.4,
      duration: 0.55 + Math.random() * 0.7,
      length: 14 + Math.random() * 22,
      opacity: 0.4 + Math.random() * 0.5,
    }));
  }, [dense]);
  return (
    <>
      {drops.map((d) => (
        <span
          key={d.id}
          className="absolute block w-[1.5px] rounded-full"
          style={{
            left: `${d.left}%`,
            top: "-10vh",
            height: `${d.length}px`,
            background:
              "linear-gradient(to bottom, transparent, rgba(186,230,253,0.85))",
            opacity: d.opacity,
            animation: `raindrop ${d.duration}s linear ${d.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

function RainSplashes() {
  const splashes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        bottom: 4 + Math.random() * 12,
        size: 14 + Math.random() * 18,
        delay: Math.random() * 2,
        duration: 1.6 + Math.random() * 1.0,
      })),
    []
  );
  return (
    <>
      {splashes.map((s) => (
        <span
          key={s.id}
          className="absolute block rounded-full"
          style={{
            left: `${s.left}%`,
            bottom: `${s.bottom}%`,
            width: `${s.size}px`,
            height: `${s.size * 0.4}px`,
            border: "1px solid rgba(186,230,253,0.6)",
            animation: `rain-splash ${s.duration}s ease-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

function Snow() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 75 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 7 + Math.random() * 9,
        size: 4 + Math.random() * 8,
        opacity: 0.5 + Math.random() * 0.5,
      })),
    []
  );
  return (
    <>
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
    </>
  );
}

function Mist({ dense = false }: { dense?: boolean }) {
  const layers = useMemo(() => {
    const count = dense ? 6 : 3;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      top: 30 + Math.random() * 55,
      width: 80 + Math.random() * 40,
      height: 22 + Math.random() * 24,
      duration: 60 + Math.random() * 60,
      delay: -Math.random() * 60,
      opacity: dense
        ? 0.35 + Math.random() * 0.3
        : 0.18 + Math.random() * 0.15,
    }));
  }, [dense]);
  return (
    <>
      {layers.map((l) => (
        <div
          key={l.id}
          className="absolute"
          style={{
            top: `${l.top}%`,
            width: `${l.width}vw`,
            height: `${l.height}vh`,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(226,232,240,0.55) 30%, rgba(226,232,240,0.55) 70%, transparent 100%)",
            filter: "blur(36px)",
            opacity: l.opacity,
            animation: `mist-drift ${l.duration}s linear ${l.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

function LightningBolt() {
  return (
    <div
      className="absolute"
      style={{
        top: "6vh",
        left: "55%",
        width: "100px",
        height: "42vh",
        animation: "bolt-flash 8s ease-in-out infinite",
        transformOrigin: "top center",
      }}
    >
      <svg
        viewBox="0 0 60 200"
        preserveAspectRatio="none"
        className="w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <filter id="bolt-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M 32 0 L 14 88 L 28 88 L 8 200 L 36 102 L 22 102 L 44 0 Z"
          fill="rgba(255,255,255,0.95)"
          stroke="rgba(196,181,253,0.9)"
          strokeWidth="1.2"
          filter="url(#bolt-glow)"
        />
      </svg>
    </div>
  );
}

function Birds({ count }: { count: number }) {
  const birds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: 10 + Math.random() * 28,
        size: 14 + Math.random() * 8,
        delay: i * 9 - Math.random() * 6,
        duration: 60 + Math.random() * 35,
        flapDuration: 0.35 + Math.random() * 0.18,
      })),
    [count]
  );
  return (
    <>
      {birds.map((b) => (
        <div
          key={b.id}
          className="absolute"
          style={{
            top: `${b.top}%`,
            left: 0,
            animation: `bird-fly ${b.duration}s linear ${b.delay}s infinite`,
            opacity: 0.7,
            willChange: "transform",
          }}
        >
          <svg
            width={b.size}
            height={b.size * 0.5}
            viewBox="0 0 24 12"
            style={{
              animation: `wing-flap ${b.flapDuration}s ease-in-out infinite`,
              transformOrigin: "center bottom",
            }}
            aria-hidden="true"
          >
            <path
              d="M 1 8 Q 6 1 12 6 Q 18 1 23 8"
              fill="none"
              stroke="rgba(15,23,42,0.7)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ))}
    </>
  );
}

function Fireflies() {
  const flies = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        bottom: 8 + Math.random() * 32,
        size: 2 + Math.random() * 2,
        delay: Math.random() * 6,
        duration: 6 + Math.random() * 5,
      })),
    []
  );
  return (
    <>
      {flies.map((f) => (
        <span
          key={f.id}
          className="absolute block rounded-full"
          style={{
            left: `${f.left}%`,
            bottom: `${f.bottom}%`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            background: "rgba(254,240,138,1)",
            boxShadow:
              "0 0 8px rgba(254,240,138,0.95), 0 0 14px rgba(250,204,21,0.7)",
            animation: `firefly-drift ${f.duration}s ease-in-out ${f.delay}s infinite`,
          }}
        />
      ))}
    </>
  );
}

function Mountains({ theme }: { theme: ThemeName }) {
  const isNight =
    theme === "clear-night" ||
    theme === "cloudy-night" ||
    theme === "thunderstorm";
  const isSnow = theme === "snow";
  const backFill = isSnow
    ? "rgba(203,213,225,0.55)"
    : isNight
    ? "rgba(15,23,42,0.55)"
    : "rgba(15,23,42,0.28)";
  const frontFill = isSnow
    ? "rgba(148,163,184,0.7)"
    : isNight
    ? "rgba(2,6,23,0.7)"
    : "rgba(15,23,42,0.45)";
  return (
    <svg
      viewBox="0 0 1600 400"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 w-full h-[40vh] min-h-[260px]"
      aria-hidden="true"
    >
      <path
        d="M 0 400 L 0 250 L 90 200 L 200 240 L 320 170 L 460 220 L 600 160 L 740 210 L 870 150 L 1010 220 L 1180 180 L 1320 230 L 1460 200 L 1600 230 L 1600 400 Z"
        fill={backFill}
      />
      {isSnow && (
        <path
          d="M 0 250 L 90 200 L 200 240 L 320 170 L 460 220 L 600 160 L 740 210 L 870 150 L 1010 220 L 1180 180 L 1320 230 L 1460 200 L 1600 230"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      )}
      <path
        d="M 0 400 L 0 320 L 80 280 L 200 310 L 330 260 L 480 320 L 630 280 L 780 310 L 940 270 L 1100 320 L 1260 290 L 1430 320 L 1600 290 L 1600 400 Z"
        fill={frontFill}
      />
    </svg>
  );
}

function TreeLine({ theme }: { theme: ThemeName }) {
  const isNight =
    theme === "clear-night" ||
    theme === "cloudy-night" ||
    theme === "thunderstorm";
  const isSnow = theme === "snow";
  const fill = isSnow
    ? "rgba(30,41,59,0.85)"
    : isNight
    ? "rgba(2,6,23,0.92)"
    : "rgba(15,23,42,0.78)";

  const path = useMemo(() => {
    const W = 1600;
    const baseY = 100;
    const step = 13;
    const segments: string[] = [`M 0 ${baseY}`];
    let prng = 1;
    const rand = () => {
      prng = (prng * 9301 + 49297) % 233280;
      return prng / 233280;
    };
    for (let x = 0; x <= W; x += step) {
      const h = 20 + rand() * 32;
      const w = step * 0.45;
      segments.push(`L ${x - w} ${baseY}`);
      segments.push(`L ${x} ${baseY - h}`);
      segments.push(`L ${x + w} ${baseY}`);
    }
    segments.push(`L ${W} ${baseY} Z`);
    return segments.join(" ");
  }, []);

  return (
    <svg
      viewBox="0 0 1600 100"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 w-full h-[14vh] min-h-[100px]"
      aria-hidden="true"
    >
      <path d={path} fill={fill} />
      {isSnow && (
        <path
          d={path}
          fill="rgba(255,255,255,0.55)"
          transform="translate(0, -7)"
        />
      )}
    </svg>
  );
}
