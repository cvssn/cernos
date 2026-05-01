import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type PressureReading = { time: string; pressure: number };
export type PressureHistoryPayload = {
  readings: PressureReading[];
  unit: "hPa";
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = sp.get("lat");
  const lon = sp.get("lon");
  const timezone = sp.get("timezone") ?? "auto";

  if (!lat || !lon) {
    return NextResponse.json({ error: "missing_coords" }, { status: 400 });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("hourly", "surface_pressure");
  url.searchParams.set("current", "surface_pressure");
  url.searchParams.set("past_days", "2");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", timezone);

  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) {
      return NextResponse.json(
        { error: "pressure_failed" },
        { status: 502 }
      );
    }
    const data = await r.json();
    const times: string[] = data?.hourly?.time ?? [];
    const values: (number | null)[] = data?.hourly?.surface_pressure ?? [];
    const currentTimeStr: string = data?.current?.time ?? "";

    // Find the index of the current hour, then take the prior 24 readings
    // plus the current one. Fall back to "the latest hour with data".
    let nowIdx = -1;
    if (currentTimeStr) {
      nowIdx = times.findIndex((t) => t >= currentTimeStr);
    }
    if (nowIdx < 0) {
      // Find latest non-null reading.
      for (let i = times.length - 1; i >= 0; i--) {
        if (typeof values[i] === "number") {
          nowIdx = i;
          break;
        }
      }
    }
    if (nowIdx < 0) nowIdx = times.length - 1;
    const start = Math.max(0, nowIdx - 24);
    const slice = times
      .slice(start, nowIdx + 1)
      .map((time, i) => ({
        time,
        pressure: values[start + i],
      }))
      .filter(
        (r): r is PressureReading =>
          typeof r.pressure === "number" && Number.isFinite(r.pressure)
      );

    const payload: PressureHistoryPayload = {
      readings: slice,
      unit: "hPa",
    };
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "pressure_failed" }, { status: 502 });
  }
}
