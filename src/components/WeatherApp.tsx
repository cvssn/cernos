"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, AlertCircle, Loader2, RefreshCw, Radar, Headphones, Thermometer, Briefcase } from "lucide-react";
import SearchBar from "./SearchBar";
import CurrentWeather from "./CurrentWeather";
import HourlyForecast from "./HourlyForecast";
import DailyForecast from "./DailyForecast";
import WeatherDetails from "./WeatherDetails";
import AIInsights from "./AIInsights";
import Favorites from "./Favorites";
import AnimatedBackground from "./AnimatedBackground";
import TimeScrubber from "./TimeScrubber";
import WeatherAlerts from "./WeatherAlerts";
import PollenPanel from "./PollenPanel";
import TonightsSkyPanel from "./TonightsSkyPanel";
import PressureTendency from "./PressureTendency";
import ClimateLens from "./ClimateLens";
import SkyTimelapse from "./SkyTimelapse";
import SkyJournal from "./SkyJournal";
import type { StoredJournalEntry } from "@/lib/db";
import AuroraBanner, { type SpaceWeather } from "./AuroraBanner";
import AmbientMode from "./AmbientMode";
import VoiceAsk from "./VoiceAsk";
import ActivityMatchmaker from "./ActivityMatchmaker";
import TripBrief from "./TripBrief";
import RainAlarm from "./RainAlarm";

