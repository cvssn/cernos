import { describeWeather } from "./weather-codes";
import type { Snapshot, WeatherPayload } from "./types";

export function buildHeuristicNarrative(
  weather: WeatherPayload,
  snapshot: Snapshot,
  options: { scrubbed?: boolean } = {}
): string {
  const cond = describeWeather(snapshot.weatherCode);
  const t = Math.round(snapshot.temperature);
  const dayKey = snapshot.time.slice(0, 10);
  const day = weather.daily.find((d) => d.date === dayKey) ?? weather.daily[0];
  const high = Math.round(day?.temperatureMax ?? t);
  const low = Math.round(day?.temperatureMin ?? t);
  const dayHours = weather.hourly.filter(
    (h) => h.time.slice(0, 10) === dayKey
  );

  const tempWord =
    t < 5 ? "cold" : t < 12 ? "cool" : t < 20 ? "mild" : t < 28 ? "warm" : "hot";

  const peak = dayHours.reduce<Snapshot | null>(
    (best, h) => (!best || h.temperature > best.temperature ? h : best),
    null
  );

  const heaviestRain = dayHours
    .filter((h) => (h.precipitationProbability ?? 0) >= 50)
    .reduce<Snapshot | null>(
      (best, h) =>
        !best || (h.precipitation ?? 0) > (best.precipitation ?? 0) ? h : best,
      null
    );

  const evening =
    dayHours.find((h) => Number(h.time.slice(11, 13)) === 19) ??
    dayHours.find((h) => Number(h.time.slice(11, 13)) === 20);

  const baseLabel = cond.label.toLowerCase();
  let s1 = `${capFirst(tempWord)} ${t}°C with ${baseLabel}`;
  if (
    peak &&
    peak.time !== snapshot.time &&
    peak.temperature - snapshot.temperature >= 2
  ) {
    s1 += `, climbing to ${high}°C around ${formatHour(peak.time)}`;
  } else if (high - low >= 5) {
    s1 += ` (today ${low}–${high}°C)`;
  }

  const parts: string[] = [];
  if (heaviestRain) {
    const desc = describeWeather(heaviestRain.weatherCode).label.toLowerCase();
    parts.push(`${desc} around ${formatHour(heaviestRain.time)}`);
  }
  if (evening) {
    const eTemp = Math.round(evening.temperature);
    const eCond = describeWeather(evening.weatherCode);
    const tail =
      eCond.theme === "clear-day" || eCond.theme === "clear-night"
        ? "clearing"
        : eCond.theme === "rain" || eCond.theme === "snow"
        ? "staying wet"
        : "settling";
    parts.push(`${tail} into a ${eTemp}°C evening`);
  }
  const s2 = parts.length
    ? capFirst(parts.join(", "))
    : `Low of ${low}°C overnight`;

  const prefix = options.scrubbed ? `${whenLabel(snapshot.time)} — ` : "";
  return `${prefix}${s1}. ${s2}.`;
}

function capFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatHour(iso: string): string {
  const h = Number(iso.slice(11, 13));
  if (h === 0) return "midnight";
  if (h === 12) return "noon";
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

function whenLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();
  const time = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sameDay) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  const wd = d.toLocaleDateString(undefined, { weekday: "short" });
  return `${wd} ${time}`;
}
