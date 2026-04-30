// Pure-math astronomy: sun, moon, planets, twilight events.
// Formulas adapted from Paul Schlyter's "How to compute planetary positions"
// (https://stjarnhimlen.se/comp/ppcomp.html). Accuracy: arc-minute level for
// sun/moon, sub-degree for planets — fine for visibility and rise/set timing.

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export type EquatorialCoord = { ra: number; dec: number; distance?: number };
export type HorizontalCoord = { altitude: number; azimuth: number };

export type PlanetName = "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn";

export type PlanetVisibility = {
  name: PlanetName;
  symbol: string;
  altitude: number;
  azimuth: number;
  visible: boolean;
  brightness: "brilliant" | "bright" | "moderate" | "faint";
};

export type MoonInfo = {
  illumination: number;
  phaseName: string;
  phaseAngle: number;
  waxing: boolean;
  rise: Date | null;
  set: Date | null;
  altitude: number;
  azimuth: number;
};

export type TwilightWindows = {
  solarAltitude: number;
  inGoldenHour: boolean;
  inBlueHour: boolean;
  nextGoldenStart: Date | null;
  nextGoldenEnd: Date | null;
  nextBlueStart: Date | null;
  nextBlueEnd: Date | null;
};

// Days since J2000.0 (Jan 1.5 2000 TT). Using UTC is close enough.
function dJ2000(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5 - 2451545.0;
}

function gmstDeg(date: Date): number {
  const d = dJ2000(date);
  const T = d / 36525;
  const g =
    280.46061837 +
    360.98564736629 * d +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return ((g % 360) + 360) % 360;
}

function lstDeg(date: Date, longitude: number): number {
  return ((gmstDeg(date) + longitude) % 360 + 360) % 360;
}

function obliquity(d: number): number {
  return (23.4393 - 3.563e-7 * d) * DEG;
}

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

// Sun: ecliptic + equatorial coords. Sub-arcminute accurate.
export function sunPosition(date: Date): EquatorialCoord & { lambda: number } {
  const d = dJ2000(date);
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = norm360(356.047 + 0.9856002585 * d);
  const Mr = M * DEG;
  let E = M + (e * RAD) * Math.sin(Mr) * (1 + e * Math.cos(Mr));
  for (let i = 0; i < 5; i++) {
    const Er = E * DEG;
    E = E - (E - (e * RAD) * Math.sin(Er) - M) / (1 - e * Math.cos(Er));
  }
  const Er = E * DEG;
  const xv = Math.cos(Er) - e;
  const yv = Math.sqrt(1 - e * e) * Math.sin(Er);
  const v = Math.atan2(yv, xv) * RAD;
  const r = Math.sqrt(xv * xv + yv * yv);
  const lambda = norm360(v + w);
  const eps = obliquity(d);
  const lam = lambda * DEG;
  const xs = r * Math.cos(lam);
  const ys = r * Math.sin(lam);
  const xe = xs;
  const ye = ys * Math.cos(eps);
  const ze = ys * Math.sin(eps);
  const ra = norm360(Math.atan2(ye, xe) * RAD);
  const dec = Math.atan2(ze, Math.sqrt(xe * xe + ye * ye)) * RAD;
  return { ra, dec, lambda, distance: r };
}

