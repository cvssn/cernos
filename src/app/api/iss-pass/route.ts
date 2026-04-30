import { NextRequest, NextResponse } from "next/server";
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToEcf,
  ecfToLookAngles,
} from "satellite.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let tleCache: { line1: string; line2: string; fetched: number } | null = null;
const TLE_TTL_MS = 6 * 60 * 60 * 1000;

async function fetchIssTle(): Promise<{ line1: string; line2: string } | null> {
  if (tleCache && Date.now() - tleCache.fetched < TLE_TTL_MS) {
    return { line1: tleCache.line1, line2: tleCache.line2 };
  }
  try {
    const r = await fetch(
      "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE",
      { cache: "no-store" }
    );
    if (!r.ok) return null;
    const text = await r.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 3) return null;
    const line1 = lines[1].trim();
    const line2 = lines[2].trim();
    tleCache = { line1, line2, fetched: Date.now() };
    return { line1, line2 };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = Number(sp.get("lat"));
  const lon = Number(sp.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "missing_coords" }, { status: 400 });
  }

  const tle = await fetchIssTle();
  if (!tle) {
    return NextResponse.json({ error: "tle_unavailable", pass: null });
  }

  const satrec = twoline2satrec(tle.line1, tle.line2);
  const observer = {
    latitude: (lat * Math.PI) / 180,
    longitude: (lon * Math.PI) / 180,
    height: 0.05,
  };

  const STEP_S = 30;
  const HORIZON_HOURS = 48;
  const MIN_ELEVATION_DEG = 10;
  const MIN_ELEVATION_RAD = (MIN_ELEVATION_DEG * Math.PI) / 180;

  const start = Date.now();
  let aboveStart: Date | null = null;
  let aboveEnd: Date | null = null;
  let peakEl = 0;

  for (let s = 0; s < HORIZON_HOURS * 3600; s += STEP_S) {
    const t = new Date(start + s * 1000);
    const pv = propagate(satrec, t);
    if (!pv || typeof pv === "boolean" || !pv.position || typeof pv.position === "boolean") {
      continue;
    }
    const gmst = gstime(t);
    const ecf = eciToEcf(pv.position, gmst);
    const look = ecfToLookAngles(observer, ecf);
    if (look.elevation > MIN_ELEVATION_RAD) {
      if (!aboveStart) aboveStart = t;
      if (look.elevation > peakEl) peakEl = look.elevation;
    } else if (aboveStart) {
      aboveEnd = t;
      break;
    }
  }

  if (!aboveStart) {
    return NextResponse.json({ pass: null });
  }

  return NextResponse.json({
    pass: {
      start: aboveStart.toISOString(),
      end: aboveEnd ? aboveEnd.toISOString() : null,
      peakElevationDeg: (peakEl * 180) / Math.PI,
    },
  });
}
