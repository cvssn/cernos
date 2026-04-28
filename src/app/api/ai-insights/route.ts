import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { describeWeather } from "@/lib/weather-codes";
import type { WeatherPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { weather?: WeatherPayload };
  const w = body.weather;
  if (!w) {
    return NextResponse.json({ error: "missing_weather" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      insights: heuristicInsights(w),
      source: "heuristic",
    });
  }

  try {
    const client = new Anthropic({ apiKey });
    const cond = describeWeather(w.current.weatherCode);
    const summary = `Location: ${w.place.name}${w.place.admin1 ? ", " + w.place.admin1 : ""}${w.place.country ? ", " + w.place.country : ""}
Now: ${Math.round(w.current.temperature)}°C (feels ${Math.round(w.current.apparentTemperature)}°C), ${cond.label}
Humidity: ${w.current.humidity}%
Wind: ${Math.round(w.current.windSpeed)} km/h
UV index: ${w.current.uvIndex ?? "n/a"}
Cloud cover: ${w.current.cloudCover}%
Today high/low: ${Math.round(w.daily[0]?.temperatureMax ?? 0)}°C / ${Math.round(w.daily[0]?.temperatureMin ?? 0)}°C
Rain chance today: ${w.daily[0]?.precipitationProbabilityMax ?? 0}%
Air quality (EU): ${w.airQuality?.europeanAqi ?? "n/a"}`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 380,
      system:
        "You are a friendly weather concierge. Given current weather, write 3 short bullet points: (1) a one-line vibe summary, (2) what to wear, (3) one practical recommendation (commute, activity, health). Be warm, specific, under 25 words per bullet. Use no emojis. Output exactly 3 lines starting with '- '.",
      messages: [{ role: "user", content: summary }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    return NextResponse.json({
      insights: lines.length ? lines : heuristicInsights(w),
      source: "claude",
    });
  } catch (err) {
    console.error("ai-insights error", err);
    return NextResponse.json({
      insights: heuristicInsights(w),
      source: "heuristic",
    });
  }
}

function heuristicInsights(w: WeatherPayload): string[] {
  const cond = describeWeather(w.current.weatherCode);
  const t = Math.round(w.current.temperature);
  const feels = Math.round(w.current.apparentTemperature);
  const rainProb = w.daily[0]?.precipitationProbabilityMax ?? 0;
  const wind = Math.round(w.current.windSpeed);
  const uv = w.current.uvIndex ?? 0;

  const vibe = (() => {
    if (cond.theme === "thunderstorm") return "Volatile skies — keep an eye on alerts.";
    if (cond.theme === "rain") return `${cond.label} now — bring rain gear.`;
    if (cond.theme === "snow") return "Snow on the ground — go gentle on roads.";
    if (cond.theme === "fog") return "Low visibility outside — drive carefully.";
    if (!w.current.isDay) return `${cond.label} night — feels ${feels}°C.`;
    if (t >= 28) return `Hot day at ${t}°C — hydrate well.`;
    if (t <= 5) return `Cold snap — feels like ${feels}°C.`;
    return `${cond.label} and ${t}°C — pleasant overall.`;
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
    if ((w.airQuality?.europeanAqi ?? 0) >= 60) return "Air quality is mediocre — limit intense outdoor exercise.";
    if (cond.theme === "clear-day") return "Great day for a walk or outdoor coffee.";
    return "No major weather alerts — proceed as planned.";
  })();

  return [vibe, wear, tip];
}
