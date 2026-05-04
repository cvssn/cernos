<div align="center">

# cernos

### living weather

*a weather app whose entire interface — color, light, sound, and language — becomes the sky it's reporting on.*

</div>

---

most weather apps tell you what the weather is. **cernos lets you stand inside it.**

every gradient, particle, glass tint, audio layer, animation, and even the favicon reacts to the live forecast. drag the time-scrubber and the whole ui morphs hour-by-hour. tap **ambient** and the dashboard dissolves into a fullscreen sky with a procedurally synthesized soundscape — rain that hisses on the wind, crickets at dusk, a lone thrush at dawn — none of it from audio files. swipe, pinch, or rotate on touch devices to navigate hands-free.

## why cernos?

- **it morphs.** nine themes (sunny, cloudy, rain, drizzle, thunderstorm, snow, fog, plus night variants) drive the gradient, accent color, glass tint, particle system, and browser favicon. the ui doesn't sit on top of the weather — it *is* the weather.
- **it listens back.** a web audio synth generates rain, wind, thunder, birdsong, and crickets in real time. themes cross-fade audio mixes the same way they cross-fade colors. zero asset files.
- **it travels in time.** a 7-day horizontal scrubber re-renders the entire app at any past or future hour. theme, particles, soundscape, narrative — all of it follows.
- **it talks — in your language.** claude writes a personalized brief in the user's browser locale automatically. the browser reads it aloud on demand.
- **it watches the sky.** live lightning strikes from blitzortung, kp-index aurora forecasts from noaa, ISS overhead passes from celestrak — overlaid on the radar in real time.
- **it lives on your phone.** installable as a PWA with home-screen icon and 20-minute rain push alerts.
- **it's free.** all weather data comes from open-meteo. no api keys required for any core feature.

## features

### forecast & data

| | |
| --- | --- |
| **current conditions** | temperature, feels-like, humidity, wind, pressure, cloud cover, uv, day/night flag |
| **24-hour hourly forecast** | scrollable strip with code-aware icons; click any hour to scrub to it |
| **7-day daily forecast** | min/max temps, codes, sunrise/sunset, precipitation totals, peak wind, max uv |
| **animated precipitation radar** | rainviewer tiles over a leaflet basemap with a draggable past → future timeline |
| **live lightning overlay** | real-time strikes from blitzortung's public websocket plotted on the radar with pulse animations |
| **air quality** | european aqi, us aqi, pm2.5, pm10, ozone via open-meteo's air-quality endpoint |
| **7-day pollen forecast** | alder, birch, grass, mugwort, olive, ragweed levels with peak-allergen badge and week-ahead chart |
| **weather alerts** | heat, cold, high-wind, uv, storm, heavy rain/snow, and fog advisories — derived from the forecast itself, no separate alert api |
| **historical strip** | yesterday's temperature at the same hour, plus 5-year climatology for the current month |
| **climate lens** | toggle today's temp vs the 1990s ERA5 baseline as a single bold delta |
| **24h pressure tendency** | barometric sparkline with plain-language interpretation for sailors and migraine sufferers |
| **sun arc** | svg ellipse showing the sun's path with the live position marker, plus sunrise/sunset times |
| **tonight's sky panel** | sunset, twilight phases, moonrise/moonset, moon phase, ISS overhead pass times via celestrak TLE + satellite.js |
| **aurora banner** | NOAA SWPC kp-index + viewing plausibility for the current latitude |

### visual layer

| | |
| --- | --- |
| **dynamic theming** | css custom properties drive every color; smooth 1.2s gradient transitions |
| **dynamic favicon** | svg favicon regenerates per theme so the browser tab reflects the sky |
| **weather particles** | falling rain, drifting snow, lightning flashes, twinkling stars, glowing sun with rays, slow-moving clouds |
| **animated wind compass** | svg rose with spring arrow and trailing particles for live wind direction |
| **glassmorphism** | frosted cards with `backdrop-filter`, layered with a subtle noise texture |
| **gsap animations** | scroll/mount stagger reveals, smooth temperature counters, scrolltrigger choreography |
| **framer motion** | spring-eased entrance animations and layout transitions throughout |
| **shareable sky poster** | one-click image export of the current weather card for sharing |
| **JetBrainsMono Nerd Font** | site-wide monospace typeface |

