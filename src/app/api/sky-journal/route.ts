import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { describeWeather } from "@/lib/weather-codes";
import {
  getJournalEntry,
  listJournal,
  upsertJournalEntry,
  type StoredJournalEntry,
} from "@/lib/db";
import type { WeatherPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ entries: listJournal() });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { weather?: WeatherPayload };
  const w = body.weather;
  if (!w) {
    return NextResponse.json({ error: "missing_weather" }, { status: 400 });
  }

  const date = w.current.time.slice(0, 10);
  const existing = getJournalEntry(date);
  if (existing) {
    return NextResponse.json({ entry: existing, entries: listJournal() });
  }

  const today = w.daily.find((d) => d.date === date) ?? w.daily[0];
  const placeLabel = `${w.place.name}${
    w.place.admin1 ? ", " + w.place.admin1 : ""
  }${w.place.country ? ", " + w.place.country : ""}`;

  let text = "";
  let source: "claude" | "heuristic" = "heuristic";

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const client = new Anthropic({ apiKey });
      const cond = describeWeather(w.current.weatherCode);
      const dayHours = w.hourly.filter(
        (h) => h.time.slice(0, 10) === date
      );
      const arc = dayHours
        .filter((_, i) => i % 3 === 0)
        .slice(0, 6)
        .map((h) => {
          const hh = h.time.slice(11, 16);
          const t = Math.round(h.temperature);
          const c = describeWeather(h.weatherCode).label.toLowerCase();
          return `${hh} ${t}°C ${c}`;
        })
        .join(" · ");

      const summary = `Date: ${date}
Location: ${placeLabel}
Now: ${Math.round(w.current.temperature)}°C, ${cond.label}
High/low: ${Math.round(today?.temperatureMax ?? 0)}°C / ${Math.round(
        today?.temperatureMin ?? 0
      )}°C
Arc: ${arc}`;

      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 80,
        system:
          "You write a single short journal line capturing what today's sky and weather felt like — sensory, evocative, but understated. Maximum 14 words. No date, no place name, no emojis, no quotes, no markdown. Plain sentence case. End with a period. Examples: 'A pale blue calm with cold edges and a long, slow afternoon.' 'Wind that pushed clouds across in restless sheets.' 'Mild and forgiving, the kind of day that asks nothing of you.'",
        messages: [{ role: "user", content: summary }],
      });
      const out = msg.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join(" ")
        .replace(/^["'`\s]+|["'`\s]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (out) {
        text = out;
        source = "claude";
      }
    } catch (err) {
      console.error("sky-journal claude error", err);
    }
  }

  if (!text) {
    text = buildHeuristicLine(w);
  }

  const entry: StoredJournalEntry = {
    date,
    text,
    place: placeLabel,
    weatherCode: today?.weatherCode ?? w.current.weatherCode,
    isDay: w.current.isDay,
    tempMax: Math.round(today?.temperatureMax ?? w.current.temperature),
    tempMin: Math.round(today?.temperatureMin ?? w.current.temperature),
    source,
    created_at: new Date().toISOString(),
  };

  const saved = upsertJournalEntry(entry);
  return NextResponse.json({ entry: saved, entries: listJournal() });
}

function buildHeuristicLine(w: WeatherPayload): string {
  const today = w.daily[0];
  const max = Math.round(today?.temperatureMax ?? w.current.temperature);
  const min = Math.round(today?.temperatureMin ?? w.current.temperature);
  const cond = describeWeather(
    today?.weatherCode ?? w.current.weatherCode
  ).label.toLowerCase();
  const tempWord =
    max < 0
      ? "Frigid"
      : max < 10
      ? "Cold"
      : max < 18
      ? "Cool"
      : max < 25
      ? "Mild"
      : max < 30
      ? "Warm"
      : "Hot";
  return `${tempWord} ${cond} day, ${max}°C peak, dipping to ${min}°C overnight.`;
}
