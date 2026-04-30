import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// North geomagnetic pole (IGRF-13, ~2025): 80.65°N, 72.68°W.
const N_MAG_LAT = 80.65;
const N_MAG_LON = -72.68;
const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

// Equatorward edge of the auroral oval by Kp (geomagnetic latitude).
// NOAA SWPC table — visibility extends a few degrees south of these.
const KP_BOUNDARY: Array<[number, number]> = [
  [0, 67],
  [1, 66],
  [2, 64.5],
  [3, 62.4],
  [4, 60.4],
  [5, 58.3],
  [6, 56.3],
  [7, 54.2],
  [8, 50.1],
  [9, 46.5],
];

type KpEntry = { time_tag: string; Kp: number; a_running: number };

let cache: { entries: KpEntry[]; fetched: number } | null = null;
const TTL_MS = 30 * 60 * 1000;

async function fetchKp(): Promise<KpEntry[] | null> {
  if (cache && Date.now() - cache.fetched < TTL_MS) {
    return cache.entries;
  }
  try {
    const r = await fetch(
      "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
      { cache: "no-store" }
    );
    if (!r.ok) return null;
    const json = await r.json();
    if (!Array.isArray(json) || json.length === 0) return null;
    cache = { entries: json as KpEntry[], fetched: Date.now() };
    return cache.entries;
  } catch {
    return null;
  }
}

function geomagneticLatitude(lat: number, lon: number): number {
  const phi = lat * DEG;
  const lam = lon * DEG;
  const phiP = N_MAG_LAT * DEG;
  const lamP = N_MAG_LON * DEG;
  const sinPsi =
    Math.sin(phi) * Math.sin(phiP) +
    Math.cos(phi) * Math.cos(phiP) * Math.cos(lam - lamP);
  return Math.asin(Math.max(-1, Math.min(1, sinPsi))) * RAD;
}

function boundaryFor(kp: number): number {
  const k = Math.max(0, Math.min(9, kp));
  const lo = Math.floor(k);
  const hi = Math.min(9, lo + 1);
  const t = k - lo;
  const a = KP_BOUNDARY[lo][1];
  const b = KP_BOUNDARY[hi][1];
  return a + (b - a) * t;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "missing_coords" }, { status: 400 });
  }

  const entries = await fetchKp();
  if (!entries) {
    return NextResponse.json({
      kp: null,
      observedAt: null,
      plausible: false,
      reason: "noaa_unavailable",
    });
  }

  const latest = entries[entries.length - 1];
  const kp = latest.Kp;
  const peak3d = entries
    .slice(-24)
    .reduce((m, e) => Math.max(m, e.Kp), 0);

  const geomagLat = geomagneticLatitude(lat, lon);
  const absGeo = Math.abs(geomagLat);
  const boundary = boundaryFor(kp);
  // "Visible directly overhead" requires lat ≥ boundary; "visible on horizon"
  // extends ~3-4° equatorward thanks to oval thickness + atmospheric height.
  const horizonMargin = 3.5;
  const overheadPlausible = absGeo >= boundary;
  const horizonPlausible = absGeo >= boundary - horizonMargin;
  const plausible = horizonPlausible;

  const stormLevel =
    kp >= 9
      ? "G5 extreme"
      : kp >= 8
      ? "G4 severe"
      : kp >= 7
      ? "G3 strong"
      : kp >= 6
      ? "G2 moderate"
      : kp >= 5
      ? "G1 minor"
      : null;

  return NextResponse.json({
    kp,
    peak3d,
    observedAt: latest.time_tag,
    geomagneticLat: geomagLat,
    boundaryLat: boundary,
    overheadPlausible,
    horizonPlausible,
    plausible,
    stormLevel,
  });
}
