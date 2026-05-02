import type { PressureReading } from "@/app/api/pressure-history/route";

export type Tendency =
  | "rapid-fall"
  | "fall"
  | "slight-fall"
  | "steady"
  | "slight-rise"
  | "rise"
  | "rapid-rise";

export type PressureSummary = {
  current: number;
  delta3h: number;
  delta24h: number;
  tendency: Tendency;
  headline: string;
  detail: string;
  sensitiveNote: string | null;
};

const TENDENCY_LABEL: Record<Tendency, string> = {
  "rapid-fall": "falling fast",
  fall: "falling",
  "slight-fall": "drifting down",
  steady: "steady",
  "slight-rise": "drifting up",
  rise: "rising",
  "rapid-rise": "rising fast",
};

function classify(delta3h: number): Tendency {
  // Thresholds in hPa per 3 hours (NWS/ICAO-style tendency categories).
  if (delta3h <= -3) return "rapid-fall";
  if (delta3h <= -1.5) return "fall";
  if (delta3h <= -0.5) return "slight-fall";
  if (delta3h < 0.5) return "steady";
  if (delta3h < 1.5) return "slight-rise";
  if (delta3h < 3) return "rise";
  return "rapid-rise";
}

function headlineFor(t: Tendency): string {
  switch (t) {
    case "rapid-fall":
      return "pressure dropping fast — storm likely.";
    case "fall":
      return "pressure falling — weather worsening.";
    case "slight-fall":
      return "pressure easing down — change in the air.";
    case "steady":
      return "pressure steady — settled conditions.";
    case "slight-rise":
      return "pressure edging up — clearing along the way.";
    case "rise":
      return "pressure rising — fairer weather building.";
    case "rapid-rise":
      return "pressure rising fast — front cleared, expect cool and breezy.";
  }
}

function detailFor(t: Tendency, delta3h: number, delta24h: number): string {
  const d3 = formatDelta(delta3h);
  const d24 = formatDelta(delta24h);
  switch (t) {
    case "rapid-fall":
      return `down ${d3} in 3h (${d24} over 24h). c drop this steep usually precedes wind, rain, or a thunderstorm within hours — sailors should reef and secure gear.`;
    case "fall":
      return `down ${d3} in 3h (${d24} over 24h). cloud and wind tend to follow a falling glass.`;
    case "slight-fall":
      return `off ${d3} in 3h (${d24} over 24h). subtle, but the trend is downward.`;
    case "steady":
      return `within ${d3} over 3h (${d24} over 24h). the atmosphere is in balance — what you see is what you'll get for a while.`;
    case "slight-rise":
      return `up ${d3} in 3h (${d24} over 24h). slow improvement.`;
    case "rise":
      return `up ${d3} in 3h (${d24} over 24h). high pressure is building in.`;
    case "rapid-rise":
      return `up ${d3} in 3h (${d24} over 24h). a rapid rise often follows a cold front — clearer skies, but stronger wind for a time.`;
  }
}

function formatDelta(d: number): string {
  const sign = d >= 0 ? "+" : "−";
  return `${sign}${Math.abs(d).toFixed(1)} hPa`;
}

export function summarize(readings: PressureReading[]): PressureSummary | null {
  if (readings.length < 2) return null;
  const sorted = [...readings].sort((a, b) =>
    a.time.localeCompare(b.time)
  );
  const last = sorted[sorted.length - 1];
  const lastTime = new Date(last.time).getTime();

  // Find the reading closest to 3 h before the latest, and 24 h before.
  const find = (hours: number) => {
    const target = lastTime - hours * 3600 * 1000;
    let best: PressureReading | null = null;
    let bestDiff = Infinity;
    for (const r of sorted) {
      const diff = Math.abs(new Date(r.time).getTime() - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = r;
      }
    }
    return best;
  };

  const ref3 = find(3) ?? sorted[0];
  const ref24 = find(24) ?? sorted[0];

  const delta3h = last.pressure - ref3.pressure;
  const delta24h = last.pressure - ref24.pressure;
  const tendency = classify(delta3h);

  // Migraine / pressure-sensitivity threshold: studies link 24h swings of
  // ~5–7 hPa to headache onset in susceptible people.
  const swing = Math.abs(delta24h);
  const sensitiveNote =
    swing >= 5
      ? `a ${swing.toFixed(1)} hpa swing in 24 h is the kind of shift that can trigger migraines and joint pain — go gentle if you're sensitive to weather changes.`
      : null;

  return {
    current: last.pressure,
    delta3h,
    delta24h,
    tendency,
    headline: headlineFor(tendency),
    detail: detailFor(tendency, delta3h, delta24h),
    sensitiveNote,
  };
}

export function tendencyLabel(t: Tendency): string {
  return TENDENCY_LABEL[t];
}
