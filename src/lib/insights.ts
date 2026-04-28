import { describeWeather } from "./weather-codes";
import type { Snapshot, WeatherPayload } from "./types";

export function buildHeuristicInsights(
  weather: WeatherPayload,
  snapshot: Snapshot,
  options: { scrubbed?: boolean } = {}
): string[] {
  const cond = describeWeather(snapshot.weatherCode);
  const t = Math.round(snapshot.temperature);
  const feels = Math.round(snapshot.apparentTemperature);
  const wind = Math.round(snapshot.windSpeed);
  const uv = snapshot.uvIndex ?? 0;
  const aqi = weather.airQuality?.europeanAqi;

  const dayKey = snapshot.time.slice(0, 10);
  const day = weather.daily.find((d) => d.date === dayKey) ?? weather.daily[0];
  const rainProb = options.scrubbed
    ? snapshot.precipitationProbability
    : day?.precipitationProbabilityMax ?? snapshot.precipitationProbability;

  const when = options.scrubbed ? whenLabel(snapshot.time) : null;
  const prefix = when ? `${when}: ` : "";

  const vibe = (() => {
    if (cond.theme === "thunderstorm") return `${prefix}Volatile skies — keep an eye on alerts.`;
    if (cond.theme === "rain") return `${prefix}${cond.label} — bring rain gear.`;
    if (cond.theme === "snow") return `${prefix}Snow on the ground — go gentle on roads.`;
    if (cond.theme === "fog") return `${prefix}Low visibility outside — drive carefully.`;
    if (!snapshot.isDay) return `${prefix}${cond.label} night — feels ${feels}°C.`;
    if (t >= 28) return `${prefix}Hot at ${t}°C — hydrate well.`;
    if (t <= 5) return `${prefix}Cold snap — feels like ${feels}°C.`;
    return `${prefix}${cond.label} and ${t}°C — pleasant overall.`;
  })();

  const wear = (() => {
    if (feels <= 0) return "Heavy coat, gloves, scarf — full winter kit.";
    if (feels <= 10) return "Warm jacket and a layer underneath.";
    if (feels <= 18) return "Light jacket or a long-sleeve.";
    if (feels <= 25) return "T-shirt weather, maybe a light layer for evening.";
    return "Breathable, light clothing — stay cool.";
  })();

  const tip = (() => {
    if (rainProb >= 60) return `${rainProb}% rain chance — pack an umbrella.`;
    if (uv >= 7) return `UV index ${Math.round(uv)} — sunscreen if you'll be outdoors.`;
    if (wind >= 35) return `Strong wind at ${wind} km/h — secure loose items.`;
    if ((aqi ?? 0) >= 60) return "Air quality is mediocre — limit intense outdoor exercise.";
    if (cond.theme === "clear-day") return "Great day for a walk or outdoor coffee.";
    if (cond.theme === "clear-night") return "Crisp evening — good for a stroll if you bundle up.";
    return "No major weather alerts — proceed as planned.";
  })();

  return [vibe, wear, tip];
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
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Today ${time}`;
  if (isTomorrow) return `Tomorrow ${time}`;
  const wd = d.toLocaleDateString(undefined, { weekday: "short" });
  return `${wd} ${time}`;
}
