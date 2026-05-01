import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type ClimateLensPayload = {
  baselineMean: number;
  baselineYears: { from: number; to: number };
  baselineSampleCount: number;
  todayMean: number;
  todayDate: string;
  delta: number;
  monthDay: string;
  dateLabel: string;
};

const BASELINE_FROM = 1990;
const BASELINE_TO = 1999;
const DAY_WINDOW = 3; // ±3 calendar days, smooths out noisy single-day readings

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = sp.get("lat");
  const lon = sp.get("lon");
  const timezone = sp.get("timezone") ?? "auto";

  if (!lat || !lon) {
    return NextResponse.json({ error: "missing_coords" }, { status: 400 });
  }

  const archiveUrl = new URL("https://archive-api.open-meteo.com/v1/archive");
  archiveUrl.searchParams.set("latitude", lat);
  archiveUrl.searchParams.set("longitude", lon);
  archiveUrl.searchParams.set("start_date", `${BASELINE_FROM}-01-01`);
  archiveUrl.searchParams.set("end_date", `${BASELINE_TO}-12-31`);
  archiveUrl.searchParams.set("daily", "temperature_2m_mean");
  archiveUrl.searchParams.set("timezone", timezone);

  const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
  forecastUrl.searchParams.set("latitude", lat);
  forecastUrl.searchParams.set("longitude", lon);
  forecastUrl.searchParams.set("daily", "temperature_2m_mean");
  forecastUrl.searchParams.set("forecast_days", "1");
  forecastUrl.searchParams.set("timezone", timezone);

  try {
    const [ar, fr] = await Promise.all([
      fetch(archiveUrl, { next: { revalidate: 60 * 60 * 24 * 30 } }),
      fetch(forecastUrl, { cache: "no-store" }),
    ]);
    if (!ar.ok || !fr.ok) {
      return NextResponse.json({ error: "lens_failed" }, { status: 502 });
    }
    const ad = await ar.json();
    const fd = await fr.json();

    const todayDate: string = fd?.daily?.time?.[0] ?? "";
    const todayMean: number = fd?.daily?.temperature_2m_mean?.[0];
    if (!todayDate || !Number.isFinite(todayMean)) {
      return NextResponse.json({ error: "no_today" }, { status: 502 });
    }
    const monthDay = todayDate.slice(5, 10);

    const dates: string[] = ad?.daily?.time ?? [];
    const means: (number | null)[] = ad?.daily?.temperature_2m_mean ?? [];
    const samples: number[] = [];
    for (let i = 0; i < dates.length; i++) {
      const v = means[i];
      if (typeof v !== "number") continue;
      if (isWithinDayWindow(dates[i].slice(5, 10), monthDay, DAY_WINDOW)) {
        samples.push(v);
      }
    }
    if (samples.length === 0) {
      return NextResponse.json({ error: "no_baseline" }, { status: 502 });
    }
    const baselineMean =
      samples.reduce((a, b) => a + b, 0) / samples.length;

    const payload: ClimateLensPayload = {
      baselineMean,
      baselineYears: { from: BASELINE_FROM, to: BASELINE_TO },
      baselineSampleCount: samples.length,
      todayMean,
      todayDate,
      delta: todayMean - baselineMean,
      monthDay,
      dateLabel: formatDateLabel(todayDate),
    };
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "lens_failed" }, { status: 502 });
  }
}

function mdToDayIndex(md: string): number {
  const [m, d] = md.split("-").map(Number);
  // Cumulative days at start of each month in a non-leap year.
  const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  if (!Number.isFinite(m) || !Number.isFinite(d) || m < 1 || m > 12) return 0;
  return cum[m - 1] + d;
}

function isWithinDayWindow(md: string, target: string, window: number): boolean {
  const a = mdToDayIndex(md);
  const b = mdToDayIndex(target);
  let diff = Math.abs(a - b);
  if (diff > 182) diff = 365 - diff; // year wrap
  return diff <= window;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
