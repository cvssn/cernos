import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { describeWeather } from "@/lib/weather-codes";
import { buildHeuristicInsights } from "@/lib/insights";
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
      insights: buildHeuristicInsights(w, w.current),
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
      insights: lines.length ? lines : buildHeuristicInsights(w, w.current),
      source: "claude",
    });
  } catch (err) {
    console.error("ai-insights error", err);
    return NextResponse.json({
      insights: buildHeuristicInsights(w, w.current),
      source: "heuristic",
    });
  }
}
