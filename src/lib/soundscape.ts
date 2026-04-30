import type { ThemeName } from "./types";

// Web Audio API soundscape synthesizer.
// All sounds are generated procedurally — no asset files. Each layer owns its
// graph and gain node; theme switching cross-fades layers in/out via setTheme().

type LayerName = "rain" | "wind" | "thunder" | "birds" | "crickets";

type Layer = {
  name: LayerName;
  gain: GainNode;
  start: () => void;
  stop: () => void;
  // target volume (multiplied by master). 0 means: not part of current theme.
  targetVolume: number;
};

type ThemeMix = Partial<Record<LayerName, number>>;

const MIXES: Record<ThemeName, ThemeMix> = {
  "clear-day": { birds: 0.5, wind: 0.12 },
  "clear-night": { crickets: 0.45, wind: 0.1 },
  "cloudy-day": { wind: 0.3, birds: 0.18 },
  "cloudy-night": { wind: 0.32, crickets: 0.18 },
  rain: { rain: 0.55, wind: 0.18 },
  drizzle: { rain: 0.32, wind: 0.14 },
  thunderstorm: { rain: 0.6, wind: 0.28, thunder: 0.9 },
  snow: { wind: 0.18 },
  fog: { wind: 0.16 },
};

export class Soundscape {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private layers: Map<LayerName, Layer> = new Map();
  private currentTheme: ThemeName | null = null;
  private masterVolume = 0.6;
  private running = false;

  start(theme: ThemeName) {
    if (!this.ctx) {
      const Ctx = typeof window !== "undefined"
        ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
        : null;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.ratio.value = 4;
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.compressor.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.buildLayers();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    this.running = true;
    this.setTheme(theme);
    // fade master in
    const t = this.ctx.currentTime;
    this.master!.gain.cancelScheduledValues(t);
    this.master!.gain.setValueAtTime(this.master!.gain.value, t);
    this.master!.gain.linearRampToValueAtTime(this.masterVolume, t + 0.8);
  }

  stop() {
    if (!this.ctx || !this.master) return;
    this.running = false;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.6);
    // suspend after fade
    setTimeout(() => {
      if (!this.running) void this.ctx?.suspend();
    }, 700);
  }

  setVolume(v: number) {
    this.masterVolume = Math.max(0, Math.min(1, v));
    if (this.ctx && this.master && this.running) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(this.master.gain.value, t);
      this.master.gain.linearRampToValueAtTime(this.masterVolume, t + 0.25);
    }
  }

  getVolume() {
    return this.masterVolume;
  }

  setTheme(theme: ThemeName) {
    if (!this.ctx) return;
    this.currentTheme = theme;
    const mix = MIXES[theme] ?? {};
    const t = this.ctx.currentTime;
    this.layers.forEach((layer) => {
      const target = mix[layer.name] ?? 0;
      layer.targetVolume = target;
      layer.gain.gain.cancelScheduledValues(t);
      layer.gain.gain.setValueAtTime(layer.gain.gain.value, t);
      layer.gain.gain.linearRampToValueAtTime(target, t + 1.4);
    });
  }

  getActiveLayerNames(): LayerName[] {
    if (!this.currentTheme) return [];
    const mix = MIXES[this.currentTheme] ?? {};
    return (Object.keys(mix) as LayerName[]).filter((k) => (mix[k] ?? 0) > 0);
  }

  dispose() {
    this.layers.forEach((l) => l.stop());
    this.layers.clear();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.compressor = null;
  }

  private buildLayers() {
    if (!this.ctx || !this.compressor) return;
    const dest = this.compressor;
    this.layers.set("rain", makeRainLayer(this.ctx, dest));
    this.layers.set("wind", makeWindLayer(this.ctx, dest));
    this.layers.set("thunder", makeThunderLayer(this.ctx, dest));
    this.layers.set("birds", makeBirdLayer(this.ctx, dest));
    this.layers.set("crickets", makeCricketLayer(this.ctx, dest));
    this.layers.forEach((l) => l.start());
  }
}

// ---------- noise buffers ----------

function whiteNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function brownNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    data[i] = last * 3.5;
  }
  return buf;
}

// ---------- layers ----------

function makeRainLayer(ctx: AudioContext, dest: AudioNode): Layer {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(dest);

  // body: white noise → bandpass → highpass
  const noise = ctx.createBufferSource();
  noise.buffer = whiteNoiseBuffer(ctx, 5);
  noise.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2200;
  band.Q.value = 0.6;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 500;
  noise.connect(band).connect(hp).connect(gain);

  // splatter: extra higher-pitched white noise
  const splatter = ctx.createBufferSource();
  splatter.buffer = whiteNoiseBuffer(ctx, 5);
  splatter.loop = true;
  const splatterBp = ctx.createBiquadFilter();
  splatterBp.type = "bandpass";
  splatterBp.frequency.value = 5000;
  splatterBp.Q.value = 0.9;
  const splatterGain = ctx.createGain();
  splatterGain.gain.value = 0.4;
  splatter.connect(splatterBp).connect(splatterGain).connect(gain);

  return {
    name: "rain",
    gain,
    targetVolume: 0,
    start() {
      noise.start();
      splatter.start();
    },
    stop() {
      try { noise.stop(); splatter.stop(); } catch {}
    },
  };
}