// Moon: geocentric equatorial coords.
export function moonPosition(date: Date): EquatorialCoord & { lambda: number } {
  const d = dJ2000(date);
  const N = norm360(125.1228 - 0.0529538083 * d) * DEG;
  const i = 5.1454 * DEG;
  const w = norm360(318.0634 + 0.1643573223 * d) * DEG;
  const a = 60.2666;
  const e = 0.0549;
  const M = norm360(115.3654 + 13.0649929509 * d) * DEG;

  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 6; k++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  const xh =
    r *
    (Math.cos(N) * Math.cos(v + w) -
      Math.sin(N) * Math.sin(v + w) * Math.cos(i));
  const yh =
    r *
    (Math.sin(N) * Math.cos(v + w) +
      Math.cos(N) * Math.sin(v + w) * Math.cos(i));
  const zh = r * Math.sin(v + w) * Math.sin(i);

  const lonEcl = Math.atan2(yh, xh);
  const latEcl = Math.atan2(zh, Math.sqrt(xh * xh + yh * yh));

  // Major perturbations (Schlyter): keeps lunar position within ~0.1°.
  const sun = sunPosition(date);
  const Ls = sun.lambda * DEG;
  const Lm = norm360((N * RAD) + (w * RAD) + (M * RAD)) * DEG;
  const Ms = norm360(356.047 + 0.9856002585 * d) * DEG;
  const Mm = M;
  const D = Lm - Ls;
  const F = Lm - N;

  const lonPert =
    (-1.274 * Math.sin(Mm - 2 * D) +
      0.658 * Math.sin(2 * D) -
      0.186 * Math.sin(Ms) -
      0.059 * Math.sin(2 * Mm - 2 * D) -
      0.057 * Math.sin(Mm - 2 * D + Ms) +
      0.053 * Math.sin(Mm + 2 * D) +
      0.046 * Math.sin(2 * D - Ms) +
      0.041 * Math.sin(Mm - Ms) -
      0.035 * Math.sin(D) -
      0.031 * Math.sin(Mm + Ms)) *
    DEG;
  const latPert =
    (-0.173 * Math.sin(F - 2 * D) -
      0.055 * Math.sin(Mm - F - 2 * D) -
      0.046 * Math.sin(Mm + F - 2 * D) +
      0.033 * Math.sin(F + 2 * D) +
      0.017 * Math.sin(2 * Mm + F)) *
    DEG;

  const lonFinal = lonEcl + lonPert;
  const latFinal = latEcl + latPert;
  const rFinal = r;

  const xeclip = rFinal * Math.cos(lonFinal) * Math.cos(latFinal);
  const yeclip = rFinal * Math.sin(lonFinal) * Math.cos(latFinal);
  const zeclip = rFinal * Math.sin(latFinal);

  const eps = obliquity(d);
  const xe = xeclip;
  const ye = yeclip * Math.cos(eps) - zeclip * Math.sin(eps);
  const ze = yeclip * Math.sin(eps) + zeclip * Math.cos(eps);

  const ra = norm360(Math.atan2(ye, xe) * RAD);
  const dec =
    Math.atan2(ze, Math.sqrt(xe * xe + ye * ye)) * RAD;

  return { ra, dec, distance: rFinal, lambda: norm360(lonFinal * RAD) };
}

// Convert RA/Dec to local horizontal alt/az.
export function equatorialToHorizontal(
  eq: EquatorialCoord,
  date: Date,
  latitude: number,
  longitude: number
): HorizontalCoord {
  const lst = lstDeg(date, longitude);
  const ha = ((lst - eq.ra + 360) % 360) * DEG;
  const dec = eq.dec * DEG;
  const lat = latitude * DEG;
  const sinAlt =
    Math.sin(dec) * Math.sin(lat) +
    Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const altitude = Math.asin(sinAlt) * RAD;
  const cosAlt = Math.cos(altitude * DEG);
  const sinAz = -Math.sin(ha) * Math.cos(dec) / cosAlt;
  const cosAz =
    (Math.sin(dec) - Math.sin(altitude * DEG) * Math.sin(lat)) /
    (cosAlt * Math.cos(lat));
  const azimuth = (Math.atan2(sinAz, cosAz) * RAD + 360) % 360;
  return { altitude, azimuth };
}

// Planetary orbital elements (Schlyter), heliocentric ecliptic.
type Elements = {
  N: (d: number) => number;
  i: (d: number) => number;
  w: (d: number) => number;
  a: number;
  e: (d: number) => number;
  M: (d: number) => number;
};

const PLANETS: Record<PlanetName | "Earth", Elements> = {
  Mercury: {
    N: (d) => 48.3313 + 3.24587e-5 * d,
    i: (d) => 7.0047 + 5e-8 * d,
    w: (d) => 29.1241 + 1.01444e-5 * d,
    a: 0.387098,
    e: (d) => 0.205635 + 5.59e-10 * d,
    M: (d) => 168.6562 + 4.0923344368 * d,
  },
  Venus: {
    N: (d) => 76.6799 + 2.4659e-5 * d,
    i: (d) => 3.3946 + 2.75e-8 * d,
    w: (d) => 54.891 + 1.38374e-5 * d,
    a: 0.72333,
    e: (d) => 0.006773 - 1.302e-9 * d,
    M: (d) => 48.0052 + 1.6021302244 * d,
  },
  Mars: {
    N: (d) => 49.5574 + 2.11081e-5 * d,
    i: (d) => 1.8497 - 1.78e-8 * d,
    w: (d) => 286.5016 + 2.92961e-5 * d,
    a: 1.523688,
    e: (d) => 0.093405 + 2.516e-9 * d,
    M: (d) => 18.6021 + 0.5240207766 * d,
  },
  Jupiter: {
    N: (d) => 100.4542 + 2.76854e-5 * d,
    i: (d) => 1.303 - 1.557e-7 * d,
    w: (d) => 273.8777 + 1.64505e-5 * d,
    a: 5.20256,
    e: (d) => 0.048498 + 4.469e-9 * d,
    M: (d) => 19.895 + 0.0830853001 * d,
  },
  Saturn: {
    N: (d) => 113.6634 + 2.3898e-5 * d,
    i: (d) => 2.4886 - 1.081e-7 * d,
    w: (d) => 339.3939 + 2.97661e-5 * d,
    a: 9.55475,
    e: (d) => 0.055546 - 9.499e-9 * d,
    M: (d) => 316.967 + 0.0334442282 * d,
  },
  Earth: {
    N: () => 0,
    i: () => 0,
    w: (d) => 282.9404 + 4.70935e-5 * d,
    a: 1,
    e: (d) => 0.016709 - 1.151e-9 * d,
    M: (d) => 356.047 + 0.9856002585 * d,
  },
};

