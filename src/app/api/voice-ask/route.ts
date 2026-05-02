import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { describeWeather } from "@/lib/weather-codes";
import type { WeatherPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    question?: string;
    weather?: WeatherPayload;
  };
  const question = (body.question ?? "").trim();
  const w = body.weather;

  if (!question) {
    return NextResponse.json({ error: "missing_question" }, { status: 400 });
  }
  if (!w) {
    return NextResponse.json({ error: "missing_weather" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "missing_api_key" },
      { status: 503 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });
    const cond = describeWeather(w.current.weatherCode);
    const dayKey = w.current.time.slice(0, 10);
    const dayHours = w.hourly.filter((h) => h.time.slice(0, 10) === dayKey);
    const fromIdx = dayHours.findIndex((h) => h.time === w.current.time);
    const remaining = fromIdx >= 0 ? dayHours.slice(fromIdx) : dayHours;
    const arc = remaining
      .slice(0, 18)
      .map((h) => {
        const hh = h.time.slice(11, 16);
        const t = Math.round(h.temperature);
        const c = describeWeather(h.weatherCode).label.toLowerCase();
        const p = Math.round(h.precipitationProbability ?? 0);
        const wind = Math.round(h.windSpeed);
        return `${hh} ${t}°C feels${Math.round(h.apparentTemperature)}° ${c} ${p}%rain wind${wind}km/h`;
      })
      .join("\n");

    const today = w.daily[0];
    const tomorrow = w.daily[1];
    const summary = `location: ${w.place.name}${w.place.admin1 ? ", " + w.place.admin1 : ""}${w.place.country ? ", " + w.place.country : ""}
current local time: ${w.current.time}
now: ${Math.round(w.current.temperature)}°c feels ${Math.round(w.current.apparentTemperature)}°c, ${cond.label}, humidity ${w.current.humidity}%, wind ${Math.round(w.current.windSpeed)} km/h, UV ${w.current.uvIndex}
today: high ${Math.round(today?.temperatureMax ?? 0)}°c / low ${Math.round(today?.temperatureMin ?? 0)}°c, ${today?.precipitationProbabilityMax ?? 0}% max rain chance, sunset ${today?.sunset?.slice(11, 16) ?? "n/a"}
tomorrow: high ${Math.round(tomorrow?.temperatureMax ?? 0)}°c / low ${Math.round(tomorrow?.temperatureMin ?? 0)}°c, ${tomorrow?.precipitationProbabilityMax ?? 0}% max rain chance
hourly arc:
${arc}`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 180,
      system:
        "you are a concise spoken weather assistant. The user asks a question by voice and your reply will be spoken aloud by a text-to-speech engine. answer in 1-2 short sentences, plain conversational english, no markdown, no bullets, no lists, no quotation marks, no emojis. Round temperatures to whole degrees and include the °c symbol when stating values. if the question references a specific time (e.g. 'at 8'), interpret it against the local time provided and the hourly arc, picking the closest hour. if the question is ambiguous, give a direct best-guess answer rather than asking for clarification. be specific and useful — recommend 'yes bring a jacket' or 'no, you'll be fine' style answers when asked. never invent data not in the weather context. if the weather context cannot answer the question, say so briefly.",
      messages: [
        {
          role: "user",
          content: `weather context:\n${summary}\n\nuser question: ${question}`,
        },
      ],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join(" ")
      .replace(/^["'`\s]+|["'`\s]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return NextResponse.json({
      answer: text || "i couldn't come up with an answer for that.",
    });
  } catch (err) {
    console.error("voice-ask error", err);
    return NextResponse.json({ error: "claude_failed" }, { status: 500 });
  }
}
