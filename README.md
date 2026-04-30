<div align="center">

# Cernos

### Living Weather

*A weather app whose entire interface — color, light, sound — becomes the sky it's reporting on.*

</div>

---

Most weather apps tell you what the weather is. **Cernos lets you stand inside it.**

Every gradient, particle, glass tint, audio layer, and animation reacts to the live forecast. Drag the time-scrubber and the whole UI morphs hour-by-hour. Tap **Ambient** and the dashboard dissolves into a fullscreen sky with a procedurally synthesized soundscape — rain that hisses on the wind, crickets at dusk, a lone thrush at dawn — none of it from audio files.

## Why Cernos?

- **It morphs.** Nine themes (sunny, cloudy, rain, drizzle, thunderstorm, snow, fog, plus night variants) drive the gradient, accent color, glass tint, and particle system. The UI doesn't sit on top of the weather — it *is* the weather.
- **It listens back.** A Web Audio synth generates rain, wind, thunder, birdsong, and crickets in real time. Themes cross-fade audio mixes the same way they cross-fade colors. Zero asset files.
- **It travels in time.** A 7-day horizontal scrubber re-renders the entire app at any past or future hour. Theme, particles, soundscape, narrative — all of it follows.
- **It talks.** Claude writes a personalized brief (vibe + what to wear + a practical tip). The browser reads it aloud on demand.
- **It's free.** All weather data comes from Open-Meteo. No API keys required for any core feature.

## Features

### Forecast & data

| | |
| --- | --- |
| **Current conditions** | Temperature, feels-like, humidity, wind, pressure, cloud cover, UV, day/night flag |
| **24-hour hourly forecast** | Scrollable strip with code-aware icons; click any hour to scrub to it |
| **7-day daily forecast** | Min/max temps, codes, sunrise/sunset, precipitation totals, peak wind, max UV |
| **Animated precipitation radar** | RainViewer tiles over a Leaflet basemap, with a draggable past→future timeline |
| **Air quality** | European AQI, US AQI, PM2.5, PM10, ozone via Open-Meteo's air-quality endpoint |
| **Pollen** | Alder, birch, grass, mugwort, olive, ragweed levels with peak-allergen badge |
| **Weather alerts** | Heat, cold, high-wind, UV, storm, heavy rain/snow, and fog advisories — derived from the forecast itself, no separate alert API |
| **Historical strip** | Yesterday's temperature at the same hour, plus 5-year climatology for the current month |
| **Sun arc** | SVG ellipse showing the sun's path with the live position marker, plus sunrise/sunset times |

### Visual layer

| | |
| --- | --- |
| **Dynamic theming** | CSS custom properties drive every color; smooth 1.2s gradient transitions |
| **Weather particles** | Falling rain, drifting snow, lightning flashes, twinkling stars, glowing sun with rays, slow-moving clouds |
| **Glassmorphism** | Frosted cards with `backdrop-filter`, layered with a subtle noise texture |
| **Framer Motion** | Spring-eased entrance animations and layout transitions throughout |

### Audio & Ambient Mode

| | |
| --- | --- |
| **Ambient Mode** | Fullscreen "just the sky" overlay with a giant centered sun/moon, big minimalist temperature, and a soundscape dock at the bottom |
| **Procedural soundscape** | Web Audio synth — white/brown noise generators, biquad filters, LFOs, scheduled thunder rumbles, sine-sweep birdsong, gated cricket pulses |
| **Live audio mixing** | Each theme defines its own mix; switching theme cross-fades layers in/out (e.g. clear-day = birds + light wind, thunderstorm = rain + wind + scheduled rumbles) |
| **Volume + mute** | Persistent during the session; layer pills show what's currently playing |
| **Voice narration** | Browser `speechSynthesis` reads the AI brief aloud with a play/pause toggle |

### Intelligence

| | |
| --- | --- |
| **Claude Haiku 4.5** | Generates a 2–3 sentence personalized brief covering the vibe of the day, what to wear, and one practical tip |
| **Heuristic fallback** | A rule-based narrative kicks in when no API key is set — the app stays fully functional |
| **Scrub-aware narrative** | While scrubbing past/future hours, the heuristic engine takes over so the brief tracks what you're looking at |

### Personalization

| | |
| --- | --- |
| **Geocoding search** | Autocomplete city search via Open-Meteo's geocoding endpoint |
| **Use my location** | One-tap geolocation with reverse-geocoded place name |
| **Favorites** | Star any city; favorites persist across sessions |
| **History** | Recently viewed locations, deduplicated, capped at 8 entries |

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| UI | React 19 · TypeScript · Tailwind CSS |
| Motion | Framer Motion |
| Icons | Lucide |
| Map | Leaflet + RainViewer tiles |
| AI | Anthropic SDK · Claude Haiku 4.5 |
| Audio | Web Audio API (procedural, no asset files) |
| Speech | Web Speech API (`speechSynthesis`) |
| Storage | Flat JSON file at `data/cernos.json` |

## Data sources

- **[Open-Meteo](https://open-meteo.com/)** — forecast, air quality, geocoding, pollen, historical climate. Free, no key.
- **[RainViewer](https://www.rainviewer.com/)** — precipitation radar tiles. Free, no key.
- **[Anthropic API](https://console.anthropic.com/)** — Claude Haiku 4.5 for the AI brief. Optional; the app falls back to a heuristic without a key.

## Getting started

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

That's it — no key, no signup. All weather, radar, geocoding, and pollen data flows from Open-Meteo and RainViewer for free.

### Optional: enable Claude

To get the AI-written daily brief instead of the heuristic fallback:

```bash
cp .env.example .env.local
# then set ANTHROPIC_API_KEY in .env.local
```

Get a key at <https://console.anthropic.com/>. Without one, every other feature still works — the heuristic narrative is good enough that most users won't notice.

## Build & run

```bash
npm run build
npm start
```

## Project layout

```
src/
  app/
    api/
      weather/        parallel Open-Meteo calls, alert derivation, historical context
      ai-insights/    Claude brief generation
      geocode/        Open-Meteo geocoding proxy
      favorites/      CRUD over the JSON store
      history/        recent locations
    page.tsx          mounts <WeatherApp />
  components/
    WeatherApp.tsx       top-level state, layout, theming
    AmbientMode.tsx      fullscreen sky + soundscape overlay
    AnimatedBackground.tsx
    CurrentWeather.tsx, HourlyForecast.tsx, DailyForecast.tsx
    PrecipitationRadar.tsx, TimeScrubber.tsx
    WeatherAlerts.tsx, PollenPanel.tsx, SunArc.tsx
    AIInsights.tsx       Claude narrative + voice
    SearchBar.tsx, Favorites.tsx, WeatherIcon.tsx, WeatherDetails.tsx
  lib/
    soundscape.ts        procedural Web Audio synth (rain/wind/thunder/birds/crickets)
    weather-codes.ts     WMO code → label, icon, theme mapping
    weather-themes.ts    theme palettes (gradient, accent, glass, etc.)
    insights.ts          heuristic narrative engine
    types.ts             shared TypeScript types
    db.ts                JSON-file store for favorites + history
data/
  cernos.json            created on first favorite/visit
```

## Acknowledgements

Open-Meteo and RainViewer for offering high-quality weather data to the public for free. Anthropic for Claude. Every contributor to Next.js, React, Tailwind, Framer Motion, Leaflet, and Lucide.

---

<div align="center">

*Built with Next.js, Framer Motion, and Claude.*

</div>