function heliocentricEcliptic(planet: PlanetName | "Earth", d: number) {
  const el = PLANETS[planet];
  const N = el.N(d) * DEG;
  const i = el.i(d) * DEG;
  const w = el.w(d) * DEG;
  const a = el.a;
  const e = el.e(d);
  const M = norm360(el.M(d)) * DEG;

  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 8; k++) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);

  const xh =
    r *
    (Math.cos(N) * Math.cos(v + w) -
      Math.sin(N) * Math.sin(v + w) * Math.cos(i));
  const yh =
    r *
    (Math.sin(N) * Math.cos(v + w) +
      Math.cos(N) * Math.sin(v + w) * Math.cos(i));
  const zh = r * Math.sin(v + w) * Math.sin(i);
  return { x: xh, y: yh, z: zh };
}

export function planetPosition(planet: PlanetName, date: Date): EquatorialCoord {
  const d = dJ2000(date);
  const p = heliocentricEcliptic(planet, d);
  const earthRaw = heliocentricEcliptic("Earth", d);
  // Earth's elements above describe Sun's apparent orbit; flip to get Earth's heliocentric position.
  const earth = { x: -earthRaw.x, y: -earthRaw.y, z: -earthRaw.z };
  const x = p.x - earth.x;
  const y = p.y - earth.y;
  const z = p.z - earth.z;
  const eps = obliquity(d);
  const xe = x;
  const ye = y * Math.cos(eps) - z * Math.sin(eps);
  const ze = y * Math.sin(eps) + z * Math.cos(eps);
  const ra = norm360(Math.atan2(ye, xe) * RAD);
  const dec = Math.atan2(ze, Math.sqrt(xe * xe + ye * ye)) * RAD;
  const distance = Math.sqrt(x * x + y * y + z * z);
  return { ra, dec, distance };
}

// Refraction-corrected horizon altitude for rise/set tests.
const HORIZON_SUN = -0.833;
const HORIZON_MOON = 0.125;

function altitudeAt(
  body: (date: Date) => EquatorialCoord,
  date: Date,
  latitude: number,
  longitude: number
): number {
  return equatorialToHorizontal(body(date), date, latitude, longitude).altitude;
}

function findCrossing(
  body: (date: Date) => EquatorialCoord,
  start: Date,
  end: Date,
  latitude: number,
  longitude: number,
  threshold: number,
  rising: boolean
): Date | null {
  const stepMs = 5 * 60 * 1000;
  let prevT = start;
  let prevA = altitudeAt(body, prevT, latitude, longitude);
  for (let t = start.getTime() + stepMs; t <= end.getTime(); t += stepMs) {
    const curT = new Date(t);
    const curA = altitudeAt(body, curT, latitude, longitude);
    const cross = rising
      ? prevA < threshold && curA > threshold
      : prevA > threshold && curA < threshold;
    if (cross) {
      // bisect to ~30s
      let lo = prevT.getTime();
      let hi = curT.getTime();
      for (let k = 0; k < 8; k++) {
        const mid = (lo + hi) / 2;
        const a = altitudeAt(body, new Date(mid), latitude, longitude);
        const above = a > threshold;
        if (rising ? above : !above) hi = mid;
        else lo = mid;
      }
      return new Date((lo + hi) / 2);
    }
    prevT = curT;
    prevA = curA;
  }
  return null;
}

// Find next moonrise and moonset within a 28-hour search window.
export function moonRiseSet(
  date: Date,
  latitude: number,
  longitude: number
): { rise: Date | null; set: Date | null } {
  const end = new Date(date.getTime() + 28 * 3600 * 1000);
  const rise = findCrossing(
    moonPosition,
    date,
    end,
    latitude,
    longitude,
    HORIZON_MOON,
    true
  );
  const set = findCrossing(
    moonPosition,
    date,
    end,
    latitude,
    longitude,
    HORIZON_MOON,
    false
  );
  return { rise, set };
}

