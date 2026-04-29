"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CloudRain, Play, Pause, Radar } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Frame = { time: number; path: string };
type RainViewerData = {
  version: string;
  generated: number;
  host: string;
  radar: { past: Frame[]; nowcast: Frame[] };
};

const COLOR_SCHEME = 2;
const SMOOTH = 1;
const SHOW_SNOW = 1;
const TILE_SIZE = 256;
const FRAME_INTERVAL_MS = 500;
const PAUSE_AT_NOW_MS = 1500;
const RADAR_OPACITY = 0.78;

export default function PrecipitationRadar({
  lat,
  lon,
  placeName,
}: {
  lat: number;
  lon: number;
  placeName: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const layersRef = useRef<Record<string, L.TileLayer>>({});
  const [data, setData] = useState<RainViewerData | null>(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const frames = useMemo<Frame[]>(() => {
    if (!data) return [];
    return [...data.radar.past, ...data.radar.nowcast];
  }, [data]);

  const nowFrameIdx = data ? data.radar.past.length - 1 : 0;
  const isFuture = data ? frameIdx > nowFrameIdx : false;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [lat, lon],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      preferCanvas: true,
    });
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([lat, lon], map.getZoom() ?? 7, { animate: true });
    if (markerRef.current) markerRef.current.remove();
    const icon = L.divIcon({
      className: "radar-pulse-icon",
      html: '<span class="radar-pulse-dot"></span>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const marker = L.marker([lat, lon], { icon, interactive: false }).addTo(map);
    markerRef.current = marker;
  }, [lat, lon, placeName]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const r = await fetch(
          "https://api.rainviewer.com/public/weather-maps.json",
          { cache: "no-store" }
        );
        if (!r.ok) throw new Error("Radar service unavailable");
        const d: RainViewerData = await r.json();
        if (cancelled) return;
        setData(d);
        setFrameIdx(d.radar.past.length - 1);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Radar offline");
      }
    }
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data || frames.length === 0) return;
    const frame = frames[frameIdx];
    if (!frame) return;
    const url = `${data.host}${frame.path}/${TILE_SIZE}/{z}/{x}/{y}/${COLOR_SCHEME}/${SMOOTH}_${SHOW_SNOW}.png`;
    let layer = layersRef.current[frame.path];
    if (!layer) {
      layer = L.tileLayer(url, {
        opacity: 0,
        tileSize: TILE_SIZE,
        zIndex: 200 + frameIdx,
        crossOrigin: true,
      });
      layer.addTo(map);
      layersRef.current[frame.path] = layer;
    }
    Object.entries(layersRef.current).forEach(([path, l]) => {
      l.setOpacity(path === frame.path ? RADAR_OPACITY : 0);
    });
  }, [data, frames, frameIdx]);

  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const isAtNow = frameIdx === nowFrameIdx;
    const delay = isAtNow ? PAUSE_AT_NOW_MS : FRAME_INTERVAL_MS;
    const t = setTimeout(() => {
      setFrameIdx((i) => (i + 1) % frames.length);
    }, delay);
    return () => clearTimeout(t);
  }, [playing, frames.length, frameIdx, nowFrameIdx]);

  const currentFrame = frames[frameIdx];
  const frameTime = currentFrame ? new Date(currentFrame.time * 1000) : null;
  const minutesFromNow =
    currentFrame && data
      ? Math.round(
          (currentFrame.time -
            data.radar.past[data.radar.past.length - 1].time) /
            60
        )
      : 0;

  const subtitle = error
    ? error
    : !data
    ? "Loading radar…"
    : frameTime
    ? `${frameTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} · ${
        isFuture
          ? `+${minutesFromNow}m forecast`
          : minutesFromNow === 0
          ? "now"
          : `${Math.abs(minutesFromNow)}m ago`
      }`
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Radar className="accent shrink-0" size={18} strokeWidth={1.6} />
          <div className="min-w-0">
            <div className="text-main font-medium leading-tight">
              Precipitation Radar
            </div>
            <div className="text-sub text-xs truncate">{subtitle}</div>
          </div>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause radar" : "Play radar"}
          className="glass px-3 py-2 text-sm flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transition shrink-0"
          disabled={!data}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
        </button>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="w-full h-[300px] md:h-[360px] radar-map"
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-sub text-sm bg-black/40 backdrop-blur-sm">
            <CloudRain size={16} className="mr-2" /> Radar unavailable
          </div>
        )}
        {!data && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sub text-sm bg-black/30 backdrop-blur-sm">
            <Radar size={16} className="mr-2 animate-pulse" /> Tuning radar…
          </div>
        )}
      </div>

      {frames.length > 0 && (
        <div className="px-5 pb-4 pt-3">
          <div className="relative">
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={frameIdx}
              onChange={(e) => {
                setPlaying(false);
                setFrameIdx(Number(e.target.value));
              }}
              className="radar-range w-full"
              aria-label="Radar timeline"
            />
            <div
              className="radar-now-tick"
              style={{
                left: `${(nowFrameIdx / (frames.length - 1)) * 100}%`,
              }}
              aria-hidden
            />
          </div>
          <div className="flex justify-between text-sub text-[11px] uppercase tracking-wider mt-1">
            <span>−2h</span>
            <span className={frameIdx === nowFrameIdx ? "accent" : ""}>
              now
            </span>
            <span>+30m</span>
          </div>
          <div className="text-sub text-[10px] text-right mt-2 opacity-70">
            Tiles © CARTO · Radar © RainViewer
          </div>
        </div>
      )}
    </motion.div>
  );
}
