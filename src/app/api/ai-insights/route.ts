import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { describeWeather } from "@/lib/weather-codes";
import { buildHeuristicNarrative } from "@/lib/insights";
import { getLanguageDisplayName, sanitizeLocale } from "@/lib/locale";
import type { WeatherPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    weather?: WeatherPayload;
    locale?: string;
  };
  const w = body.weather;
  if (!w) {
    return NextResponse.json({ error: "missing_weather" }, { status: 400 });
  }
  const locale = sanitizeLocale(body.locale);
  const isEnglish = locale.toLowerCase().startsWith("en");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      narrative: buildHeuristicNarrative(w, w.current),
      source: "heuristic",
    });
  }

  try {
    const client = new Anthropic({ apiKey });
    const cond = describeWeather(w.current.weatherCode);
    const dayKey = w.current.time.slice(0, 10);
    const dayHours = w.hourly.filter((h) => h.time.slice(0, 10) === dayKey);
    const fromIdx = dayHours.findIndex((h) => h.time === w.current.time);
    const remaining = fromIdx >= 0 ? dayHours.slice(fromIdx) : dayHours;
    const arc = remaining
      .slice(0, 14)
      .map((h) => {
        const hh = h.time.slice(11, 16);
        const t = Math.round(h.temperature);
        const c = describeWeather(h.weatherCode).label.toLowerCase();
        const p = Math.round(h.precipitationProbability ?? 0);
        return `${hh} ${t}°C ${c} ${p}% rain`;
      })
      .join("\n");

    const today = w.daily[0];
    const summary = `Location: ${w.place.name}${w.place.admin1 ? ", " + w.place.admin1 : ""}${w.place.country ? ", " + w.place.country : ""}
Now (${w.current.time.slice(11, 16)}): ${Math.round(w.current.temperature)}°C feels ${Math.round(w.current.apparentTemperature)}°C, ${cond.label}
Today: high ${Math.round(today?.temperatureMax ?? 0)}°C / low ${Math.round(today?.temperatureMin ?? 0)}°C, ${today?.precipitationProbabilityMax ?? 0}% max rain chance
Hourly arc:
${arc}`;

    const langName = getLanguageDisplayName(locale, "en");
    const langDirective = isEnglish
      ? ""
      : ` Write the entire response in ${langName} (BCP-47 locale: ${locale}). Use natural everyday phrasing for that language and its conventional sentence casing — do not force lowercase if the language doesn't use it that way (e.g. German capitalizes nouns). Do not mix in English words. Keep °C and digit numerals regardless of language. The example below is English-style; produce an equivalent in ${langName}, matching its grammar and word order.`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 260,
      system:
        "You write a single flowing weather narrative as exactly two sentences. Cover: the starting conditions, how the day evolves (the peak temperature and roughly when it lands), any rain or storms with rough timing (e.g. 'around 4pm'), and how the evening settles. Conversational, plain sentence case, no bullets, no headers, no quotation marks, no emojis, no markdown. Under 50 words total. Round temperatures to whole degrees and include the °C symbol. Example output: 'Cool 9°C start, pushes to 16°C by 2pm with brief showers around 4, clears for a calm evening.'" +
        langDirective,
      messages: [{ role: "user", content: summary }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .replace(/^["'`\s]+|["'`\s]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return NextResponse.json({
      narrative: text || buildHeuristicNarrative(w, w.current),
      source: text ? "claude" : "heuristic",
    });
  } catch (err) {
    console.error("ai-insights error", err);
    return NextResponse.json({
      narrative: buildHeuristicNarrative(w, w.current),
      source: "heuristic",
    });
  }
}
