<div align="center">

# cernos

### living weather

*a weather app whose entire interface — color, light, sound — becomes the sky it's reporting on.*

</div>

---

most weather apps tell you what the weather is. **cernos lets you stand inside it.**

every gradient, particle, glass tint, audio layer, and animation reacts to the live forecast. drag the time-scrubber and the whole ui morphs hour-by-hour. tap **ambient** and the dashboard dissolves into a fullscreen sky with a procedurally synthesized soundscape — rain that hisses on the wind, crickets at dusk, a lone thrush at dawn — none of it from audio files.

## why cernos?

- **it morphs.** nine themes (sunny, cloudy, rain, drizzle, thunderstorm, snow, fog, plus night variants) drive the gradient, accent color, glass tint, and particle system. the ui doesn't sit on top of the weather — it *is* the weather.
- **it listens back.** a web audio synth generates rain, wind, thunder, birdsong, and crickets in real time. themes cross-fade audio mixes the same way they cross-fade colors. zero asset files.
- **it travels in time.** a 7-day horizontal scrubber re-renders the entire app at any past or future hour. theme, particles, soundscape, narrative — all of it follows.
- **it talks.** claude writes a personalized brief (vibe + what to wear + a practical tip). the browser reads it aloud on demand.
- **it's free.** all weather data comes from open-meteo. no api keys required for any core feature.

## features

### forecast & data

| | |
| --- | --- |
| **current conditions** | temperature, feels-like, humidity, wind, pressure, cloud cover, uv, day/night flag |
| **24-hour hourly forecast** | scrollable strip with code-aware icons; click any hour to scrub to it |
| **7-day daily forecast** | min/max temps, codes, sunrise/sunset, precipitation totals, peak wind, max uv |
| **animated precipitation radar** | rainviewer tiles over a leaflet basemap, with a draggable past → future timeline |
| **air quality** | european aqi, us aqi, pm2.5, pm10, ozone via open-meteo's air-quality endpoint |
| **pollen** | alder, birch, grass, mugwort, olive, ragweed levels with peak-allergen badge |
| **weather alerts** | heat, cold, high-wind, uv, storm, heavy rain/snow, and fog advisories — derived from the forecast itself, no separate alert api |
| **historical strip** | yesterday's temperature at the same hour, plus 5-year climatology for the current month |
| **sun arc** | svg ellipse showing the sun's path with the live position marker, plus sunrise/sunset times |

### visual layer

| | |
| --- | --- |
| **dynamic theming** | css custom properties drive every color; smooth 1.2s gradient transitions |
| **weather particles** | Falling rain, drifting snow, lightning flashes, twinkling stars, glowing sun with rays, slow-moving clouds |
| **glassmorphism** | frosted cards with `backdrop-filter`, layered with a subtle noise texture |
| **framer motion** | spring-eased entrance animations and layout transitions throughout |

### audio & ambient mode

| | |
| --- | --- |
| **ambient mode** | fullscreen "just the sky" overlay with a giant centered sun/moon, big minimalist temperature, and a soundscape dock at the bottom |
| **procedural soundscape** | web audio synth — white/brown noise generators, biquad filters, lfos, scheduled thunder rumbles, sine-sweep birdsong, gated cricket pulses |
| **live audio mixing** | each theme defines its own mix; switching theme cross-fades layers in/out (e.g. clear-day = birds + light wind, thunderstorm = rain + wind + scheduled rumbles) |
| **volume + mute** | persistent during the session; layer pills show what's currently playing |
| **voice narration** | browser `speechsynthesis` reads the ai brief aloud with a play/pause toggle |

### intelligence

| | |
| --- | --- |
| **claude haiku 4.5** | generates a 2–3 sentence personalized brief covering the vibe of the day, what to wear, and one practical tip |
| **heuristic fallback** | a rule-based narrative kicks in when no api key is set — the app stays fully functional |
| **scrub-aware narrative** | while scrubbing past/future hours, the heuristic engine takes over so the brief tracks what you're looking at |

### personalization

| | |
| --- | --- |
| **geocoding search** | autocomplete city search via open-meteo's geocoding endpoint |
| **use my location** | one-tap geolocation with reverse-geocoded place name |
| **favorites** | star any city; favorites persist across sessions |
| **history** | recently viewed locations, deduplicated, capped at 8 entries |

## tech stack

| layer | choice |
| --- | --- |
| framework | next.js 15 (app router) |
| ui | react 19 · typescript · tailwind css |
| motion | framer motion |
| icons | lucide |
| map | leaflet + rainviewer tiles |
| ai | anthropic sdk · claude haiku 4.5 |
| audio | web audio api (procedural, no asset files) |
| speech | web speech api (`speechsynthesis`) |
| storage | flat json file at `data/cernos.json` |

## data sources

- **[open-meteo](https://open-meteo.com/)** — forecast, air quality, geocoding, pollen, historical climate. free, no key.
- **[rainviewer](https://www.rainviewer.com/)** — precipitation radar tiles. free, no key.
- **[anthropic api](https://console.anthropic.com/)** — claude haiku 4.5 for the ai brief. optional; the app falls back to a heuristic without a key.

## getting started

```bash
npm install
npm run dev
```

then open <http://localhost:3000>.

that's it — no key, no signup. all weather, radar, geocoding, and pollen data flows from open-meteo and rainviewer for free.

### optional: enable claude

to get the ai-written daily brief instead of the heuristic fallback:

```bash
cp .env.example .env.local
# then set anthropic_api_key in .env.local
```

get a key at <https://console.anthropic.com/>. without one, every other feature still works — the heuristic narrative is good enough that most users won't notice.

## build & run

```bash
npm run build
npm start
```

## project layout

```
src/
  app/
    api/
      weather/        parallel open-meteo calls, alert derivation, historical context
      ai-insights/    claude brief generation
      geocode/        open-meteo geocoding proxy
      favorites/      crud over the json store
      history/        recent locations
    page.tsx          mounts <weatherapp />
  components/
    weatherapp.tsx       top-level state, layout, theming
    ambientmode.tsx      fullscreen sky + soundscape overlay
    animatedbackground.tsx
    currentweather.tsx, hourlyforecast.tsx, dailyforecast.tsx
    precipitationRadar.tsx, timeScrubber.tsx
    weatheralerts.tsx, pollenpanel.tsx, sunarc.tsx
    aiinsights.tsx       claude narrative + voice
    searchbar.tsx, favorites.tsx, weathericon.tsx, weatherdetails.tsx
  lib/
    soundscape.ts        procedural web audio synth (rain/wind/thunder/birds/crickets)
    weather-codes.ts     wmo code → label, icon, theme mapping
    weather-themes.ts    theme palettes (gradient, accent, glass, etc.)
    insights.ts          heuristic narrative engine
    types.ts             shared typescript types
    db.ts                json-file store for favorites + history
data/
  cernos.json            created on first favorite/visit
```

## acknowledgements

open-meteo and rainviewer for offering high-quality weather data to the public for free. anthropic for claude. every contributor to next.js, react, tailwind, framer motion, leaflet, and lucide.

---

<div align="center">

*built with next.js, framer motion, and claude.*

</div>
