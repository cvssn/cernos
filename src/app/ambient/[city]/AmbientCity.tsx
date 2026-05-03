"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import AmbientMode from "@/components/AmbientMode";
import { themeForCondition } from "@/lib/weather-codes";
import type {
  Place,
  Snapshot,
  ThemeName,
  WeatherPayload,
} from "@/lib/types";

type Props = { place: Place };

const REFRESH_MS = 10 * 60 * 1000;

export default function AmbientCity({ place }: Props) {
  const router = useRouter();
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const u = new URL("/api/weather", window.location.origin);
        u.searchParams.set("lat", String(place.latitude));
        u.searchParams.set("lon", String(place.longitude));
        u.searchParams.set("name", place.name);
        u.searchParams.set("country", place.country);
        if (place.admin1) u.searchParams.set("admin1", place.admin1);
        if (place.timezone) u.searchParams.set("timezone", place.timezone);
        const r = await fetch(u.toString(), { cache: "no-store" });
        if (!r.ok) throw new Error("weather_failed");
        const data: WeatherPayload = await r.json();
        if (alive) {
          setWeather(data);
          setError(null);
        }
      } catch {
        if (alive) setError("weather load failed");
      }
    }

    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [
    place.latitude,
    place.longitude,
    place.name,
    place.country,
    place.admin1,
    place.timezone,
  ]);

  const snapshot: Snapshot | null = weather?.current ?? null;
  const theme: ThemeName = snapshot
    ? themeForCondition(snapshot.weatherCode, snapshot.isDay)
    : "clear-night";

  const ready = !!weather && !!snapshot;

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-3 z-10">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm lowercase">
            tuning into {place.name.toLowerCase()}…
          </p>
        </div>
      )}
      {error && !ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-3 z-10 px-6 text-center">
          <AlertCircle size={28} />
          <p className="text-sm lowercase">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition lowercase text-sm flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            back to cernos
          </button>
        </div>
      )}

      <AmbientMode
        open={ready}
        onClose={() => router.push("/")}
        theme={theme}
        snapshot={snapshot}
        place={place}
      />
    </div>
  );
}
