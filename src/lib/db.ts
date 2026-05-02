import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "cernos.json");

type StoredFavorite = {
  id: number;
  name: string;
  country: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
};

type StoredHistory = StoredFavorite;

export type StoredJournalEntry = {
  date: string;
  text: string;
  place: string;
  weatherCode: number;
  isDay: boolean;
  tempMax: number;
  tempMin: number;
  source: "claude" | "heuristic";
  created_at: string;
};

export type StoredRainAlarm = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  place: {
    name: string;
    country: string;
    admin1: string | null;
    latitude: number;
    longitude: number;
    timezone?: string;
  };
  lastFiredAt: string | null;
  created_at: string;
};

type DbShape = {
  favorites: StoredFavorite[];
  history: StoredHistory[];
  journal: StoredJournalEntry[];
  rainAlarms: StoredRainAlarm[];
  nextId: number;
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function read(): DbShape {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    return { favorites: [], history: [], journal: [], rainAlarms: [], nextId: 1 };
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as DbShape;
    return {
      favorites: parsed.favorites ?? [],
      history: parsed.history ?? [],
      journal: parsed.journal ?? [],
      rainAlarms: parsed.rainAlarms ?? [],
      nextId: parsed.nextId ?? 1,
    };
  } catch {
    return { favorites: [], history: [], journal: [], rainAlarms: [], nextId: 1 };
  }
}

function write(db: DbShape) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

export type StoredPlace = {
  name: string;
  country: string;
  admin1?: string | null;
  latitude: number;
  longitude: number;
};

function near(a: number, b: number) {
  return Math.abs(a - b) < 0.0001;
}

export function listFavorites() {
  const db = read();
  return [...db.favorites].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function addFavorite(p: StoredPlace) {
  const db = read();
  const exists = db.favorites.some(
    (f) => near(f.latitude, p.latitude) && near(f.longitude, p.longitude)
  );
  if (!exists) {
    db.favorites.push({
      id: db.nextId++,
      name: p.name,
      country: p.country,
      admin1: p.admin1 ?? null,
      latitude: p.latitude,
      longitude: p.longitude,
      created_at: new Date().toISOString(),
    });
    write(db);
  }
  return listFavorites();
}

export function removeFavorite(id: number) {
  const db = read();
  db.favorites = db.favorites.filter((f) => f.id !== id);
  write(db);
  return listFavorites();
}

export function recordHistory(p: StoredPlace) {
  const db = read();
  db.history.push({
    id: db.nextId++,
    name: p.name,
    country: p.country,
    admin1: p.admin1 ?? null,
    latitude: p.latitude,
    longitude: p.longitude,
    created_at: new Date().toISOString(),
  });
  if (db.history.length > 25) {
    db.history = db.history.slice(-25);
  }
  write(db);
}

export function getJournalEntry(date: string): StoredJournalEntry | undefined {
  const db = read();
  return db.journal.find((e) => e.date === date);
}

export function upsertJournalEntry(
  entry: StoredJournalEntry
): StoredJournalEntry {
  const db = read();
  const existing = db.journal.find((e) => e.date === entry.date);
  if (existing) return existing;
  db.journal.push(entry);
  write(db);
  return entry;
}

export function listJournal(limit = 365): StoredJournalEntry[] {
  const db = read();
  return [...db.journal]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export function listHistory(limit = 8) {
  const db = read();
  // de-duplicate by location, keeping most recent
  const byKey = new Map<string, StoredHistory>();
  for (const h of [...db.history].reverse()) {
    const key = `${h.latitude.toFixed(3)},${h.longitude.toFixed(3)}`;
    if (!byKey.has(key)) byKey.set(key, h);
  }
  return Array.from(byKey.values()).slice(0, limit);
}

export function listRainAlarms(): StoredRainAlarm[] {
  return read().rainAlarms;
}

export function findRainAlarm(endpoint: string): StoredRainAlarm | undefined {
  return read().rainAlarms.find((a) => a.endpoint === endpoint);
}

export function upsertRainAlarm(a: Omit<StoredRainAlarm, "created_at" | "lastFiredAt"> & {
  lastFiredAt?: string | null;
}): StoredRainAlarm {
  const db = read();
  const existing = db.rainAlarms.find((x) => x.endpoint === a.endpoint);
  if (existing) {
    existing.place = a.place;
    existing.keys = a.keys;
    write(db);
    return existing;
  }
  const next: StoredRainAlarm = {
    endpoint: a.endpoint,
    keys: a.keys,
    place: a.place,
    lastFiredAt: a.lastFiredAt ?? null,
    created_at: new Date().toISOString(),
  };
  db.rainAlarms.push(next);
  write(db);
  return next;
}

export function removeRainAlarm(endpoint: string): void {
  const db = read();
  db.rainAlarms = db.rainAlarms.filter((a) => a.endpoint !== endpoint);
  write(db);
}

export function markRainAlarmFired(endpoint: string, at: string): void {
  const db = read();
  const a = db.rainAlarms.find((x) => x.endpoint === endpoint);
  if (a) {
    a.lastFiredAt = at;
    write(db);
  }
}