### audio & ambient mode

| | |
| --- | --- |
| **ambient mode** | fullscreen "just the sky" overlay with a giant centered sun/moon, big minimalist temperature, and a soundscape dock at the bottom |
| **procedural soundscape** | web audio synth — white/brown noise generators, biquad filters, lfos, scheduled thunder rumbles, sine-sweep birdsong, gated cricket pulses |
| **live audio mixing** | each theme defines its own mix; switching theme cross-fades layers in/out (e.g. clear-day = birds + light wind, thunderstorm = rain + wind + scheduled rumbles) |
| **volume + mute** | persistent during the session; layer pills show what's currently playing |
| **voice narration** | browser `speechsynthesis` reads the ai brief aloud with locale-aware voice selection |
| **voice ask** | ask claude a free-form weather question by voice; answer is read back aloud |

### intelligence

| | |
| --- | --- |
| **claude haiku 4.5** | generates a 2–3 sentence personalized brief covering the vibe of the day, what to wear, and one practical tip |
| **multilingual narrative** | the brief auto-detects the browser locale and is written in that language |
| **heuristic fallback** | a rule-based narrative kicks in when no api key is set — the app stays fully functional |
| **scrub-aware narrative** | while scrubbing past/future hours, the heuristic engine takes over so the brief tracks what you're looking at |
| **trip brief** | search a destination + date range → packing-list-style weather summary |
| **activity matchmaker** | claude suggests matching activities (run, bike, picnic, etc.) for current conditions |
| **sky journal** | a one-line "what today felt like" entry per visit, persisted by date and scrollable as a year-in-skies archive |

### personalization & PWA

| | |
| --- | --- |
| **geocoding search** | autocomplete city search via open-meteo's geocoding endpoint |
| **use my location** | one-tap geolocation with reverse-geocoded place name |
| **multi-city tiles** | live themed mini-cards for favorite cities, each rendering with its own current conditions |
| **favorites** | star any city; favorites persist across sessions |
| **history** | recently viewed locations, deduplicated, capped at 8 entries |
| **PWA install** | manifest + service worker; installable to home screen on mobile + desktop |
| **rain alarm push** | web-push notification 20 minutes before measurable rain at pinned location, using a VAPID-keyed subscription |

### touch & gestures

| | |
| --- | --- |
| **swipe left/right** | cycle through favorite cities |
| **swipe down** | refresh weather |
| **swipe up** | toggle ambient mode |
| **pinch** | zoom the main container |
| **rotate** | rotate the animated background (for fun) |
| **hammer.js** | gesture recognizer wired through a custom React hook |

## tech stack

| layer | choice |
| --- | --- |
| framework | next.js 15 (app router) |
| ui | react 19 · typescript · tailwind css |
| motion | framer motion + gsap (with scrolltrigger) |
| gestures | hammer.js |
| icons | lucide |
| map | leaflet + rainviewer tiles |
| ai | anthropic sdk · claude haiku 4.5 |
| audio | web audio api (procedural, no asset files) |
| speech | web speech api (`speechsynthesis` + `speechrecognition`) |
| push | web-push (vapid) + service worker |
| astronomy | satellite.js (iss tle propagation) |
| storage | flat json file at `data/cernos.json` |
| typography | jetbrainsmono nerd font |

## data sources

