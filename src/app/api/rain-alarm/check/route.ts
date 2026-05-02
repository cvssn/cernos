import { NextRequest, NextResponse } from "next/server";
import {
  listRainAlarms,
  markRainAlarmFired,
  removeRainAlarm,
} from "@/lib/db";
import { sendPush } from "@/lib/push";

export const dynamic = "force-dynamic";

const RAIN_THRESHOLD_MM = 0.2;
const LOOKAHEAD_MIN = 25;
const COOLDOWN_MIN = 45;

type ForecastResp = {
  minutely_15?: {
    time?: string[];
    precipitation?: number[];
  };
  hourly?: {
    time?: string[];
    precipitation?: number[];
    precipitation_probability?: number[];
  };
};

function minutesUntil(timeIso: string, now: number): number {
  const t = new Date(timeIso).getTime();
  return (t - now) / 60000;
}

async function fetchPrecip(lat: number, lon: number, timezone?: string): Promise<{
  startsInMin: number | null;
  precipMm: number;
}> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("timezone", timezone ?? "auto");
  url.searchParams.set("minutely_15", "precipitation");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("forecast_minutely_15", "8");

  const r = await fetch(url.toString(), { cache: "no-store" });
  if (!r.ok) throw new Error("forecast_fetch_failed");
  const data = (await r.json()) as ForecastResp;

  const times = data.minutely_15?.time ?? [];
  const precip = data.minutely_15?.precipitation ?? [];
  const now = Date.now();

  for (let i = 0; i < times.length; i++) {
    const minsAhead = minutesUntil(times[i], now);
    if (minsAhead < 0) continue;
    if (minsAhead > LOOKAHEAD_MIN) break;
    const mm = precip[i] ?? 0;
    if (mm >= RAIN_THRESHOLD_MM) {
      return { startsInMin: Math.round(minsAhead), precipMm: mm };
    }
  }
  return { startsInMin: null, precipMm: 0 };
}

async function runCheck(): Promise<{
  checked: number;
  fired: number;
  pruned: number;
  errors: string[];
}> {
  const alarms = listRainAlarms();
  const errors: string[] = [];
  let fired = 0;
  let pruned = 0;
  const now = Date.now();

  for (const a of alarms) {
    try {
      if (a.lastFiredAt) {
        const since = (now - new Date(a.lastFiredAt).getTime()) / 60000;
        if (since < COOLDOWN_MIN) continue;
      }
      const { startsInMin, precipMm } = await fetchPrecip(
        a.place.latitude,
        a.place.longitude,
        a.place.timezone
      );
      if (startsInMin === null) continue;
      const payload = {
        title: `Rain in ${startsInMin} min · ${a.place.name}`,
        body: `Measurable rain expected (${precipMm.toFixed(1)}mm). Grab a jacket or head inside.`,
        url: "/",
        tag: "cernos-rain",
      };
      const res = await sendPush(a.endpoint, a.keys, payload);
      if (res.ok) {
        markRainAlarmFired(a.endpoint, new Date().toISOString());
        fired++;
      } else if (res.statusCode === 404 || res.statusCode === 410) {
        removeRainAlarm(a.endpoint);
        pruned++;
      } else {
        errors.push(`${a.endpoint.slice(-12)}: ${res.statusCode ?? "?"} ${res.body ?? ""}`.trim());
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return { checked: alarms.length, fired, pruned, errors };
}

function authorized(req: NextRequest): boolean {
  const expected = process.env.RAIN_ALARM_CRON_SECRET;
  if (!expected) return true;
  const got = req.headers.get("authorization") ?? req.nextUrl.searchParams.get("key");
  if (!got) return false;
  return got === expected || got === `Bearer ${expected}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runCheck();
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runCheck();
  return NextResponse.json(result);
}
