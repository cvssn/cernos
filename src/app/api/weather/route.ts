import { NextRequest, NextResponse } from "next/server";
import { recordHistory } from "@/lib/db";
import type { HistoricalContext, Snapshot, WeatherPayload } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = sp.get("lat");
  const lon = sp.get("lon");
  const name = sp.get("name") ?? "Unknown";
  const country = sp.get("country") ?? "";
  const admin1 = sp.get("admin1") ?? undefined;
  const timezone = sp.get("timezone") ?? "auto";

  if (!lat || !lon) {
    return NextResponse.json({ error: "missing_coords" }, { status: 400 });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("timezone", timezone);
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "pressure_msl",
      "cloud_cover",
      "is_day",
      "uv_index",
    ].join(",")
  );
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation",
      "precipitation_probability",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "surface_pressure",
      "cloud_cover",
      "is_day",
      "uv_index",
    ].join(",")
  );
  url.searchParams.set(
    "daily",
    [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "precipitation_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "uv_index_max",
    ].join(",")
  );
  url.searchParams.set("forecast_days", "7");

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) {
    return NextResponse.json({ error: "weather_failed" }, { status: 502 });
  }
  const data = await r.json();

  const aqUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  aqUrl.searchParams.set("latitude", lat);
  aqUrl.searchParams.set("longitude", lon);
  aqUrl.searchParams.set("current", "pm10,pm2_5,ozone,european_aqi,us_aqi");
  aqUrl.searchParams.set("timezone", timezone);
  let airQuality;
  try {
    const ar = await fetch(aqUrl, { cache: "no-store" });
    if (ar.ok) {
      const ad = await ar.json();
      airQuality = {
        pm10: ad?.current?.pm10,
        pm2_5: ad?.current?.pm2_5,
        ozone: ad?.current?.ozone,
        europeanAqi: ad?.current?.european_aqi,
        usAqi: ad?.current?.us_aqi,
      };
    }
  } catch {
    // air quality is optional
  }

  const hourlyTimes: string[] = data.hourly?.time ?? [];
  const currentTimeStr: string = data.current?.time ?? "";
  const hourlyAll: Snapshot[] = hourlyTimes.map((time, i) => ({
    time,
    temperature: data.hourly.temperature_2m[i],
    apparentTemperature: data.hourly.apparent_temperature[i],
    humidity: data.hourly.relative_humidity_2m[i],
    precipitation: data.hourly.precipitation[i] ?? 0,
    precipitationProbability: data.hourly.precipitation_probability?.[i] ?? 0,
    weatherCode: data.hourly.weather_code[i],
    windSpeed: data.hourly.wind_speed_10m[i] ?? 0,
    windDirection: data.hourly.wind_direction_10m[i] ?? 0,
    pressure: data.hourly.surface_pressure[i] ?? 0,
    cloudCover: data.hourly.cloud_cover[i] ?? 0,
    isDay: !!data.hourly.is_day[i],
    uvIndex: data.hourly.uv_index[i] ?? 0,
  }));
  const nowIndex = nearestHourIndex(hourlyTimes, currentTimeStr);

  const dailyDates: string[] = data.daily?.time ?? [];
  const dailyEntries = dailyDates.map((date, i) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    temperatureMax: data.daily.temperature_2m_max[i],
    temperatureMin: data.daily.temperature_2m_min[i],
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
    precipitationSum: data.daily.precipitation_sum[i] ?? 0,
    precipitationProbabilityMax: data.daily.precipitation_probability_max?.[i] ?? 0,
    windSpeedMax: data.daily.wind_speed_10m_max?.[i] ?? 0,
    uvIndexMax: data.daily.uv_index_max?.[i] ?? 0,
  }));

  const current: Snapshot = {
    time: data.current.time,
    temperature: data.current.temperature_2m,
    apparentTemperature: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    precipitationProbability: hourlyAll[nowIndex]?.precipitationProbability ?? 0,
    weatherCode: data.current.weather_code,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    pressure: data.current.pressure_msl,
    cloudCover: data.current.cloud_cover,
    isDay: !!data.current.is_day,
    uvIndex: data.current.uv_index,
  };

  const historical = await fetchHistoricalContext(
    lat,
    lon,
    timezone,
    currentTimeStr
  );

  const payload: WeatherPayload = {
    place: {
      id: 0,
      name,
      country,
      admin1,
      latitude: Number(lat),
      longitude: Number(lon),
      timezone: data.timezone,
    },
    current,
    hourly: hourlyAll,
    daily: dailyEntries,
    airQuality,
    nowIndex,
    historical,
  };

  try {
    recordHistory({
      name,
      country,
      admin1: admin1 ?? null,
      latitude: Number(lat),
      longitude: Number(lon),
    });
  } catch {
    // db is optional
  }

  return NextResponse.json(payload);
}