const PrecipitationRadar = dynamic(() => import("./PrecipitationRadar"), {
  ssr: false,
  loading: () => (
    <div className="glass-strong h-[420px] flex items-center justify-center text-sub gap-2">
      <Radar size={16} className="accent animate-pulse" /> Loading radar…
    </div>
  ),
});
import { paletteFor } from "@/lib/weather-themes";
import { themeForCondition } from "@/lib/weather-codes";
import { buildHeuristicNarrative } from "@/lib/insights";
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
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<"claude" | "heuristic" | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [scrubIndex, setScrubIndex] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [ambientOpen, setAmbientOpen] = useState(false);
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeather | null>(null);
  const [climateLensOn, setClimateLensOn] = useState(false);
  const [tripOpen, setTripOpen] = useState(false);
  const [journalEntries, setJournalEntries] = useState<StoredJournalEntry[]>(
    []
  );
  const [journalToday, setJournalToday] = useState<string | null>(null);
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

  // aurora tint: only when plausible AND it's currently night at this place
  const auroraActive = !!(
    spaceWeather?.plausible && snapshot && !snapshot.isDay
  );
  useEffect(() => {
    document.body.classList.toggle("aurora", auroraActive);
    return () => document.body.classList.remove("aurora");
  }, [auroraActive]);

  const fetchWeather = useCallback(
    async (p: Place) => {
      setLoading(true);
      setError(null);
      setAiNarrative(null);
      setSpaceWeather(null);
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
        // space weather (Kp + aurora plausibility for this lat/lon)
        fetch(`/api/space-weather?lat=${p.latitude}&lon=${p.longitude}`)
          .then((r) => r.json())
          .then((d) => setSpaceWeather(d as SpaceWeather))
          .catch(() => {});
        // sky journal — upsert today's entry, refresh list
        fetch("/api/sky-journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weather: data }),
        })
          .then((r) => r.json())
          .then((d: {
            entry?: StoredJournalEntry;
            entries?: StoredJournalEntry[];
          }) => {
            if (d.entry) setJournalToday(d.entry.date);
            if (d.entries) setJournalEntries(d.entries);
          })
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
            setAiNarrative(d.narrative ?? null);
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
    fetch("/api/sky-journal")
      .then((r) => r.json())
      .then((d) => setJournalEntries(d.entries ?? []))
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

  const displayNarrative = useMemo(() => {
    if (!weather || !snapshot) return aiNarrative;
    if (isAtNow) return aiNarrative;
    return buildHeuristicNarrative(weather, snapshot, { scrubbed: true });
  }, [weather, snapshot, isAtNow, aiNarrative]);

  return (
    <>
      <div className="theme-bg" />
      <div className="aurora-veil" />
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
              cernos
            </h1>
            <span className="text-sub text-xs uppercase tracking-widest hidden sm:inline ml-1">
              living weather
            </span>
          </div>
          <div className="flex items-center gap-2">
            <RainAlarm place={place} />
            <VoiceAsk weather={weather} />
            <button
              onClick={() => setTripOpen(true)}
              className="glass px-3 py-2 text-sm flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition"
              aria-label="Plan a trip"
              title="Trip brief — packing list for any destination"
            >
              <Briefcase size={14} className="text-white" />
              <span className="hidden sm:inline">trip</span>
            </button>
            <button
              onClick={() => setClimateLensOn((v) => !v)}
              disabled={!weather}
              className={`glass px-3 py-2 text-sm flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition disabled:opacity-40 disabled:cursor-not-allowed ${
                climateLensOn ? "ring-accent" : ""
              }`}
              aria-pressed={climateLensOn}
              aria-label={
                climateLensOn ? "Hide climate lens" : "Show climate lens"
              }
              title="Climate lens — compare today against the 1990s baseline"
            >
              <Thermometer
                size={14}
                className={climateLensOn ? "accent" : "text-white"}
              />
              <span className="hidden sm:inline">climate lens</span>
            </button>
            <button
              onClick={() => setAmbientOpen(true)}
              disabled={!weather || !snapshot}
              className="glass px-3 py-2 text-sm flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Enter ambient mode"
              title="Ambient mode — fullscreen sky + soundscape"
            >
              <Headphones size={14} className="text-white" />
              <span className="hidden sm:inline">ambient</span>
            </button>
            <button
              onClick={() => fetchWeather(place)}
              className="glass px-3 py-2 text-sm flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition"
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">refresh</span>
            </button>
          </div>
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
                  <div className="text-main font-medium">something went wrong</div>
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
                <span className="text-sub">reading the sky…</span>
              </motion.div>
            ) : weather && snapshot ? (
              <motion.div
                key={`${weather.place.latitude},${weather.place.longitude}`}
                className="space-y-4 md:space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <SkyTimelapse
                  hourly={weather.hourly}
                  nowIndex={weather.nowIndex}
                  daily={weather.daily}
                />
                <ClimateLens
                  enabled={climateLensOn}
                  latitude={place.latitude}
                  longitude={place.longitude}
                  timezone={place.timezone}
                  onClose={() => setClimateLensOn(false)}
                />
                {isAtNow && (
                  <AuroraBanner
                    data={spaceWeather}
                    isNight={!snapshot.isDay}
                  />
                )}
                {isAtNow && <WeatherAlerts alerts={weather.alerts} />}
                <CurrentWeather
                  weather={weather}
                  snapshot={snapshot}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  scrubbing={!isAtNow}
                />
                <PrecipitationRadar
                  lat={place.latitude}
                  lon={place.longitude}
                  placeName={place.name}
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
                      narrative={displayNarrative}
                      loading={aiLoading && isAtNow}
                      source={aiSource}
                      scrubbing={!isAtNow}
                    />
                    <ActivityMatchmaker
                      weather={isAtNow ? weather : null}
                      scrubbing={!isAtNow}
                    />
                    <WeatherDetails weather={weather} snapshot={snapshot} />
                    <PressureTendency
                      latitude={place.latitude}
                      longitude={place.longitude}
                      timezone={place.timezone}
                    />
                    <PollenPanel pollen={weather.pollen} />
                    <TonightsSkyPanel
                      latitude={place.latitude}
                      longitude={place.longitude}
                    />
                    <SkyJournal
                      entries={journalEntries}
                      todayDate={journalToday}
                    />
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <footer className="text-center text-sub text-xs pt-6 pb-2">
            weather and air quality from open-meteo · built with next.js, framer motion, and claude
          </footer>
        </div>
      </main>

      <AmbientMode
        open={ambientOpen}
        onClose={() => setAmbientOpen(false)}
        theme={theme}
        snapshot={snapshot}
        place={place}
      />

      <TripBrief open={tripOpen} onClose={() => setTripOpen(false)} />
    </>
  );
}
