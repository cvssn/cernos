"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Snowflake,
  Star,
  X,
  MapPin,
  Loader2,
  AlertCircle,
  Wind,
  Droplets,
} from "lucide-react";
import { paletteFor } from "@/lib/weather-themes";
import { describeWeather, themeForCondition } from "@/lib/weather-codes";
import type {
  FavoriteRow,
  Place,
  ThemeName,
  WeatherPayload,
} from "@/lib/types";

type Props = {
  favorites: FavoriteRow[];
  activeLat: number;
  activeLon: number;
  onSelect: (place: Place) => void;
  onRemove: (id: number) => void;
};

type TileState = {
  loading: boolean;
  error: string | null;
  data: WeatherPayload | null;
};

const REFRESH_MS = 10 * 60 * 1000;

export default function MultiCityTiles({
  favorites,
  activeLat,
  activeLon,
  onSelect,
  onRemove,
}: Props) {
  const [tiles, setTiles] = useState<Record<number, TileState>>({});
  const inflight = useRef<Map<number, AbortController>>(new Map());
  const lastFetched = useRef<Map<number, number>>(new Map());

  const fetchTile = useCallback(async (f: FavoriteRow) => {
    inflight.current.get(f.id)?.abort();
    const ctrl = new AbortController();
    inflight.current.set(f.id, ctrl);
    setTiles((prev) => ({
      ...prev,
      [f.id]: { ...(prev[f.id] ?? { data: null }), loading: true, error: null },
    }));
    try {
      const url = new URL("/api/weather", window.location.origin);
      url.searchParams.set("lat", String(f.latitude));
      url.searchParams.set("lon", String(f.longitude));
      url.searchParams.set("name", f.name);
      url.searchParams.set("country", f.country ?? "");
      if (f.admin1) url.searchParams.set("admin1", f.admin1);
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error("failed");
      const data: WeatherPayload = await r.json();
      lastFetched.current.set(f.id, Date.now());
      setTiles((prev) => ({
        ...prev,
        [f.id]: { loading: false, error: null, data },
      }));
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setTiles((prev) => ({
        ...prev,
        [f.id]: {
          loading: false,
          error: "couldn't load",
          data: prev[f.id]?.data ?? null,
        },
      }));
    }
  }, []);

  // initial / favorites-changed: fetch any missing tiles in parallel
  useEffect(() => {
    favorites.forEach((f) => {
      const last = lastFetched.current.get(f.id) ?? 0;
      if (Date.now() - last < REFRESH_MS && tiles[f.id]?.data) return;
      fetchTile(f);
    });
    // prune state for removed favorites
    setTiles((prev) => {
      const next: Record<number, TileState> = {};
      favorites.forEach((f) => {
        if (prev[f.id]) next[f.id] = prev[f.id];
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites]);

  // periodic refresh while mounted
  useEffect(() => {
    const id = window.setInterval(() => {
      favorites.forEach((f) => fetchTile(f));
    }, REFRESH_MS);
    return () => {
      window.clearInterval(id);
      inflight.current.forEach((c) => c.abort());
      inflight.current.clear();
    };
  }, [favorites, fetchTile]);

  if (!favorites.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 text-sub text-xs uppercase tracking-wider">
        <span className="accent">
          <Star size={14} />
        </span>
        favorites
        <span className="text-sub/70 normal-case tracking-normal">
          · live
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <AnimatePresence>
          {favorites.map((f) => {
            const t = tiles[f.id];
            const isActive =
              Math.abs(f.latitude - activeLat) < 0.01 &&
              Math.abs(f.longitude - activeLon) < 0.01;
            return (
              <CityTile
                key={f.id}
                fav={f}
                state={t}
                isActive={isActive}
                onSelect={onSelect}
                onRemove={onRemove}
                onRetry={() => fetchTile(f)}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

type TileProps = {
  fav: FavoriteRow;
  state: TileState | undefined;
  isActive: boolean;
  onSelect: (place: Place) => void;
  onRemove: (id: number) => void;
  onRetry: () => void;
};

function CityTile({ fav, state, isActive, onSelect, onRemove, onRetry }: TileProps) {
  const data = state?.data;
  const snap = data?.current ?? null;
  const today = data?.daily?.[0] ?? null;

  const theme: ThemeName = useMemo(() => {
    if (!snap) return "cloudy-night";
    return themeForCondition(snap.weatherCode, snap.isDay);
  }, [snap]);
  const palette = paletteFor(theme);
  const condition = snap ? describeWeather(snap.weatherCode) : null;

  const place: Place = {
    id: fav.id,
    name: fav.name,
    country: fav.country,
    admin1: fav.admin1 ?? undefined,
    latitude: fav.latitude,
    longitude: fav.longitude,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.35 }}
      className="relative"
    >
      <button
        onClick={() => onSelect(place)}
        className={`relative w-full overflow-hidden rounded-2xl text-left transition group ${
          isActive ? "ring-2" : ""
        }`}
        style={{
          background: palette.gradient,
          color: palette.text,
          boxShadow: isActive
            ? `0 0 0 2px ${palette.ring}, 0 18px 40px -18px rgba(0,0,0,0.55)`
            : "0 18px 40px -22px rgba(0,0,0,0.55)",
          minHeight: 168,
        }}
        aria-label={`open ${fav.name}`}
      >
        {/* subtle texture overlay */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.18] pointer-events-none mix-blend-soft-light"
          style={{
            background:
              "radial-gradient(circle at 50% 100%, rgba(255,255,255,0.7), transparent 60%)",
          }}
        />

        {/* hover lift */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 60%)",
          }}
        />

        <div className="relative flex flex-col h-full p-4 gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {isActive && (
                  <MapPin
                    size={11}
                    style={{ color: palette.accent }}
                    aria-label="current"
                  />
                )}
                <span
                  className="font-semibold text-base truncate"
                  style={{ color: palette.text }}
                >
                  {fav.name}
                </span>
              </div>
              <div
                className="text-[11px] truncate uppercase tracking-wider"
                style={{ color: palette.subtext }}
              >
                {fav.admin1 ? `${fav.admin1} · ` : ""}
                {fav.country}
              </div>
            </div>
            <RemoveBtn
              palette={palette}
              onRemove={(e) => {
                e.stopPropagation();
                onRemove(fav.id);
              }}
            />
          </div>

          {state?.loading && !data ? (
            <SkeletonBody palette={palette} />
          ) : state?.error && !data ? (
            <ErrorBody
              palette={palette}
              onRetry={(e) => {
                e.stopPropagation();
                onRetry();
              }}
            />
          ) : snap ? (
            <>
              <div className="flex items-end justify-between gap-2 mt-auto">
                <div className="flex flex-col leading-none">
                  <span
                    className="text-4xl font-light tabular-nums"
                    style={{ color: palette.text }}
                  >
                    {Math.round(snap.temperature)}°
                  </span>
                  {today && (
                    <span
                      className="text-[11px] mt-1 tabular-nums"
                      style={{ color: palette.subtext }}
                    >
                      ↑ {Math.round(today.temperatureMax)}° ↓{" "}
                      {Math.round(today.temperatureMin)}°
                    </span>
                  )}
                </div>
                <WeatherIcon
                  iconName={condition?.icon ?? "cloud"}
                  isDay={snap.isDay}
                  color={palette.accent}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span
                  className="lowercase truncate"
                  style={{ color: palette.text }}
                >
                  {condition?.short ?? "—"}
                </span>
                <div
                  className="flex items-center gap-2 shrink-0"
                  style={{ color: palette.subtext }}
                >
                  <span className="flex items-center gap-1 tabular-nums">
                    <Wind size={10} />
                    {Math.round(snap.windSpeed)}
                  </span>
                  <span className="flex items-center gap-1 tabular-nums">
                    <Droplets size={10} />
                    {Math.round(snap.humidity)}%
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </button>
    </motion.div>
  );
}

function SkeletonBody({ palette }: { palette: ReturnType<typeof paletteFor> }) {
  return (
    <div className="flex items-center justify-center flex-1 min-h-[80px]">
      <Loader2
        size={18}
        className="animate-spin"
        style={{ color: palette.accent }}
      />
    </div>
  );
}

function ErrorBody({
  palette,
  onRetry,
}: {
  palette: ReturnType<typeof paletteFor>;
  onRetry: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 text-xs flex-1"
      style={{ color: palette.subtext }}
    >
      <AlertCircle size={14} style={{ color: palette.accent }} />
      <span className="flex-1">couldn&apos;t load</span>
      <span
        role="button"
        tabIndex={0}
        onClick={onRetry}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRetry(e as unknown as React.MouseEvent);
          }
        }}
        className="underline opacity-80 hover:opacity-100"
      >
        retry
      </span>
    </div>
  );
}

function RemoveBtn({
  palette,
  onRemove,
}: {
  palette: ReturnType<typeof paletteFor>;
  onRemove: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onRemove}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRemove(e as unknown as React.MouseEvent);
        }
      }}
      className="shrink-0 rounded-full p-1 opacity-50 hover:opacity-100 transition"
      style={{
        background: "rgba(0,0,0,0.18)",
        color: palette.text,
      }}
      aria-label="remove favorite"
    >
      <X size={11} />
    </span>
  );
}

const ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-snow": CloudSnow,
  snowflake: Snowflake,
  "cloud-lightning": CloudLightning,
};

function WeatherIcon({
  iconName,
  isDay,
  color,
}: {
  iconName: string;
  isDay: boolean;
  color: string;
}) {
  const Comp =
    !isDay && (iconName === "sun" || iconName === "cloud-sun")
      ? iconName === "sun"
        ? Moon
        : Cloud
      : ICONS[iconName] ?? Cloud;
  return (
    <Comp
      size={42}
      strokeWidth={1.4}
      style={{ color, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.25))" }}
    />
  );
}
