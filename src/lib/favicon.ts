import type { ThemeName } from "./types";
import { paletteFor } from "./weather-themes";

const BG: Record<ThemeName, [string, string]> = {
  "clear-day": ["#60a5fa", "#1d4ed8"],
  "clear-night": ["#1e1b4b", "#020617"],
  "cloudy-day": ["#94a3b8", "#475569"],
  "cloudy-night": ["#1e293b", "#020617"],
  rain: ["#1e3a8a", "#0f172a"],
  thunderstorm: ["#1e1b4b", "#000000"],
  snow: ["#cbd5e1", "#64748b"],
  fog: ["#94a3b8", "#475569"],
  drizzle: ["#475569", "#1e293b"],
};

function glyphFor(theme: ThemeName, accent: string, particle: string): string {
  switch (theme) {
    case "clear-day":
      return `
        <g>
          <circle cx="32" cy="32" r="13" fill="${accent}"/>
          <g stroke="${accent}" stroke-width="3" stroke-linecap="round">
            <line x1="32" y1="8" x2="32" y2="14"/>
            <line x1="32" y1="50" x2="32" y2="56"/>
            <line x1="8" y1="32" x2="14" y2="32"/>
            <line x1="50" y1="32" x2="56" y2="32"/>
            <line x1="14" y1="14" x2="18" y2="18"/>
            <line x1="46" y1="46" x2="50" y2="50"/>
            <line x1="14" y1="50" x2="18" y2="46"/>
            <line x1="46" y1="18" x2="50" y2="14"/>
          </g>
        </g>`;
    case "clear-night":
      return `
        <path d="M42 14 a18 18 0 1 0 8 30 14 14 0 0 1 -8 -30z" fill="${accent}"/>
        <circle cx="18" cy="18" r="1.4" fill="${particle}"/>
        <circle cx="14" cy="34" r="1.2" fill="${particle}"/>
        <circle cx="22" cy="50" r="1.3" fill="${particle}"/>`;
    case "cloudy-day":
      return `
        <circle cx="22" cy="22" r="9" fill="${accent}" opacity="0.85"/>
        <ellipse cx="34" cy="38" rx="20" ry="11" fill="#f8fafc"/>`;
    case "cloudy-night":
      return `
        <path d="M44 18 a12 12 0 1 0 5 20 9 9 0 0 1 -5 -20z" fill="${accent}" opacity="0.9"/>
        <ellipse cx="30" cy="42" rx="20" ry="11" fill="#cbd5e1"/>`;
    case "rain":
      return `
        <ellipse cx="32" cy="26" rx="20" ry="11" fill="#cbd5e1"/>
        <g fill="${accent}">
          <path d="M20 42 l-3 8 a3 3 0 1 0 6 0 z"/>
          <path d="M32 44 l-3 8 a3 3 0 1 0 6 0 z"/>
          <path d="M44 42 l-3 8 a3 3 0 1 0 6 0 z"/>
        </g>`;
    case "thunderstorm":
      return `
        <ellipse cx="32" cy="24" rx="20" ry="11" fill="#475569"/>
        <path d="M30 36 L22 50 L30 50 L26 60 L40 44 L32 44 L36 36 Z" fill="${accent}"/>`;
    case "snow":
      return `
        <ellipse cx="32" cy="24" rx="20" ry="11" fill="#f8fafc"/>
        <g fill="${accent}" stroke="${accent}" stroke-width="2" stroke-linecap="round">
          <circle cx="20" cy="46" r="2"/>
          <circle cx="32" cy="50" r="2"/>
          <circle cx="44" cy="46" r="2"/>
        </g>`;
    case "fog":
      return `
        <g stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity="0.9">
          <line x1="12" y1="22" x2="52" y2="22"/>
          <line x1="16" y1="32" x2="48" y2="32"/>
          <line x1="10" y1="42" x2="54" y2="42"/>
          <line x1="18" y1="52" x2="46" y2="52"/>
        </g>`;
    case "drizzle":
      return `
        <ellipse cx="32" cy="24" rx="20" ry="11" fill="#cbd5e1"/>
        <g stroke="${accent}" stroke-width="3" stroke-linecap="round">
          <line x1="22" y1="40" x2="20" y2="48"/>
          <line x1="32" y1="42" x2="30" y2="50"/>
          <line x1="42" y1="40" x2="40" y2="48"/>
        </g>`;
  }
}

export function buildFaviconSvg(theme: ThemeName): string {
  const palette = paletteFor(theme);
  const [bg1, bg2] = BG[theme];
  const glyph = glyphFor(theme, palette.accent, palette.particle);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#bg)"/>${glyph}</svg>`;
}

export function faviconDataUrl(theme: ThemeName): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(buildFaviconSvg(theme))}`;
}
