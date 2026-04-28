import { NextRequest, NextResponse } from "next/server";
import { recordHistory } from "@/lib/db";
import type { WeatherPayload } from "@/lib/types";

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
      "weather_code",
      "precipitation",
      "precipitation_probability",
      "is_day",
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
  const startIdx = nearestHourIndex(hourlyTimes);
  const hourlyEntries = hourlyTimes.slice(startIdx, startIdx + 24).map((time, i) => ({
    time,
    temperature: data.hourly.temperature_2m[startIdx + i],
    weatherCode: data.hourly.weather_code[startIdx + i],
    precipitation: data.hourly.precipitation[startIdx + i] ?? 0,
    precipitationProbability:
      data.hourly.precipitation_probability?.[startIdx + i] ?? 0,
    isDay: !!data.hourly.is_day[startIdx + i],
  }));

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
    current: {
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      pressure: data.current.pressure_msl,
      cloudCover: data.current.cloud_cover,
      isDay: !!data.current.is_day,
      uvIndex: data.current.uv_index,
      time: data.current.time,
    },
    hourly: hourlyEntries,
    daily: dailyEntries,
    airQuality,
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

function nearestHourIndex(times: string[]): number {
  const now = Date.now();
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < times.length; i++) {
    const t = new Date(times[i]).getTime();
    const diff = Math.abs(t - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}
