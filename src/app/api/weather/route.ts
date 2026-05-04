import { NextRequest, NextResponse } from "next/server";
import { recordHistory } from "@/lib/db";
import type {
  AlertSeverity,
  DailyEntry,
  HistoricalContext,
  PollenDailyEntry,
  PollenLevels,
  Snapshot,
  WeatherAlert,
  WeatherPayload,
} from "@/lib/types";

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

  const weatherFetch = fetch(url, { next: { revalidate: 60 } });

  const aqUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  aqUrl.searchParams.set("latitude", lat);
  aqUrl.searchParams.set("longitude", lon);
  aqUrl.searchParams.set(
    "current",
    [
      "pm10",
      "pm2_5",
      "ozone",
      "european_aqi",
      "us_aqi",
      "alder_pollen",
      "birch_pollen",
      "grass_pollen",
      "mugwort_pollen",
      "olive_pollen",
      "ragweed_pollen",
    ].join(",")
  );
  aqUrl.searchParams.set(
    "hourly",
    [
      "alder_pollen",
      "birch_pollen",
      "grass_pollen",
      "mugwort_pollen",
      "olive_pollen",
      "ragweed_pollen",
    ].join(",")
  );
  aqUrl.searchParams.set("forecast_days", "7");
  aqUrl.searchParams.set("timezone", timezone);
  const aqFetch = fetch(aqUrl, { next: { revalidate: 300 } }).catch(
    () => null
  );

  const r = await weatherFetch;
  if (!r.ok) {
    return NextResponse.json({ error: "weather_failed" }, { status: 502 });
  }
  const data = await r.json();

  const currentTimeStrEarly: string = data.current?.time ?? "";
  const historicalPromise = fetchHistoricalContext(
    lat,
    lon,
    timezone,
    currentTimeStrEarly
  );

  let airQuality;
  let pollen: PollenLevels | undefined;
  try {
    const ar = await aqFetch;
    if (ar && ar.ok) {
      const ad = await ar.json();
      airQuality = {
        pm10: ad?.current?.pm10,
        pm2_5: ad?.current?.pm2_5,
        ozone: ad?.current?.ozone,
        europeanAqi: ad?.current?.european_aqi,
        usAqi: ad?.current?.us_aqi,
      };
      const p = ad?.current ?? {};
      const hasAny =
        p.alder_pollen != null ||
        p.birch_pollen != null ||
        p.grass_pollen != null ||
        p.mugwort_pollen != null ||
        p.olive_pollen != null ||
        p.ragweed_pollen != null;
      const daily = aggregatePollenDaily(ad?.hourly);
      if (hasAny || daily.length) {
        pollen = {
          alder: numOrNull(p.alder_pollen),
          birch: numOrNull(p.birch_pollen),
          grass: numOrNull(p.grass_pollen),
          mugwort: numOrNull(p.mugwort_pollen),
          olive: numOrNull(p.olive_pollen),
          ragweed: numOrNull(p.ragweed_pollen),
          daily: daily.length ? daily : undefined,
        };
      }
    }
  } catch {
    // air quality + pollen are optional
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

  const historical = await historicalPromise;

  const alerts = deriveAlerts(hourlyAll, dailyEntries, nowIndex);

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
    pollen,
    alerts,
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

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

const POLLEN_TYPES = [
  "alder",
  "birch",
  "grass",
  "mugwort",
  "olive",
  "ragweed",
] as const;

function aggregatePollenDaily(
  hourly: Record<string, unknown> | undefined
): PollenDailyEntry[] {
  if (!hourly) return [];
  const times = (hourly.time as string[] | undefined) ?? [];
  if (!times.length) return [];
  const map = new Map<string, PollenDailyEntry>();
  for (let i = 0; i < times.length; i++) {
    const date = times[i]?.slice(0, 10);
    if (!date) continue;
    let entry = map.get(date);
    if (!entry) {
      entry = {
        date,
        alder: null,
        birch: null,
        grass: null,
        mugwort: null,
        olive: null,
        ragweed: null,
      };
      map.set(date, entry);
    }
    for (const t of POLLEN_TYPES) {
      const arr = hourly[`${t}_pollen`] as Array<number | null> | undefined;
      const v = arr?.[i];
      if (typeof v === "number" && Number.isFinite(v)) {
        entry[t] = entry[t] == null ? v : Math.max(entry[t]!, v);
      }
    }
  }
  return Array.from(map.values()).slice(0, 7);
}

// Open-Meteo has no first-party severe-weather alerts endpoint, so we derive
// advisories/warnings from the forecast we already fetch. Looks at the next 48h
// of hourly data and the 7-day daily data; thresholds chosen to be conservative.
function deriveAlerts(
  hourly: Snapshot[],
  daily: DailyEntry[],
  nowIndex: number
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const window = hourly.slice(nowIndex, nowIndex + 48);

  const stormHours = window.filter((h) => [95, 96, 99].includes(h.weatherCode));
  if (stormHours.length) {
    const severe = stormHours.some((h) => [96, 99].includes(h.weatherCode));
    alerts.push({
      id: "storm",
      severity: severe ? "warning" : "advisory",
      kind: "storm",
      title: severe ? "Severe thunderstorm warning" : "Thunderstorm advisory",
      detail: `Thunderstorms likely in the next ${stormHours.length}h.`,
    });
  }

  const today = daily[0];
  if (today) {
    if (today.temperatureMax >= 40) {
      alerts.push(makeAlert("heat", "warning", "Extreme heat warning", `High of ${Math.round(today.temperatureMax)}° expected today.`));
    } else if (today.temperatureMax >= 35) {
      alerts.push(makeAlert("heat", "advisory", "Heat advisory", `High of ${Math.round(today.temperatureMax)}° expected today.`));
    }
    if (today.temperatureMin <= -20) {
      alerts.push(makeAlert("cold", "warning", "Extreme cold warning", `Low of ${Math.round(today.temperatureMin)}° expected today.`));
    } else if (today.temperatureMin <= -10) {
      alerts.push(makeAlert("cold", "advisory", "Cold advisory", `Low of ${Math.round(today.temperatureMin)}° expected today.`));
    }
    if (today.windSpeedMax >= 80) {
      alerts.push(makeAlert("wind", "warning", "High wind warning", `Gusts up to ${Math.round(today.windSpeedMax)} km/h.`));
    } else if (today.windSpeedMax >= 60) {
      alerts.push(makeAlert("wind", "advisory", "Wind advisory", `Winds up to ${Math.round(today.windSpeedMax)} km/h.`));
    }
    if (today.precipitationSum >= 50) {
      alerts.push(makeAlert("rain", "warning", "Flood-risk rain warning", `${Math.round(today.precipitationSum)} mm expected today.`));
    } else if (today.precipitationSum >= 25) {
      alerts.push(makeAlert("rain", "advisory", "Heavy rain advisory", `${Math.round(today.precipitationSum)} mm expected today.`));
    }
    if (today.uvIndexMax >= 11) {
      alerts.push(makeAlert("uv", "advisory", "Extreme UV advisory", `UV index peaks at ${Math.round(today.uvIndexMax)}. Cover up.`));
    }
    const snowHours = window.filter((h) => [71, 73, 75, 77, 85, 86].includes(h.weatherCode));
    if (snowHours.length >= 3) {
      const heavy = snowHours.some((h) => [75, 86].includes(h.weatherCode));
      alerts.push(makeAlert("snow", heavy ? "warning" : "advisory", heavy ? "Heavy snow warning" : "Snow advisory", `Snow expected over ${snowHours.length}h.`));
    }
    const fogHours = window.slice(0, 12).filter((h) => [45, 48].includes(h.weatherCode));
    if (fogHours.length >= 2) {
      alerts.push(makeAlert("fog", "advisory", "Dense fog advisory", "Reduced visibility likely in the next 12h."));
    }
  }

  // de-dupe by kind, keeping highest severity
  const rank: Record<AlertSeverity, number> = { watch: 0, advisory: 1, warning: 2 };
  const byKind = new Map<string, WeatherAlert>();
  for (const a of alerts) {
    const cur = byKind.get(a.kind);
    if (!cur || rank[a.severity] > rank[cur.severity]) byKind.set(a.kind, a);
  }
  return Array.from(byKind.values()).sort(
    (a, b) => rank[b.severity] - rank[a.severity]
  );
}

function makeAlert(
  kind: WeatherAlert["kind"],
  severity: AlertSeverity,
  title: string,
  detail: string
): WeatherAlert {
  return { id: `${kind}-${severity}`, kind, severity, title, detail };
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
