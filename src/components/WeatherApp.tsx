"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import SearchBar from "./SearchBar";
import CurrentWeather from "./CurrentWeather";
import HourlyForecast from "./HourlyForecast";
import DailyForecast from "./DailyForecast";
import WeatherDetails from "./WeatherDetails";
import AIInsights from "./AIInsights";
import Favorites from "./Favorites";
import AnimatedBackground from "./AnimatedBackground";
import TimeScrubber from "./TimeScrubber";
import { paletteFor } from "@/lib/weather-themes";
import { themeForCondition } from "@/lib/weather-codes";
import { buildHeuristicInsights } from "@/lib/insights";
import type {
  FavoriteRow,
  HistoryRow,
  Place,
  Snapshot,
  ThemeName,
  WeatherPayload,
} from "@/lib/types";

const DEFAULT_PLACE: Place = {
  id: 2643743,
  name: "London",
  country: "United Kingdom",
  admin1: "England",
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: "Europe/London",
};

export default function WeatherApp() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [weather, setWeather] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeName>("clear-day");
  const [geolocating, setGeolocating] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [aiInsights, setAiInsights] = useState<string[] | null>(null);
  const [aiSource, setAiSource] = useState<"claude" | "heuristic" | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [scrubIndex, setScrubIndex] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const aiCtrl = useRef<AbortController | null>(null);

  const snapshot: Snapshot | null = useMemo(() => {
    if (!weather) return null;
    if (scrubIndex === weather.nowIndex) return weather.current;
    return weather.hourly[scrubIndex] ?? weather.current;
  }, [weather, scrubIndex]);

  const isAtNow = !weather || scrubIndex === weather.nowIndex;

  const applyTheme = useCallback((t: ThemeName) => {
    const p = paletteFor(t);
    const root = document.documentElement;
    root.style.setProperty("--bg-gradient", p.gradient);
    root.style.setProperty("--accent", p.accent);
    root.style.setProperty("--glass", p.glass);
    root.style.setProperty("--text", p.text);
    root.style.setProperty("--subtext", p.subtext);
    root.style.setProperty("--border", p.border);
    root.style.setProperty("--ring", p.ring);
    root.style.setProperty("--particle", p.particle);
    setTheme(t);
  }, []);

  // theme follows the scrubbed snapshot
  useEffect(() => {
    if (!snapshot) return;
    applyTheme(themeForCondition(snapshot.weatherCode, snapshot.isDay));
  }, [snapshot, applyTheme]);

  // body class so CSS can shorten transitions during scrub
  useEffect(() => {
    document.body.classList.toggle("scrubbing", scrubbing);
    return () => document.body.classList.remove("scrubbing");
  }, [scrubbing]);

  const fetchWeather = useCallback(
    async (p: Place) => {
      setLoading(true);
      setError(null);
      setAiInsights(null);
      try {
        const url = new URL("/api/weather", window.location.origin);
        url.searchParams.set("lat", String(p.latitude));
        url.searchParams.set("lon", String(p.longitude));
        url.searchParams.set("name", p.name);
        url.searchParams.set("country", p.country ?? "");
        if (p.admin1) url.searchParams.set("admin1", p.admin1);
        if (p.timezone) url.searchParams.set("timezone", p.timezone);
        const r = await fetch(url);
        if (!r.ok) throw new Error("Failed to load weather");
        const data: WeatherPayload = await r.json();
        setWeather(data);
        setScrubIndex(data.nowIndex);
        // refresh history
        fetch("/api/history")
          .then((r) => r.json())
          .then((d) => setHistory(d.history ?? []))
          .catch(() => {});
        // ai insights (only for current "now")
        aiCtrl.current?.abort();
        aiCtrl.current = new AbortController();
        setAiLoading(true);
        fetch("/api/ai-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weather: data }),
          signal: aiCtrl.current.signal,
        })
          .then((r) => r.json())
          .then((d) => {
            setAiInsights(d.insights ?? null);
            setAiSource(d.source ?? "heuristic");
          })
          .catch(() => {})
          .finally(() => setAiLoading(false));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // initial fetch + favorites/history
  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => setFavorites(d.favorites ?? []))
      .catch(() => {});
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => setHistory(d.history ?? []))
      .catch(() => {});
    fetchWeather(place);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback(
    (p: Place) => {
      setPlace(p);
      fetchWeather(p);
    },
    [fetchWeather]
  );

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported in this browser.");
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const r = await fetch(
            `/api/geocode?lat=${latitude}&lon=${longitude}`
          );
          const d = await r.json();
          const top = d.results?.[0];
          const next: Place = top
            ? {
                id: top.id ?? 0,
                name: top.name ?? "Current location",
                country: top.country ?? "",
                admin1: top.admin1,
                latitude,
                longitude,
                timezone: top.timezone,
              }
            : {
                id: 0,
                name: "Current location",
                country: "",
                latitude,
                longitude,
              };
          setPlace(next);
          fetchWeather(next);
        } catch {
          const next: Place = {
            id: 0,
            name: "Current location",
            country: "",
            latitude,
            longitude,
          };
          setPlace(next);
          fetchWeather(next);
        } finally {
          setGeolocating(false);
        }
      },
      (err) => {
        setError(err.message || "Couldn't get your location.");
        setGeolocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [fetchWeather]);

  const isFavorite = !!favorites.find(
    (f) =>
      Math.abs(f.latitude - place.latitude) < 0.01 &&
      Math.abs(f.longitude - place.longitude) < 0.01
  );

  const toggleFavorite = useCallback(async () => {
    if (isFavorite) {
      const fav = favorites.find(
        (f) =>
          Math.abs(f.latitude - place.latitude) < 0.01 &&
          Math.abs(f.longitude - place.longitude) < 0.01
      );
      if (!fav) return;
      const r = await fetch(`/api/favorites?id=${fav.id}`, { method: "DELETE" });
      const d = await r.json();
      setFavorites(d.favorites ?? []);
    } else {
      const r = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: place.name,
          country: place.country,
          admin1: place.admin1,
          latitude: place.latitude,
          longitude: place.longitude,
        }),
      });
      const d = await r.json();
      setFavorites(d.favorites ?? []);
    }
  }, [favorites, isFavorite, place]);

  const removeFavorite = useCallback(async (id: number) => {
    const r = await fetch(`/api/favorites?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    setFavorites(d.favorites ?? []);
  }, []);

  // pick which insights to show
  const displayInsights = useMemo(() => {
    if (!weather || !snapshot) return aiInsights;
    if (isAtNow) return aiInsights;
    return buildHeuristicInsights(weather, snapshot, { scrubbed: true });
  }, [weather, snapshot, isAtNow, aiInsights]);

  return (
    <>
      <div className="theme-bg" />
      <div className="theme-noise" />
      <AnimatedBackground theme={theme} />

      <main className="relative z-10 min-h-screen px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              className="accent"
            >
              <Cloud size={26} strokeWidth={1.5} />
            </motion.div>
            <h1 className="text-main text-xl md:text-2xl font-semibold tracking-tight">
              Cernos
            </h1>
            <span className="text-sub text-xs uppercase tracking-widest hidden sm:inline ml-1">
              Living Weather
            </span>
          </div>
          <button
            onClick={() => fetchWeather(place)}
            className="glass px-3 py-2 text-sm flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition"
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <div className="space-y-4 md:space-y-6">
          <SearchBar
            onSelect={handleSelect}
            onUseLocation={handleUseLocation}
            geolocating={geolocating}
          />

          <Favorites
            favorites={favorites}
            history={history}
            onSelect={handleSelect}
            onRemove={removeFavorite}
          />

          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-strong p-5 flex items-center gap-3"
              >
                <AlertCircle className="accent shrink-0" />
                <div>
                  <div className="text-main font-medium">Something went wrong</div>
                  <div className="text-sub text-sm">{error}</div>
                </div>
              </motion.div>
            ) : loading && !weather ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-strong p-10 flex items-center justify-center gap-3"
              >
                <Loader2 className="animate-spin accent" />
                <span className="text-sub">Reading the sky…</span>
              </motion.div>
            ) : weather && snapshot ? (
              <motion.div
                key={`${weather.place.latitude},${weather.place.longitude}`}
                className="space-y-4 md:space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CurrentWeather
                  weather={weather}
                  snapshot={snapshot}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  scrubbing={!isAtNow}
                />
                <TimeScrubber
                  hourly={weather.hourly}
                  index={scrubIndex}
                  nowIndex={weather.nowIndex}
                  onChange={setScrubIndex}
                  onScrubStateChange={setScrubbing}
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <HourlyForecast
                      hourly={weather.hourly}
                      nowIndex={weather.nowIndex}
                      scrubIndex={scrubIndex}
                      onPickHour={setScrubIndex}
                    />
                    <DailyForecast
                      daily={weather.daily}
                      hourly={weather.hourly}
                      scrubIndex={scrubIndex}
                      onPickDay={setScrubIndex}
                    />
                  </div>
                  <div className="space-y-4 md:space-y-6">
                    <AIInsights
                      insights={displayInsights}
                      loading={aiLoading && isAtNow}
                      source={aiSource}
                      scrubbing={!isAtNow}
                    />
                    <WeatherDetails weather={weather} snapshot={snapshot} />
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <footer className="text-center text-sub text-xs pt-6 pb-2">
            Weather and air quality from Open-Meteo · Built with Next.js, Framer Motion, and Claude
          </footer>
        </div>
      </main>
    </>
  );
}