function makeWindLayer(ctx: AudioContext, dest: AudioNode): Layer {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(dest);

  const noise = ctx.createBufferSource();
  noise.buffer = brownNoiseBuffer(ctx, 6);
  noise.loop = true;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 700;
  lp.Q.value = 0.3;

  // slow LFO modulating the cutoff for a swelling feel
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 350;
  lfo.connect(lfoGain).connect(lp.frequency);

  // amplitude LFO via second oscillator
  const ampLfo = ctx.createOscillator();
  ampLfo.frequency.value = 0.12;
  const ampLfoGain = ctx.createGain();
  ampLfoGain.gain.value = 0.3;
  const ampOffset = ctx.createConstantSource();
  ampOffset.offset.value = 0.7;
  const ampGain = ctx.createGain();
  ampGain.gain.value = 0;
  ampLfo.connect(ampLfoGain).connect(ampGain.gain);
  ampOffset.connect(ampGain.gain);

  noise.connect(lp).connect(ampGain).connect(gain);

  return {
    name: "wind",
    gain,
    targetVolume: 0,
    start() {
      noise.start();
      lfo.start();
      ampLfo.start();
      ampOffset.start();
    },
    stop() {
      try { noise.stop(); lfo.stop(); ampLfo.stop(); ampOffset.stop(); } catch {}
    },
  };
}

function makeThunderLayer(ctx: AudioContext, dest: AudioNode): Layer {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(dest);

  let scheduler: number | null = null;
  let stopped = false;

  function rumble() {
    if (stopped) return;
    const t = ctx.currentTime;
    // rumble = brown noise burst with a long lowpass-filtered envelope
    const src = ctx.createBufferSource();
    src.buffer = brownNoiseBuffer(ctx, 4);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(120, t);
    lp.frequency.linearRampToValueAtTime(400, t + 0.15);
    lp.frequency.linearRampToValueAtTime(80, t + 3.5);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.exponentialRampToValueAtTime(0.9, t + 0.18);
    env.gain.exponentialRampToValueAtTime(0.001, t + 3.6);
    src.connect(lp).connect(env).connect(gain);
    src.start(t);
    src.stop(t + 3.7);
  }

  function tick() {
    rumble();
    const next = 8000 + Math.random() * 14000;
    scheduler = window.setTimeout(tick, next);
  }

  return {
    name: "thunder",
    gain,
    targetVolume: 0,
    start() {
      stopped = false;
      scheduler = window.setTimeout(tick, 3000 + Math.random() * 4000);
    },
    stop() {
      stopped = true;
      if (scheduler != null) clearTimeout(scheduler);
    },
  };
}

function makeBirdLayer(ctx: AudioContext, dest: AudioNode): Layer {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(dest);

  let scheduler: number | null = null;
  let stopped = false;

  function chirp(when: number, basePitch: number) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(0.6, when + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    // small frequency sweep up then down — that's "tweet"
    osc.frequency.setValueAtTime(basePitch * 0.9, when);
    osc.frequency.exponentialRampToValueAtTime(basePitch * 1.25, when + 0.05);
    osc.frequency.exponentialRampToValueAtTime(basePitch, when + 0.16);
    osc.connect(env).connect(gain);
    osc.start(when);
    osc.stop(when + 0.2);
  }

  function trill() {
    if (stopped || !ctx) return;
    const base = 2200 + Math.random() * 1800;
    const burstCount = 1 + Math.floor(Math.random() * 4);
    const t0 = ctx.currentTime;
    for (let i = 0; i < burstCount; i++) {
      chirp(t0 + i * 0.13, base * (0.92 + Math.random() * 0.18));
    }
    const next = 1200 + Math.random() * 4000;
    scheduler = window.setTimeout(trill, next);
  }

  return {
    name: "birds",
    gain,
    targetVolume: 0,
    start() {
      stopped = false;
      scheduler = window.setTimeout(trill, 800);
    },
    stop() {
      stopped = true;
      if (scheduler != null) clearTimeout(scheduler);
    },
  };
}

function makeCricketLayer(ctx: AudioContext, dest: AudioNode): Layer {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(dest);

  // Continuous chirp pulse train: triangle wave gated by a fast LFO-driven
  // amplitude envelope so it sounds like rhythmic stridulation.
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.value = 4600;

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 4600;
  bp.Q.value = 8;

  // amplitude pulser
  const pulse = ctx.createOscillator();
  pulse.type = "sine";
  pulse.frequency.value = 8; // 8 chirps/sec
  const pulseShape = ctx.createWaveShaper();
  // sharpen sine into pulses with a curve
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    const x = (i / 255) * 2 - 1;
    curve[i] = Math.max(0, Math.pow(Math.max(0, x), 4));
  }
  pulseShape.curve = curve;

  const ampGain = ctx.createGain();
  ampGain.gain.value = 0;
  pulse.connect(pulseShape).connect(ampGain.gain);

  osc.connect(bp).connect(ampGain).connect(gain);

  return {
    name: "crickets",
    gain,
    targetVolume: 0,
    start() {
      osc.start();
      pulse.start();
    },
    stop() {
      try { osc.stop(); pulse.stop(); } catch {}
    },
  };
}

export function layerLabel(name: string): string {
  switch (name) {
    case "rain": return "Rain";
    case "wind": return "Wind";
    case "thunder": return "Thunder";
    case "birds": return "Birdsong";
    case "crickets": return "Crickets";
    default: return name;
  }
}
