import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type GeoResult = {
  id: number;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");

  if (lat && lon) {
    // Reverse geocode using Open-Meteo's geocoding (it does not officially support reverse,
    // so we ask Open-Meteo for the closest place name via their forward search using lat/lon).
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", `${lat},${lon}`);
    url.searchParams.set("count", "1");
    const r = await fetch(url, { next: { revalidate: 3600 } });
    if (r.ok) {
      const data = await r.json();
      if (data?.results?.length) return NextResponse.json({ results: data.results });
    }
    // Fallback: just return synthetic place
    return NextResponse.json({
      results: [
        {
          id: 0,
          name: "Current location",
          country: "",
          latitude: Number(lat),
          longitude: Number(lon),
        } satisfies GeoResult,
      ],
    });
  }

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", "8");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const r = await fetch(url, { next: { revalidate: 3600 } });
  if (!r.ok) {
    return NextResponse.json({ results: [], error: "geocode_failed" }, { status: 502 });
  }
  const data = await r.json();
  return NextResponse.json({ results: data.results ?? [] });
}
