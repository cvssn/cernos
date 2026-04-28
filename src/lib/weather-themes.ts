import type { ThemeName, ThemePalette } from "./types";

export const THEMES: Record<ThemeName, ThemePalette> = {
  "clear-day": {
    name: "clear-day",
    label: "Sunny",
    gradient:
      "radial-gradient(circle at 20% 0%, #fde68a 0%, transparent 45%), radial-gradient(circle at 80% 10%, #fbbf24 0%, transparent 40%), linear-gradient(180deg, #60a5fa 0%, #3b82f6 55%, #1d4ed8 100%)",
    accent: "#fbbf24",
    glass: "rgba(255, 255, 255, 0.14)",
    text: "#f8fafc",
    subtext: "rgba(248, 250, 252, 0.72)",
    border: "rgba(255, 255, 255, 0.22)",
    ring: "rgba(253, 230, 138, 0.55)",
    particle: "#fde68a",
  },
  "clear-night": {
    name: "clear-night",
    label: "Clear night",
    gradient:
      "radial-gradient(circle at 80% 20%, rgba(196, 181, 253, 0.35) 0%, transparent 45%), linear-gradient(180deg, #0f172a 0%, #1e1b4b 55%, #020617 100%)",
    accent: "#a5b4fc",
    glass: "rgba(15, 23, 42, 0.45)",
    text: "#e2e8f0",
    subtext: "rgba(226, 232, 240, 0.7)",
    border: "rgba(165, 180, 252, 0.25)",
    ring: "rgba(165, 180, 252, 0.5)",
    particle: "#c4b5fd",
  },
  "cloudy-day": {
    name: "cloudy-day",
    label: "Cloudy",
    gradient:
      "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35) 0%, transparent 50%), linear-gradient(180deg, #94a3b8 0%, #64748b 60%, #475569 100%)",
    accent: "#e2e8f0",
    glass: "rgba(255, 255, 255, 0.12)",
    text: "#f8fafc",
    subtext: "rgba(248, 250, 252, 0.72)",
    border: "rgba(255, 255, 255, 0.2)",
    ring: "rgba(226, 232, 240, 0.5)",
    particle: "#e2e8f0",
  },
  "cloudy-night": {
    name: "cloudy-night",
    label: "Cloudy night",
    gradient:
      "radial-gradient(circle at 70% 30%, rgba(148, 163, 184, 0.25) 0%, transparent 50%), linear-gradient(180deg, #1e293b 0%, #0f172a 60%, #020617 100%)",
    accent: "#94a3b8",
    glass: "rgba(15, 23, 42, 0.45)",
    text: "#e2e8f0",
    subtext: "rgba(226, 232, 240, 0.7)",
    border: "rgba(148, 163, 184, 0.25)",
    ring: "rgba(148, 163, 184, 0.4)",
    particle: "#cbd5e1",
  },
  rain: {
    name: "rain",
    label: "Rainy",
    gradient:
      "radial-gradient(circle at 20% 10%, rgba(96, 165, 250, 0.3) 0%, transparent 55%), linear-gradient(180deg, #1e3a8a 0%, #1e40af 45%, #0f172a 100%)",
    accent: "#60a5fa",
    glass: "rgba(15, 23, 42, 0.4)",
    text: "#e2e8f0",
    subtext: "rgba(226, 232, 240, 0.72)",
    border: "rgba(96, 165, 250, 0.3)",
    ring: "rgba(96, 165, 250, 0.5)",
    particle: "#93c5fd",
  },
  thunderstorm: {
    name: "thunderstorm",
    label: "Thunderstorm",
    gradient:
      "radial-gradient(circle at 80% 0%, rgba(192, 132, 252, 0.4) 0%, transparent 45%), linear-gradient(180deg, #1e1b4b 0%, #0f0d2c 50%, #000000 100%)",
    accent: "#c084fc",
    glass: "rgba(15, 12, 40, 0.55)",
    text: "#ede9fe",
    subtext: "rgba(237, 233, 254, 0.7)",
    border: "rgba(192, 132, 252, 0.35)",
    ring: "rgba(192, 132, 252, 0.55)",
    particle: "#c084fc",
  },
  snow: {
    name: "snow",
    label: "Snowy",
    gradient:
      "radial-gradient(circle at 30% 0%, rgba(255, 255, 255, 0.55) 0%, transparent 55%), linear-gradient(180deg, #cbd5e1 0%, #94a3b8 60%, #475569 100%)",
    accent: "#ffffff",
    glass: "rgba(255, 255, 255, 0.22)",
    text: "#0f172a",
    subtext: "rgba(15, 23, 42, 0.7)",
    border: "rgba(255, 255, 255, 0.5)",
    ring: "rgba(255, 255, 255, 0.7)",
    particle: "#ffffff",
  },
  fog: {
    name: "fog",
    label: "Foggy",
    gradient:
      "radial-gradient(circle at 50% 30%, rgba(226, 232, 240, 0.55) 0%, transparent 60%), linear-gradient(180deg, #94a3b8 0%, #64748b 50%, #475569 100%)",
    accent: "#cbd5e1",
    glass: "rgba(255, 255, 255, 0.18)",
    text: "#f8fafc",
    subtext: "rgba(248, 250, 252, 0.7)",
    border: "rgba(226, 232, 240, 0.3)",
    ring: "rgba(226, 232, 240, 0.5)",
    particle: "#e2e8f0",
  },
  drizzle: {
    name: "drizzle",
    label: "Drizzle",
    gradient:
      "radial-gradient(circle at 20% 20%, rgba(125, 211, 252, 0.3) 0%, transparent 50%), linear-gradient(180deg, #475569 0%, #334155 60%, #1e293b 100%)",
    accent: "#7dd3fc",
    glass: "rgba(30, 41, 59, 0.45)",
    text: "#e2e8f0",
    subtext: "rgba(226, 232, 240, 0.72)",
    border: "rgba(125, 211, 252, 0.3)",
    ring: "rgba(125, 211, 252, 0.5)",
    particle: "#7dd3fc",
  },
};

export function paletteFor(theme: ThemeName): ThemePalette {
  return THEMES[theme];
}