const MOON_PHASES: Array<[number, string]> = [
  [0.03, "New moon"],
  [0.22, "Waxing crescent"],
  [0.28, "First quarter"],
  [0.47, "Waxing gibbous"],
  [0.53, "Full moon"],
  [0.72, "Waning gibbous"],
  [0.78, "Last quarter"],
  [0.97, "Waning crescent"],
];

function phaseLabel(elong: number): string {
  const t = elong / 360;
  for (const [bound, name] of MOON_PHASES) {
    if (t < bound) return name;
  }
  return "New moon";
}

export function moonInfo(
  date: Date,
  latitude: number,
  longitude: number
): MoonInfo {
  const moon = moonPosition(date);
  const sun = sunPosition(date);
  const elong = norm360(moon.lambda - sun.lambda);
  const phaseAngle = elong;
  const illumination = (1 - Math.cos(elong * DEG)) / 2;
  const waxing = elong < 180;
  const horiz = equatorialToHorizontal({ ra: moon.ra, dec: moon.dec }, date, latitude, longitude);
  const { rise, set } = moonRiseSet(date, latitude, longitude);
  return {
    illumination,
    phaseName: phaseLabel(elong),
    phaseAngle,
    waxing,
    rise,
    set,
    altitude: horiz.altitude,
    azimuth: horiz.azimuth,
  };
}

// Approximate apparent magnitude → visibility bucket.
const PLANET_META: Record<PlanetName, { symbol: string; baseMag: number }> = {
  Mercury: { symbol: "☿", baseMag: -0.4 },
  Venus: { symbol: "♀", baseMag: -4.4 },
  Mars: { symbol: "♂", baseMag: 0.0 },
  Jupiter: { symbol: "♃", baseMag: -2.6 },
  Saturn: { symbol: "♄", baseMag: 0.5 },
};

export function planetVisibility(
  date: Date,
  latitude: number,
  longitude: number
): PlanetVisibility[] {
  return (Object.keys(PLANET_META) as PlanetName[]).map((name) => {
    const eq = planetPosition(name, date);
    const horiz = equatorialToHorizontal(eq, date, latitude, longitude);
    const meta = PLANET_META[name];
    const visible = horiz.altitude > 5;
    const brightness =
      meta.baseMag <= -3
        ? "brilliant"
        : meta.baseMag <= -1
        ? "bright"
        : meta.baseMag <= 1
        ? "moderate"
        : "faint";
    return {
      name,
      symbol: meta.symbol,
      altitude: horiz.altitude,
      azimuth: horiz.azimuth,
      visible,
      brightness,
    };
  });
}

// Twilight events. Golden hour: solar altitude in [-4°, +6°].
// Blue hour: [-6°, -4°].
const GOLDEN_LO = -4;
const GOLDEN_HI = 6;
const BLUE_LO = -6;
const BLUE_HI = -4;

function solarAlt(date: Date, latitude: number, longitude: number): number {
  return equatorialToHorizontal(sunPosition(date), date, latitude, longitude).altitude;
}

function nextThresholdCross(
  date: Date,
  latitude: number,
  longitude: number,
  threshold: number,
  goingDown: boolean,
  horizonHours: number
): Date | null {
  const stepMs = 60 * 1000;
  const endMs = date.getTime() + horizonHours * 3600 * 1000;
  let prevT = date;
  let prevA = solarAlt(prevT, latitude, longitude);
  for (let t = date.getTime() + stepMs; t <= endMs; t += stepMs) {
    const cur = new Date(t);
    const a = solarAlt(cur, latitude, longitude);
    const cross = goingDown
      ? prevA > threshold && a <= threshold
      : prevA < threshold && a >= threshold;
    if (cross) {
      let lo = prevT.getTime();
      let hi = cur.getTime();
      for (let k = 0; k < 6; k++) {
        const mid = (lo + hi) / 2;
        const ma = solarAlt(new Date(mid), latitude, longitude);
        const past = goingDown ? ma <= threshold : ma >= threshold;
        if (past) hi = mid;
        else lo = mid;
      }
      return new Date((lo + hi) / 2);
    }
    prevT = cur;
    prevA = a;
  }
  return null;
}

