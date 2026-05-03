"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wind } from "lucide-react";

type Props = {
  speed: number;
  direction: number;
};

const PARTICLE_COUNT = 16;

const CARDINALS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

function cardinal(deg: number): string {
  const norm = ((deg % 360) + 360) % 360;
  return CARDINALS[Math.round(norm / 45) % 8];
}

function beaufort(kmh: number): string {
  if (kmh < 1) return "calm";
  if (kmh < 6) return "light air";
  if (kmh < 12) return "light breeze";
  if (kmh < 20) return "gentle breeze";
  if (kmh < 29) return "moderate breeze";
  if (kmh < 39) return "fresh breeze";
  if (kmh < 50) return "strong breeze";
  if (kmh < 62) return "near gale";
  if (kmh < 75) return "gale";
  if (kmh < 89) return "strong gale";
  if (kmh < 103) return "storm";
  return "hurricane";
}

export default function WindCompass({ speed, direction }: Props) {
  const flowAngle = (direction + 180) % 360;
  const speedFactor = Math.min(1, speed / 60);
  const particleDuration = Math.max(0.7, 2.6 - speedFactor * 1.9);
  const particleOpacity = 0.35 + speedFactor * 0.5;

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        delay: (i / PARTICLE_COUNT) * particleDuration,
        offsetPerp: (Math.random() - 0.5) * 28,
        size: 2 + Math.random() * 2.5,
        opacity: particleOpacity * (0.5 + Math.random() * 0.5),
      })),
    [particleDuration, particleOpacity]
  );

  const isCalm = speed < 1;

  return (
    <div className="glass p-4 flex items-center gap-5">
      <div className="relative w-32 h-32 shrink-0">
        <svg
          viewBox="-100 -100 200 200"
          className="absolute inset-0 w-full h-full"
        >
          <circle
            cx="0"
            cy="0"
            r="92"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.5"
          />
          <circle
            cx="0"
            cy="0"
            r="92"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            strokeDasharray="2 8"
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line
              key={a}
              x1="0"
              y1="-92"
              x2="0"
              y2={a % 90 === 0 ? "-82" : "-86"}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={a % 90 === 0 ? 1.5 : 1}
              transform={`rotate(${a})`}
            />
          ))}
          <text
            x="0"
            y="-70"
            fill="rgba(255,255,255,0.75)"
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            N
          </text>
          <text
            x="70"
            y="0"
            fill="rgba(255,255,255,0.5)"
            fontSize="11"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            E
          </text>
          <text
            x="0"
            y="70"
            fill="rgba(255,255,255,0.5)"
            fontSize="11"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            S
          </text>
          <text
            x="-70"
            y="0"
            fill="rgba(255,255,255,0.5)"
            fontSize="11"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            W
          </text>
        </svg>

        <motion.div
          className="absolute inset-0"
          animate={{ rotate: flowAngle }}
          transition={{ type: "spring", stiffness: 60, damping: 16 }}
          style={{ originX: "50%", originY: "50%" }}
        >
          {!isCalm && (
            <>
              {particles.map((p) => (
                <span
                  key={p.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: "50%",
                    top: "50%",
                    width: 0,
                    height: 0,
                    transform: `translate(${p.offsetPerp}px, 0)`,
                  }}
                >
                  <span
                    className="block rounded-full bg-white wind-particle"
                    style={{
                      width: p.size,
                      height: p.size,
                      animationDuration: `${particleDuration}s`,
                      animationDelay: `-${p.delay}s`,
                      ["--wp-opacity" as string]: p.opacity,
                    }}
                  />
                </span>
              ))}
            </>
          )}

          <svg
            viewBox="-100 -100 200 200"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <linearGradient
                id="windArrowGrad"
                x1="50%"
                y1="100%"
                x2="50%"
                y2="0%"
              >
                <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0.6)" />
                <stop offset="100%" stopColor="rgba(255,255,255,1)" />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1="46"
              x2="0"
              y2="-58"
              stroke="url(#windArrowGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <polygon
              points="0,-78 -11,-56 11,-56"
              fill="rgba(255,255,255,0.95)"
            />
            <circle cx="0" cy="0" r="4" fill="rgba(255,255,255,0.8)" />
          </svg>
        </motion.div>
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sub text-[10px] uppercase tracking-wider">
          <Wind size={12} className="accent" />
          <span>wind</span>
        </div>
        <div className="text-main text-3xl font-semibold mt-1 leading-none flex items-baseline gap-1.5">
          <span>{Math.round(speed)}</span>
          <span className="text-sub text-base font-normal">km/h</span>
        </div>
        <div className="text-sub text-xs mt-2 lowercase">
          from {cardinal(direction).toLowerCase()} ·{" "}
          {Math.round(((direction % 360) + 360) % 360)}°
        </div>
        <div className="text-sub text-[11px] mt-0.5 lowercase opacity-80">
          {beaufort(speed)}
        </div>
      </div>
    </div>
  );
}
