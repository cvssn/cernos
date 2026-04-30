"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Stars, Satellite } from "lucide-react";
import {
  moonInfo,
  planetVisibility,
  twilightWindows,
  type MoonInfo,
  type PlanetVisibility,
  type TwilightWindows,
} from "@/lib/ephemeris";

type Props = {
  latitude: number;
  longitude: number;
};

type IssPass = {
  start: string;
  end: string | null;
  peakElevationDeg: number;
} | null;

export default function TonightsSkyPanel({ latitude, longitude }: Props) {
  const [now, setNow] = useState(() => new Date());
  const [iss, setIss] = useState<IssPass>(null);
  const [issLoading, setIssLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIssLoading(true);
    setIss(null);
    fetch(`/api/iss-pass?lat=${latitude}&lon=${longitude}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setIss(d.pass ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIssLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [latitude, longitude]);

  const moon = useMemo(
    () => moonInfo(now, latitude, longitude),
    [now, latitude, longitude]
  );
  const planets = useMemo(
    () => planetVisibility(now, latitude, longitude),
    [now, latitude, longitude]
  );
  const twilight = useMemo(
    () => twilightWindows(now, latitude, longitude),
    [now, latitude, longitude]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass p-4 min-w-0"
    >
      <div className="flex items-center justify-between text-sub text-[10px] uppercase tracking-wider mb-3">
        <div className="flex items-center gap-1.5">
          <Stars size={14} className="accent" />
          <span>Tonight&apos;s Sky</span>
        </div>
        <span className="text-sub text-[10px] normal-case tracking-normal">
          {moon.phaseName}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <MoonGlyph moon={moon} size={84} />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-main text-2xl font-semibold leading-none">
            {Math.round(moon.illumination * 100)}%
          </div>
          <div className="text-sub text-[11px]">illuminated</div>
          <div className="text-sub text-[11px] mt-1.5 grid grid-cols-2 gap-x-2">
            <span>Rise</span>
            <span className="text-main">{formatRel(moon.rise, now)}</span>
            <span>Set</span>
            <span className="text-main">{formatRel(moon.set, now)}</span>
          </div>
        </div>
      </div>

      <Divider />

      <TwilightRow twilight={twilight} now={now} />

      <Divider />

      <div className="text-sub text-[10px] uppercase tracking-wider mb-2">
        Visible planets
      </div>
      <div className="grid grid-cols-1 gap-1.5">
        {planets.map((p) => (
          <PlanetRow key={p.name} p={p} />
        ))}
        {planets.every((p) => !p.visible) && (
          <div className="text-sub text-[11px] italic">
            None above 5° right now
          </div>
        )}
      </div>

      <Divider />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sub text-[10px] uppercase tracking-wider">
          <Satellite size={12} className="accent" />
          <span>Next ISS pass</span>
        </div>
        <div className="text-[11px] text-right min-w-0">
          {issLoading ? (
            <span className="text-sub italic">Looking…</span>
          ) : iss ? (
            <>
              <span className="text-main font-medium">
                {formatRel(new Date(iss.start), now)}
              </span>
              <span className="text-sub ml-1.5">
                · peak {Math.round(iss.peakElevationDeg)}°
              </span>
            </>
          ) : (
            <span className="text-sub italic">No pass in 48 h</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Divider() {
  return <div className="h-px bg-[var(--border)] my-3" />;
}

function MoonGlyph({ moon, size }: { moon: MoonInfo; size: number }) {
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = Math.cos(moon.phaseAngle * (Math.PI / 180));
  const rx = Math.abs(c) * r;
  const top = `${cx},${cy - r}`;
  const bot = `${cx},${cy + r}`;
  const waxing = moon.waxing;
  const limbSweep = waxing ? 0 : 1;
  const termSweep = waxing !== c < 0 ? 1 : 0;

  // Dark region path: limb half-circle on the dark side, then terminator half-ellipse back.
  const darkPath = `M ${top} A ${r} ${r} 0 0 ${limbSweep} ${bot} A ${rx} ${r} 0 0 ${termSweep} ${top} Z`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <radialGradient id="moon-bright" cx="0.45" cy="0.4" r="0.7">
          <stop offset="0%" stopColor="#fefce8" />
          <stop offset="60%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#d6c89a" />
        </radialGradient>
        <radialGradient id="moon-dark" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
        </radialGradient>
      </defs>
      <circle
        cx={cx}
        cy={cy}
        r={r + 1.5}
        fill="none"
        stroke="var(--accent)"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      <circle cx={cx} cy={cy} r={r} fill="url(#moon-bright)" />
      <path d={darkPath} fill="url(#moon-dark)" />
      <circle
        cx={cx - r * 0.35}
        cy={cy - r * 0.15}
        r={r * 0.08}
        fill="#0f172a"
        opacity="0.18"
      />
      <circle
        cx={cx + r * 0.1}
        cy={cy + r * 0.3}
        r={r * 0.06}
        fill="#0f172a"
        opacity="0.14"
      />
      <circle
        cx={cx + r * 0.4}
        cy={cy - r * 0.3}
        r={r * 0.05}
        fill="#0f172a"
        opacity="0.16"
      />
    </svg>
  );
}

function TwilightRow({
  twilight,
  now,
}: {
  twilight: TwilightWindows;
  now: Date;
}) {
  const goldenActive = twilight.inGoldenHour;
  const blueActive = twilight.inBlueHour;

  return (
    <div className="grid grid-cols-2 gap-2">
      <TwilightTile
        label="Golden"
        active={goldenActive}
        endLabel={goldenActive ? "ends" : "in"}
        target={goldenActive ? twilight.nextGoldenEnd : twilight.nextGoldenStart}
        now={now}
        gradient="linear-gradient(135deg, #fbbf24, #f97316)"
      />
      <TwilightTile
        label="Blue"
        active={blueActive}
        endLabel={blueActive ? "ends" : "in"}
        target={blueActive ? twilight.nextBlueEnd : twilight.nextBlueStart}
        now={now}
        gradient="linear-gradient(135deg, #60a5fa, #3730a3)"
      />
    </div>
  );
}

function TwilightTile({
  label,
  active,
  endLabel,
  target,
  now,
  gradient,
}: {
  label: string;
  active: boolean;
  endLabel: string;
  target: Date | null;
  now: Date;
  gradient: string;
}) {
  return (
    <div
      className="rounded-lg p-2.5 min-w-0 relative overflow-hidden"
      style={{
        background: active
          ? gradient
          : "color-mix(in srgb, var(--glass) 80%, transparent)",
        border: active
          ? "1px solid rgba(255,255,255,0.25)"
          : "1px solid var(--border)",
      }}
    >
      <div
        className={`text-[10px] uppercase tracking-wider ${
          active ? "text-white/90" : "text-sub"
        }`}
      >
        {label} hour
      </div>
      <div
        className={`text-base font-semibold leading-tight mt-1 ${
          active ? "text-white" : "text-main"
        }`}
      >
        {target ? formatCountdown(target, now) : "—"}
      </div>
      <div
        className={`text-[10px] mt-0.5 ${
          active ? "text-white/80" : "text-sub"
        }`}
      >
        {endLabel}{" "}
        {target
          ? target.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </div>
    </div>
  );
}

function PlanetRow({ p }: { p: PlanetVisibility }) {
  const dim = !p.visible;
  const intensity = brightnessOpacity(p.brightness);
  return (
    <div
      className="flex items-center gap-2 text-[11px] min-w-0"
      style={{ opacity: dim ? 0.45 : 1 }}
    >
      <span
        className="w-5 h-5 rounded-full grid place-items-center text-[12px]"
        style={{
          background: `color-mix(in srgb, var(--accent) ${
            intensity * 28
          }%, transparent)`,
          color: "var(--accent)",
        }}
      >
        {p.symbol}
      </span>
      <span className="text-main w-14 shrink-0">{p.name}</span>
      <span className="text-sub flex-1 truncate">
        {p.visible
          ? `${Math.round(p.altitude)}° ${cardinal(p.azimuth)}`
          : `below ${Math.round(p.altitude)}°`}
      </span>
      <span className="text-sub text-[10px] capitalize">{p.brightness}</span>
    </div>
  );
}

function brightnessOpacity(b: PlanetVisibility["brightness"]): number {
  return b === "brilliant" ? 1 : b === "bright" ? 0.85 : b === "moderate" ? 0.7 : 0.55;
}

function cardinal(azimuth: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round((azimuth % 360) / 45) % 8];
}

function formatRel(target: Date | null, now: Date): string {
  if (!target) return "—";
  const diffMs = target.getTime() - now.getTime();
  const absMin = Math.abs(diffMs) / 60000;
  const time = target.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (absMin < 60) {
    const mins = Math.round(absMin);
    return diffMs >= 0 ? `${time} · in ${mins}m` : `${time} · ${mins}m ago`;
  }
  return time;
}

function formatCountdown(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return "now";
  const totalMin = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (h < 24) return `${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
