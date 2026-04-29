"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CloudLightning,
  Flame,
  Snowflake,
  CloudRain,
  Wind as WindIcon,
  Sun,
  CloudFog,
} from "lucide-react";
import type { WeatherAlert } from "@/lib/types";

type Props = { alerts: WeatherAlert[] | undefined };

export default function WeatherAlerts({ alerts }: Props) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-2"
    >
      <AnimatePresence initial={false}>
        {alerts.map((a) => {
          const tone = severityTone(a.severity);
          return (
            <motion.div
              key={a.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="glass-strong p-3 md:p-4 flex items-start gap-3 min-w-0"
              style={{
                borderColor: tone.border,
                boxShadow: `0 0 0 1px ${tone.border}, 0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)`,
              }}
            >
              <div
                className="shrink-0 mt-0.5 p-2 rounded-full"
                style={{ background: tone.iconBg, color: tone.iconColor }}
              >
                {iconFor(a.kind)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-main font-semibold text-sm md:text-base">
                    {a.title}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      background: tone.iconBg,
                      color: tone.iconColor,
                    }}
                  >
                    {a.severity}
                  </span>
                </div>
                <div className="text-sub text-xs md:text-sm mt-1 leading-snug">
                  {a.detail}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}

function iconFor(kind: WeatherAlert["kind"]) {
  switch (kind) {
    case "storm":
      return <CloudLightning size={18} />;
    case "heat":
      return <Flame size={18} />;
    case "cold":
      return <Snowflake size={18} />;
    case "rain":
      return <CloudRain size={18} />;
    case "snow":
      return <Snowflake size={18} />;
    case "wind":
      return <WindIcon size={18} />;
    case "uv":
      return <Sun size={18} />;
    case "fog":
      return <CloudFog size={18} />;
    default:
      return <AlertTriangle size={18} />;
  }
}

function severityTone(severity: WeatherAlert["severity"]) {
  switch (severity) {
    case "warning":
      return {
        border: "rgba(239, 68, 68, 0.55)",
        iconBg: "rgba(239, 68, 68, 0.22)",
        iconColor: "#fca5a5",
      };
    case "advisory":
      return {
        border: "rgba(251, 191, 36, 0.55)",
        iconBg: "rgba(251, 191, 36, 0.22)",
        iconColor: "#fcd34d",
      };
    case "watch":
    default:
      return {
        border: "rgba(96, 165, 250, 0.55)",
        iconBg: "rgba(96, 165, 250, 0.22)",
        iconColor: "#bfdbfe",
      };
  }
}
