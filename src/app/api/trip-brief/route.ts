import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { describeWeather } from "@/lib/weather-codes";

export const dynamic = "force-dynamic";

type DailyOut = {
  date: string;
  weatherCode: number;
  label: string;
  tMax: number;
  tMin: number;
  precipMm: number;
  precipProb: number;
  windMax: number;
  uvMax: number;
  sunrise: string;
  sunset: string;
};

type PackingItem = {
  item: string;
  why: string;
  priority: "essential" | "smart" | "optional";
};

function todayUtcStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function diffDaysFromToday(d: string): number {
  const today = new Date(todayUtcStr() + "T00:00:00Z").getTime();
  const target = new Date(d + "T00:00:00Z").getTime();
  return Math.round((target - today) / 86400000);
}

function heuristicPacking(daily: DailyOut[]): {
  headline: string;
  packing: PackingItem[];
} {
  const maxT = Math.max(...daily.map((d) => d.tMax));
  const minT = Math.min(...daily.map((d) => d.tMin));
  const wetDays = daily.filter((d) => d.precipProb >= 50 || d.precipMm >= 1).length;
  const highUv = daily.some((d) => d.uvMax >= 6);
  const windy = daily.some((d) => d.windMax >= 35);
  const cold = minT < 5;
  const hot = maxT > 28;

  const items: PackingItem[] = [];
  items.push({
    item: "comfortable walking shoes",
    why: "covers most days regardless of weather",
    priority: "essential",
  });
  if (cold) {
    items.push({ item: "warm jacket", why: `lows near ${Math.round(minT)}°C`, priority: "essential" });
    items.push({ item: "beanie and gloves", why: "wind chill on cold mornings", priority: "smart" });
  }
  if (hot) {
    items.push({ item: "lightweight breathable shirts", why: `highs around ${Math.round(maxT)}°C`, priority: "essential" });
    items.push({ item: "reusable water bottle", why: "stay hydrated in heat", priority: "smart" });
  }
  if (!cold && !hot) {
    items.push({ item: "layers and a light sweater", why: `range ${Math.round(minT)}–${Math.round(maxT)}°C`, priority: "essential" });
  }
  if (wetDays > 0) {
    items.push({
      item: "compact rain jacket or umbrella",
      why: `${wetDays} day${wetDays > 1 ? "s" : ""} with rain risk`,
      priority: wetDays >= 2 ? "essential" : "smart",
    });
  }
  if (highUv) {
    items.push({ item: "sunglasses and sunscreen", why: "UV index hits 6+", priority: "smart" });
  }
  if (windy) {
    items.push({ item: "windbreaker", why: "gusty conditions in forecast", priority: "smart" });
  }
  items.push({
    item: "universal travel adapter",
    why: "always handy abroad",
    priority: "optional",
  });

  const headline = `${cold ? "cool" : hot ? "warm" : "mild"}${wetDays ? ", expect rain" : ", mostly dry"} — pack ${cold ? "warm layers" : hot ? "light fabrics" : "flexible layers"}`;
  return { headline, packing: items.slice(0, 8) };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    place?: {
      name?: string;
      country?: string;
      admin1?: string;
      latitude?: number;
      longitude?: number;
      timezone?: string;
    };
    startDate?: string;
    endDate?: string;
  };

  const p = body.place;
  const startDate = body.startDate;
  const endDate = body.endDate;

  if (!p?.latitude || !p?.longitude || !p?.name) {
    return NextResponse.json({ error: "missing_place" }, { status: 400 });
  }
  if (!startDate || !endDate) {
    return NextResponse.json({ error: "missing_dates" }, { status: 400 });
  }
  if (startDate > endDate) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }

  const startDelta = diffDaysFromToday(startDate);
  const endDelta = diffDaysFromToday(endDate);
  if (endDelta < 0) {
    return NextResponse.json({ error: "trip_in_past" }, { status: 400 });
  }
  if (startDelta > 16) {
    return NextResponse.json(
      { error: "too_far_ahead", message: "Forecast supports up to 16 days from today." },
      { status: 400 }
    );
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(p.latitude));
  url.searchParams.set("longitude", String(p.longitude));
  url.searchParams.set("timezone", p.timezone ?? "auto");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "uv_index_max",
      "sunrise",
      "sunset",
    ].join(",")
  );

  let raw: {
    daily?: {
      time?: string[];
      weather_code?: number[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      precipitation_sum?: number[];
      precipitation_probability_max?: number[];
      wind_speed_10m_max?: number[];
      uv_index_max?: number[];
      sunrise?: string[];
      sunset?: string[];
    };
  };
  try {
    const r = await fetch(url.toString(), { cache: "no-store" });
    if (!r.ok) throw new Error("forecast_fetch_failed");
    raw = await r.json();
  } catch (err) {
    console.error("trip-brief fetch error", err);
    return NextResponse.json({ error: "forecast_failed" }, { status: 502 });
  }

  const d = raw.daily;
  if (!d?.time?.length) {
    return NextResponse.json({ error: "no_data" }, { status: 502 });
  }

  const daily: DailyOut[] = d.time.map((date, i) => {
    const code = d.weather_code?.[i] ?? 0;
    return {
      date,
      weatherCode: code,
      label: describeWeather(code).label,
      tMax: d.temperature_2m_max?.[i] ?? 0,
      tMin: d.temperature_2m_min?.[i] ?? 0,
      precipMm: d.precipitation_sum?.[i] ?? 0,
      precipProb: d.precipitation_probability_max?.[i] ?? 0,
      windMax: d.wind_speed_10m_max?.[i] ?? 0,
      uvMax: d.uv_index_max?.[i] ?? 0,
      sunrise: d.sunrise?.[i] ?? "",
      sunset: d.sunset?.[i] ?? "",
    };
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const fb = heuristicPacking(daily);
    return NextResponse.json({
      place: p,
      span: { start: startDate, end: endDate, days: daily.length },
      daily,
      headline: fb.headline,
      packing: fb.packing,
      source: "heuristic",
    });
  }

  try {
    const client = new Anthropic({ apiKey });
    const arc = daily
      .map(
        (x) =>
          `${x.date} ${Math.round(x.tMin)}–${Math.round(x.tMax)}°C ${x.label.toLowerCase()} ${Math.round(x.precipProb)}%rain ${x.precipMm.toFixed(1)}mm wind${Math.round(x.windMax)}km/h UV${Math.round(x.uvMax)}`
      )
      .join("\n");

    const summary = `Destination: ${p.name}${p.admin1 ? ", " + p.admin1 : ""}${p.country ? ", " + p.country : ""}
Trip: ${startDate} to ${endDate} (${daily.length} day${daily.length > 1 ? "s" : ""})
Daily forecast:
${arc}`;

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: `You are a concise trip brief writer. Given a daily forecast for a trip, return ONLY a JSON object, no prose, no markdown, no code fence:
{"headline":"<one short sentence summarizing the trip weather, lowercase, ≤14 words>","packing":[{"item":"<short noun phrase, lowercase>","why":"<≤12 words, cite a specific weather fact>","priority":"essential|smart|optional"}]}
Return between 6 and 9 packing items. Order by priority: essential first, then smart, then optional. Items must be concrete and packable (clothes, gear, accessories, small toiletries) — no advice like "check the forecast". Cite specific facts in 'why' (e.g. "highs near 28°C", "rain on 3 of 5 days", "UV peaks at 8"). Don't repeat items. Use °C for temperatures.`,
      messages: [{ role: "user", content: summary }],
    });

    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) throw new Error("no_json");
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
      headline?: string;
      packing?: PackingItem[];
    };

    const packing = (parsed.packing ?? [])
      .filter(
        (s) =>
          s &&
          typeof s.item === "string" &&
          typeof s.why === "string" &&
          ["essential", "smart", "optional"].includes(s.priority)
      )
      .slice(0, 9);

    if (!parsed.headline || packing.length < 4) throw new Error("incomplete");

    return NextResponse.json({
      place: p,
      span: { start: startDate, end: endDate, days: daily.length },
      daily,
      headline: parsed.headline,
      packing,
      source: "claude",
    });
  } catch (err) {
    console.error("trip-brief claude error", err);
    const fb = heuristicPacking(daily);
    return NextResponse.json({
      place: p,
      span: { start: startDate, end: endDate, days: daily.length },
      daily,
      headline: fb.headline,
      packing: fb.packing,
      source: "heuristic",
    });
  }
}
