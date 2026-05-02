"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export type SpaceWeather = {
  kp: number | null;
  peak3d?: number;
  observedAt: string | null;
  geomagneticLat?: number;
  boundaryLat?: number;
  overheadPlausible?: boolean;
  horizonPlausible?: boolean;
  plausible?: boolean;
  stormLevel?: string | null;
};

type Props = {
  data: SpaceWeather | null;
  isNight: boolean;
};

export default function AuroraBanner({ data, isNight }: Props) {
  if (!data || data.kp == null || !data.plausible) return null;

  const kp = data.kp;
  const overhead = data.overheadPlausible;
  const headline = overhead
    ? "aurora possible overhead"
    : "aurora possible on the horizon";
  const sub = isNight
    ? overhead
      ? "step outside — clear north sky helps."
      : "look low to the north (south, if you're below the equator)."
    : "wait for nightfall — the show needs darkness.";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        border: "1px solid rgba(74, 222, 128, 0.35)",
        background:
          "linear-gradient(95deg, rgba(34, 197, 94, 0.18) 0%, rgba(125, 211, 252, 0.14) 45%, rgba(168, 85, 247, 0.16) 100%)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        boxShadow:
          "0 8px 32px rgba(34, 197, 94, 0.12), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none aurora-shimmer" />
      <div className="relative flex items-center gap-3 p-3.5">
        <span
          className="grid place-items-center w-9 h-9 rounded-xl shrink-0"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #4ade80, #14532d 90%)",
            boxShadow: "0 0 24px rgba(74, 222, 128, 0.45)",
          }}
        >
          <Sparkles size={16} className="text-white" strokeWidth={2.2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-main text-sm font-semibold leading-tight">
            {headline}
          </div>
          <div className="text-sub text-[11px] mt-0.5 truncate">
            Kp {kp.toFixed(1)}
            {data.stormLevel ? ` · ${data.stormLevel} storm` : ""} · {sub}
          </div>
        </div>
        {data.geomagneticLat != null && data.boundaryLat != null && (
          <div className="text-right shrink-0 hidden sm:block">
            <div className="text-main text-xs font-medium">
              {Math.round(Math.abs(data.geomagneticLat))}°
              <span className="text-sub"> mag</span>
            </div>
            <div className="text-sub text-[10px]">
              edge {Math.round(data.boundaryLat)}°
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .aurora-shimmer {
          background:
            radial-gradient(ellipse 60% 100% at 20% 50%, rgba(74, 222, 128, 0.25) 0%, transparent 60%),
            radial-gradient(ellipse 50% 100% at 80% 50%, rgba(168, 85, 247, 0.22) 0%, transparent 60%);
          animation: shimmer-slide 8s ease-in-out infinite alternate;
          mix-blend-mode: screen;
          opacity: 0.9;
        }
        @keyframes shimmer-slide {
          0% { transform: translateX(-4%); }
          100% { transform: translateX(4%); }
        }
      `}</style>
    </motion.div>
  );
}
