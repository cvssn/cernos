// Live lightning strike feed via Blitzortung's public WebSocket.
//
// The feed sends each strike as an LZW-compressed JSON string. The decoder
// below is the standard implementation used by community lightning maps.
// Time is in nanoseconds since epoch; we normalize to milliseconds.

export type LightningStrike = {
  time: number; // epoch ms
  lat: number;
  lon: number;
  alt?: number;
  pol?: number;
  mds?: number;
  mcg?: number;
  status?: number;
};

export type LightningStatus = "connecting" | "live" | "offline";

export type LightningHandle = {
  close(): void;
};

const HOSTS = [
  "wss://ws1.blitzortung.org/",
  "wss://ws7.blitzortung.org/",
  "wss://ws8.blitzortung.org/",
];

function decode(s: string): string {
  const dict: Record<number, string> = {};
  const data = s.split("");
  let curr = data[0];
  let prev = curr;
  const out: string[] = [curr];
  let code = 256;
  for (let i = 1; i < data.length; i++) {
    const c = data[i].charCodeAt(0);
    const entry =
      c < 256 ? data[i] : dict[c] !== undefined ? dict[c] : prev + curr;
    out.push(entry);
    curr = entry.charAt(0);
    dict[code] = prev + curr;
    code++;
    prev = entry;
  }
  return out.join("");
}

export function connectLightning(
  onStrike: (s: LightningStrike) => void,
  onStatus?: (status: LightningStatus) => void
): LightningHandle {
  let ws: WebSocket | null = null;
  let closed = false;
  let attempt = 0;
  let reconnect: ReturnType<typeof setTimeout> | null = null;

  const open = () => {
    if (closed) return;
    onStatus?.("connecting");
    const host = HOSTS[attempt % HOSTS.length];
    attempt++;
    try {
      ws = new WebSocket(host);
    } catch {
      schedule();
      return;
    }
    ws.onopen = () => {
      onStatus?.("live");
      try {
        ws?.send(JSON.stringify({ a: 111 }));
      } catch {
        // ignore
      }
    };
    ws.onmessage = (ev) => {
      if (typeof ev.data !== "string") return;
      let raw: string;
      try {
        raw = decode(ev.data);
      } catch {
        return;
      }
      let obj: unknown;
      try {
        obj = JSON.parse(raw);
      } catch {
        return;
      }
      if (
        obj &&
        typeof obj === "object" &&
        "lat" in obj &&
        "lon" in obj &&
        typeof (obj as { lat: unknown }).lat === "number" &&
        typeof (obj as { lon: unknown }).lon === "number"
      ) {
        const o = obj as {
          lat: number;
          lon: number;
          time?: number;
          alt?: number;
          pol?: number;
          mds?: number;
          mcg?: number;
          status?: number;
        };
        const t =
          typeof o.time === "number" ? Math.floor(o.time / 1e6) : Date.now();
        onStrike({
          time: t,
          lat: o.lat,
          lon: o.lon,
          alt: o.alt,
          pol: o.pol,
          mds: o.mds,
          mcg: o.mcg,
          status: o.status,
        });
      }
    };
    ws.onerror = () => {
      onStatus?.("offline");
    };
    ws.onclose = () => {
      onStatus?.("offline");
      schedule();
    };
  };

  const schedule = () => {
    if (closed) return;
    const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5));
    reconnect = setTimeout(open, delay);
  };

  open();

  return {
    close() {
      closed = true;
      if (reconnect) clearTimeout(reconnect);
      try {
        ws?.close();
      } catch {
        // ignore
      }
    },
  };
}