export function twilightWindows(
  date: Date,
  latitude: number,
  longitude: number
): TwilightWindows {
  const alt = solarAlt(date, latitude, longitude);
  const inGoldenHour = alt >= GOLDEN_LO && alt <= GOLDEN_HI;
  const inBlueHour = alt >= BLUE_LO && alt <= BLUE_HI;

  // Determine direction sun is moving (rising or setting).
  const futureAlt = solarAlt(new Date(date.getTime() + 5 * 60 * 1000), latitude, longitude);
  const setting = futureAlt < alt;

  // Find next entry into each band.
  // For golden hour: enters from outside the band — either crossing GOLDEN_LO going up (dawn)
  // or crossing GOLDEN_HI going down (dusk). We find both candidates and pick the soonest.
  const goldenCands: Array<Date | null> = [];
  if (alt < GOLDEN_LO) goldenCands.push(nextThresholdCross(date, latitude, longitude, GOLDEN_LO, false, 36));
  if (alt > GOLDEN_HI) goldenCands.push(nextThresholdCross(date, latitude, longitude, GOLDEN_HI, true, 36));
  if (alt >= GOLDEN_LO && alt <= GOLDEN_HI) {
    // currently inside — next "start" is the next entry after we leave.
    const exitUp = nextThresholdCross(date, latitude, longitude, GOLDEN_HI, false, 36);
    const exitDown = nextThresholdCross(date, latitude, longitude, GOLDEN_LO, true, 36);
    const exit = setting ? exitDown : exitUp;
    if (exit) {
      goldenCands.push(nextThresholdCross(exit, latitude, longitude, GOLDEN_LO, false, 36));
      goldenCands.push(nextThresholdCross(exit, latitude, longitude, GOLDEN_HI, true, 36));
    }
  }
  const nextGoldenStart = soonest(goldenCands, date);

  let nextGoldenEnd: Date | null = null;
  if (nextGoldenStart) {
    const after = nextGoldenStart;
    const upEnd = nextThresholdCross(after, latitude, longitude, GOLDEN_HI, false, 36);
    const downEnd = nextThresholdCross(after, latitude, longitude, GOLDEN_LO, true, 36);
    nextGoldenEnd = soonest([upEnd, downEnd], after);
  } else if (inGoldenHour) {
    const upEnd = nextThresholdCross(date, latitude, longitude, GOLDEN_HI, false, 36);
    const downEnd = nextThresholdCross(date, latitude, longitude, GOLDEN_LO, true, 36);
    nextGoldenEnd = soonest([upEnd, downEnd], date);
  }

  const blueCands: Array<Date | null> = [];
  if (alt < BLUE_LO) blueCands.push(nextThresholdCross(date, latitude, longitude, BLUE_LO, false, 36));
  if (alt > BLUE_HI) blueCands.push(nextThresholdCross(date, latitude, longitude, BLUE_HI, true, 36));
  if (alt >= BLUE_LO && alt <= BLUE_HI) {
    const exitUp = nextThresholdCross(date, latitude, longitude, BLUE_HI, false, 36);
    const exitDown = nextThresholdCross(date, latitude, longitude, BLUE_LO, true, 36);
    const exit = setting ? exitDown : exitUp;
    if (exit) {
      blueCands.push(nextThresholdCross(exit, latitude, longitude, BLUE_LO, false, 36));
      blueCands.push(nextThresholdCross(exit, latitude, longitude, BLUE_HI, true, 36));
    }
  }
  const nextBlueStart = soonest(blueCands, date);

  let nextBlueEnd: Date | null = null;
  if (nextBlueStart) {
    const upEnd = nextThresholdCross(nextBlueStart, latitude, longitude, BLUE_HI, false, 36);
    const downEnd = nextThresholdCross(nextBlueStart, latitude, longitude, BLUE_LO, true, 36);
    nextBlueEnd = soonest([upEnd, downEnd], nextBlueStart);
  } else if (inBlueHour) {
    const upEnd = nextThresholdCross(date, latitude, longitude, BLUE_HI, false, 36);
    const downEnd = nextThresholdCross(date, latitude, longitude, BLUE_LO, true, 36);
    nextBlueEnd = soonest([upEnd, downEnd], date);
  }

  return {
    solarAltitude: alt,
    inGoldenHour,
    inBlueHour,
    nextGoldenStart,
    nextGoldenEnd,
    nextBlueStart,
    nextBlueEnd,
  };
}

function soonest(dates: Array<Date | null>, after: Date): Date | null {
  let best: Date | null = null;
  for (const d of dates) {
    if (!d) continue;
    if (d.getTime() <= after.getTime()) continue;
    if (!best || d.getTime() < best.getTime()) best = d;
  }
  return best;
}