const CLIMATOLOGY_YEARS = 10;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

async function fetchHistoricalContext(
  lat: string,
  lon: string,
  timezone: string,
  currentTimeStr: string
): Promise<HistoricalContext | undefined> {
  if (!currentTimeStr) return undefined;
  const yearStr = currentTimeStr.slice(0, 4);
  const monthStr = currentTimeStr.slice(5, 7);
  const hourStr = currentTimeStr.slice(11, 13);
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1;
  if (!Number.isFinite(year) || monthIdx < 0 || monthIdx > 11) return undefined;

  const yUrl = new URL("https://api.open-meteo.com/v1/forecast");
  yUrl.searchParams.set("latitude", lat);
  yUrl.searchParams.set("longitude", lon);
  yUrl.searchParams.set("hourly", "temperature_2m");
  yUrl.searchParams.set("past_days", "1");
  yUrl.searchParams.set("forecast_days", "1");
  yUrl.searchParams.set("timezone", timezone);

  const cUrl = new URL("https://archive-api.open-meteo.com/v1/archive");
  cUrl.searchParams.set("latitude", lat);
  cUrl.searchParams.set("longitude", lon);
  cUrl.searchParams.set("start_date", `${year - CLIMATOLOGY_YEARS}-01-01`);
  cUrl.searchParams.set("end_date", `${year - 1}-12-31`);
  cUrl.searchParams.set("daily", "temperature_2m_mean");
  cUrl.searchParams.set("timezone", timezone);

  try {
    const [ry, rc] = await Promise.all([
      fetch(yUrl, { next: { revalidate: 1800 } }),
      fetch(cUrl, { next: { revalidate: 60 * 60 * 24 } }),
    ]);

    let yesterdayTempAtHour: number | null = null;
    if (ry.ok) {
      const yd = await ry.json();
      const times: string[] = yd?.hourly?.time ?? [];
      const temps: number[] = yd?.hourly?.temperature_2m ?? [];
      const yesterdayDate = times[0]?.slice(0, 10);
      const idx = times.findIndex(
        (t) => t.slice(0, 10) === yesterdayDate && t.slice(11, 13) === hourStr
      );
      if (idx >= 0 && typeof temps[idx] === "number") {
        yesterdayTempAtHour = temps[idx];
      }
    }

    let monthlyAvgMean: number | null = null;
    if (rc.ok) {
      const cd = await rc.json();
      const dates: string[] = cd?.daily?.time ?? [];
      const means: (number | null)[] = cd?.daily?.temperature_2m_mean ?? [];
      let sum = 0;
      let count = 0;
      for (let i = 0; i < dates.length; i++) {
        if (dates[i]?.slice(5, 7) === monthStr && typeof means[i] === "number") {
          sum += means[i] as number;
          count++;
        }
      }
      if (count > 0) monthlyAvgMean = sum / count;
    }

    return {
      yesterdayTempAtHour,
      monthlyAvgMean,
      monthName: MONTH_NAMES[monthIdx],
      climatologyYears: CLIMATOLOGY_YEARS,
    };
  } catch {
    return undefined;
  }
}

// Open-Meteo returns local-time strings (e.g. "2026-04-28T03:15") in the location's timezone.
// We treat both `current.time` and each hourly time as opaque strings in the same zone.
// Pinning both with "Z" forces consistent parsing — only the *difference* matters.
function nearestHourIndex(times: string[], anchor: string): number {
  if (!anchor) return 0;
  const a = new Date(anchor + "Z").getTime();
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i] + "Z").getTime();
    const diff = Math.abs(t - a);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}