- **[open-meteo](https://open-meteo.com/)** — forecast, air quality, geocoding, pollen, historical climate, ERA5 archive. free, no key.
- **[rainviewer](https://www.rainviewer.com/)** — precipitation radar tiles. free, no key.
- **[blitzortung](https://www.blitzortung.org/)** — public websocket of live lightning strikes. free, no key.
- **[noaa swpc](https://www.swpc.noaa.gov/)** — planetary k-index (geomagnetic / aurora forecast). free, no key.
- **[celestrak](https://celestrak.org/)** — iss tle elements, propagated locally with satellite.js. free, no key.
- **[anthropic api](https://console.anthropic.com/)** — claude haiku 4.5 for the ai brief, trip brief, voice ask, and activity matchmaker. optional; the app falls back to heuristics without a key.

## getting started

```bash
npm install
npm run dev
```

then open <http://localhost:3000>.

that's it — no key, no signup. all weather, radar, geocoding, pollen, lightning, kp-index, and ISS data flow from public free sources.

default location is são paulo. search any city or tap **use my location**.

### optional: enable claude

to get the ai-written daily brief instead of the heuristic fallback:

```bash
cp .env.example .env.local
# then set anthropic_api_key in .env.local
```

get a key at <https://console.anthropic.com/>. without one, every other feature still works — the heuristic narrative is good enough that most users won't notice.

### optional: enable rain alarm push

to enable push notifications for the rain alarm, generate a vapid key pair and add to `.env.local`:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public>
VAPID_PRIVATE_KEY=<private>
VAPID_SUBJECT=mailto:you@example.com
```

generate a pair with `npx web-push generate-vapid-keys`.

## build & run

powershell (windows):
```powershell
npm run build; if ($?) { npm start }
```

bash:
```bash
npm run build && npm start
```

## project layout

```
src/
  app/
    api/
      weather/                parallel open-meteo calls, alert derivation, historical context, pollen aggregation
      ai-insights/             claude brief generation (locale-aware)
      geocode/                 open-meteo geocoding proxy
      favorites/               crud over the json store
      history/                 recent locations
      iss-pass/                celestrak tle → satellite.js pass times
      space-weather/           noaa kp-index + aurora plausibility
      pressure-history/        24h barometric history
      climate-lens/            today vs 1990s era5 delta
      sky-journal/             daily "what it felt like" entry store
      trip-brief/              packing-list weather summary for a trip
      activity-suggestions/    claude activity matchmaker
      voice-ask/               free-form weather q&a
      poster/                  shareable sky poster (image generation)
      rain-alarm/
        vapid-key/             public vapid key endpoint
        subscribe/             web-push subscription store
        check/                 cron-friendly endpoint that fires push if rain ≤20min
    ambient/[city]/            dedicated ambient-mode route per city
    page.tsx                   mounts <weatherapp />
    layout.tsx                 root html, fonts, manifest
  components/
    weatherapp.tsx             top-level state, layout, theming, gestures
    ambientmode.tsx            fullscreen sky + soundscape overlay
    animatedbackground.tsx
    currentweather.tsx, hourlyforecast.tsx, dailyforecast.tsx
    precipitationradar.tsx, timescrubber.tsx
    weatheralerts.tsx, pollenpanel.tsx, sunarc.tsx
    aiinsights.tsx             claude narrative + voice
    multicitytiles.tsx         live themed favorite-city tiles
    pressuretendency.tsx, climatelens.tsx
    tonightsskypanel.tsx, aurorabanner.tsx
    skyjournal.tsx, tripbrief.tsx
    voiceask.tsx, activitymatchmaker.tsx
    rainalarm.tsx              push subscription button
    pwaregister.tsx            service worker registration
    shareposter.tsx            sky poster export
    windcompass.tsx            animated wind direction rose
    searchbar.tsx, favorites.tsx, weathericon.tsx, weatherdetails.tsx
  lib/
    soundscape.ts              procedural web audio synth (rain/wind/thunder/birds/crickets)
    weather-codes.ts           wmo code → label, icon, theme mapping
    weather-themes.ts          theme palettes (gradient, accent, glass, etc.)
    insights.ts                heuristic narrative engine
    lightning.ts               blitzortung websocket client
    pressure.ts                barometric tendency math
    ephemeris.ts               sun/moon position math
    locale.ts                  browser locale detection
    favicon.ts                 svg favicon generator per theme
    useDynamicFavicon.ts       favicon hook
    useHammer.ts               touch-gesture hook (swipe/pinch/rotate)
    useGsap.ts                 gsap reveal/entrance/number-tween hooks
    push.ts                    VAPID push helper
    db.ts                      json-file store for favorites + history
    types.ts                   shared typescript types
public/
  sw.js                        service worker (pwa + push)
  manifest.webmanifest         pwa manifest
data/
  cernos.json                  created on first favorite/visit
```

## acknowledgements

open-meteo, rainviewer, blitzortung, noaa swpc, and celestrak for offering high-quality public data for free. anthropic for claude. every contributor to next.js, react, tailwind, framer motion, gsap, hammer.js, leaflet, satellite.js, web-push, and lucide.

---

<div align="center">

*built with next.js, framer motion, gsap, and claude.*

</div>
