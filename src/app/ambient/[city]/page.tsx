import type { Metadata } from "next";
import Link from "next/link";
import AmbientCity from "./AmbientCity";
import type { Place } from "@/lib/types";

type PageProps = {
  params: Promise<{ city: string }>;
};

function slugToQuery(slug: string): string {
  return decodeURIComponent(slug).replace(/[-_+]/g, " ").trim();
}

async function geocodeSlug(slug: string): Promise<Place | null> {
  const q = slugToQuery(slug);
  if (!q) return null;
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", q);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  try {
    const r = await fetch(url.toString(), { next: { revalidate: 86400 } });
    if (!r.ok) return null;
    const data = await r.json();
    const first = data?.results?.[0];
    if (!first) return null;
    return {
      id: first.id,
      name: first.name,
      country: first.country ?? "",
      admin1: first.admin1,
      latitude: first.latitude,
      longitude: first.longitude,
      timezone: first.timezone,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city } = await params;
  const place = await geocodeSlug(city);
  if (!place) {
    return {
      title: "ambient · cernos",
      description: "fullscreen ambient sky for any city.",
    };
  }
  const cityName = place.name.toLowerCase();
  const region = place.country ? `, ${place.country.toLowerCase()}` : "";
  const posterPath =
    `/api/poster?lat=${place.latitude}&lon=${place.longitude}` +
    `&name=${encodeURIComponent(place.name)}` +
    `&country=${encodeURIComponent(place.country)}`;
  return {
    title: `${cityName} · ambient · cernos`,
    description: `live ambient sky for ${cityName}${region} — fullscreen, sound, soundscape. perfect for a second monitor.`,
    openGraph: {
      title: `${cityName} · ambient sky`,
      description: `live sky over ${cityName} — fullscreen kiosk view.`,
      images: [{ url: posterPath, width: 1080, height: 1350 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cityName} · ambient sky`,
      description: `live sky over ${cityName} — cernos.app`,
      images: [posterPath],
    },
  };
}

export default async function AmbientCityPage({ params }: PageProps) {
  const { city } = await params;
  const place = await geocodeSlug(city);
  if (!place) {
    const tried = slugToQuery(city) || city;
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-8 gap-4">
        <h1 className="text-2xl lowercase">city not found</h1>
        <p className="text-white/60 lowercase text-sm">
          tried: &ldquo;{tried.toLowerCase()}&rdquo;
        </p>
        <p className="text-white/40 lowercase text-xs max-w-md text-center">
          try a major city slug like /ambient/tokyo, /ambient/new-york, or
          /ambient/sao-paulo.
        </p>
        <Link
          href="/"
          className="mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition lowercase text-sm"
        >
          back to cernos
        </Link>
      </main>
    );
  }
  return <AmbientCity place={place} />;
}
