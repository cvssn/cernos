import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { describeWeather } from "@/lib/weather-codes";
import type { WeatherPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_KINDS = [
  "run",
  "bike",
  "walk",
  "picnic",
  "beach",
  "garden",
  "photo",
  "museum",
  "cafe",
  "read",
  "movie",
  "cook",
  "stargaze",
  "errand",
] as const;

type Kind = (typeof ALLOWED_KINDS)[number];

type Suggestion = {
  kind: Kind;
  title: string;
  confidence: "high" | "medium" | "low";
  reason: string;
};

function fallback(w: WeatherPayload): Suggestion[] {
  const c = w.current;
  const wet = (c.precipitationProbability ?? 0) > 50 || c.precipitation > 0.2;
  const cold = c.apparentTemperature < 5;
  const hot = c.apparentTemperature > 28;
  const windy = c.windSpeed > 30;
  const niceOut = !wet && !cold && !hot && !windy && c.isDay;

  if (niceOut) {
    return [
      { kind: "run", title: "go for a run", confidence: "high", reason: `mild ${Math.round(c.temperature)}°C, low rain risk` },
      { kind: "picnic", title: "have a picnic", confidence: "high", reason: "dry and comfortable outside" },
      { kind: "cafe", title: "sit at a cafe terrace", confidence: "medium", reason: "good light, soft breeze" },
    ];
  }
  if (wet) {
    return [
      { kind: "museum", title: "visit a museum", confidence: "high", reason: "rain expected, stay dry" },
      { kind: "read", title: "read indoors", confidence: "high", reason: "cozy weather for a book" },
      { kind: "cook", title: "cook something slow", confidence: "medium", reason: "nothing pulls you outside" },
    ];
  }
  if (cold) {
    return [
      { kind: "cafe", title: "warm up at a cafe", confidence: "high", reason: `feels ${Math.round(c.apparentTemperature)}°C outside` },
      { kind: "movie", title: "catch a film", confidence: "medium", reason: "too chilly to linger outdoors" },
      { kind: "walk", title: "brisk walk if bundled", confidence: "low", reason: "doable with layers" },
    ];
  }
  return [
    { kind: "read", title: "read indoors", confidence: "medium", reason: "weather not in your favor" },
    { kind: "errand", title: "knock out errands", confidence: "medium", reason: "use the time productively" },
    { kind: "cook", title: "cook a proper meal", confidence: "low", reason: "good rainy-day default" },
  ];
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { weather?: WeatherPayload };
  const w = body.weather;
  if (!w) {
    return NextResponse.json({ error: "missing_weather" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      suggestions: fallback(w),
      source: "heuristic",
    });
  }

  try {
    const client = new Anthropic({ apiKey });
    const cond = describeWeather(w.current.weatherCode);
    const dayKey = w.current.time.slice(0, 10);
    const dayHours = w.hourly.filter((h) => h.time.slice(0, 10) === dayKey);
    const fromIdx = dayHours.findIndex((h) => h.time === w.current.time);
    const startIdx = fromIdx >= 0 ? fromIdx : 0;
    const window4 = dayHours.slice(startIdx, startIdx + 5);
    const arc = window4
      .map((h) => {
        const hh = h.time.slice(11, 16);
        const t = Math.round(h.temperature);
        const feels = Math.round(h.apparentTemperature);
        const c = describeWeather(h.weatherCode).label.toLowerCase();
        const p = Math.round(h.precipitationProbability ?? 0);
        const wind = Math.round(h.windSpeed);
        return `${hh} ${t}°C feels${feels}° ${c} ${p}%rain wind${wind}km/h`;
      })
      .join("\n");

    const summary = `Location: ${w.place.name}${w.place.admin1 ? ", " + w.place.admin1 : ""}${w.place.country ? ", " + w.place.country : ""}
Local time now: ${w.current.time.slice(11, 16)}
Now: ${Math.round(w.current.temperature)}°C feels ${Math.round(w.current.apparentTemperature)}°C, ${cond.label}, humidity ${w.current.humidity}%, wind ${Math.round(w.current.windSpeed)} km/h, UV ${w.current.uvIndex}, ${w.current.isDay ? "daytime" : "after dark"}
Next 4 hours:
${arc}`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 380,
      system: `You are an activity matchmaker. Given the next 4 hours of weather, recommend exactly 3 distinct activities the user could do. Mix at least one outdoor and one indoor option unless the weather strongly favors one side. Return ONLY a JSON object, no prose, no markdown, no code fence:
{"suggestions":[{"kind":"<one of: ${ALLOWED_KINDS.join("|")}>","title":"<short verb phrase, lowercase, max 5 words>","confidence":"high|medium|low","reason":"<≤10 words, cites a specific weather fact like temp, rain%, wind, UV, or daylight>"}]}
Confidence rules: high = weather clearly supports it; medium = workable with caveats; low = possible but not ideal. Never repeat the same kind twice. Titles stay lowercase, no punctuation at the end.`,
      messages: [{ role: "user", content: summary }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) {
      return NextResponse.json({ suggestions: fallback(w), source: "heuristic" });
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      suggestions?: Suggestion[];
    };
    const suggestions = (parsed.suggestions ?? [])
      .filter(
        (s) =>
          s &&
          ALLOWED_KINDS.includes(s.kind) &&
          ["high", "medium", "low"].includes(s.confidence) &&
          typeof s.title === "string" &&
          typeof s.reason === "string"
      )
      .slice(0, 3);

    if (suggestions.length < 3) {
      return NextResponse.json({ suggestions: fallback(w), source: "heuristic" });
    }

    return NextResponse.json({ suggestions, source: "claude" });
  } catch (err) {
    console.error("activity-suggestions error", err);
    return NextResponse.json({ suggestions: fallback(w), source: "heuristic" });
  }
}
