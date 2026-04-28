# Cernos — Living Weather

A dynamic weather app whose entire interface morphs to match the current sky.

## Features

- **Dynamic theming** — Background gradient, accent color, glass tint, and animated effects all change based on the current weather (sunny, cloudy, rain, thunderstorm, snow, fog, drizzle, plus night variants).
- **Animated backgrounds** — Falling rain, drifting snow, lightning flashes during storms, twinkling stars at night, glowing sun with rays, and slow-moving clouds.
- **Real forecasts** — Current conditions, 24-hour hourly forecast, and 7-day outlook from the free Open-Meteo API (no key required).
- **Air quality** — European AQI from the Open-Meteo air-quality endpoint.
- **Geolocation + autocomplete search** — Find any city worldwide, or use your current location.
- **Favorites & history** — Persisted in a local SQLite database.
- **AI insights** — Claude generates a short personalized brief (vibe + what to wear + practical tip). Falls back to a heuristic if no API key is set.
- **Glassmorphism UI** with Framer Motion animations.

## Stack

- Next.js 15 (App Router) · React 19 · TypeScript
- Tailwind CSS · Framer Motion · Lucide icons
- SQLite via better-sqlite3
- Anthropic SDK (Claude Haiku 4.5)
- Open-Meteo (weather, geocoding, air quality)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To enable Claude-powered insights, copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`. Without a key, the app uses a smart heuristic instead — everything still works.

## Build

```bash
npm run build
npm start
```
