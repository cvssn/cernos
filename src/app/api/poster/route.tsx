import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { describeWeather, themeForCondition } from "@/lib/weather-codes";
import { THEMES } from "@/lib/weather-themes";

export const runtime = "edge";

const W = 1080;
const H = 1350;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const lat = parseFloat(sp.get("lat") || "");
  const lon = parseFloat(sp.get("lon") || "");
  const name = (sp.get("name") || "").slice(0, 60) || "unknown";
  const country = (sp.get("country") || "").slice(0, 60);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return new Response("missing_coords", { status: 400 });
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,wind_speed_10m` +
    `&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto&forecast_days=1`;

  let data: any;
  try {
    const r = await fetch(url, { next: { revalidate: 600 } });
    if (!r.ok) throw new Error("upstream");
    data = await r.json();
  } catch {
    return new Response("weather_failed", { status: 502 });
  }

  const temp = Math.round(data.current.temperature_2m);
  const feels = Math.round(data.current.apparent_temperature);
  const tmax = Math.round(data.daily.temperature_2m_max[0]);
  const tmin = Math.round(data.daily.temperature_2m_min[0]);
  const code = data.current.weather_code as number;
  const isDay = data.current.is_day === 1;
  const sunriseStr = data.daily.sunrise[0] as string;
  const sunsetStr = data.daily.sunset[0] as string;
  const condition = describeWeather(code);
  const theme = themeForCondition(code, isDay);
  const palette = THEMES[theme];

  const now = new Date();
  const sr = new Date(sunriseStr);
  const ss = new Date(sunsetStr);
  const span = ss.getTime() - sr.getTime();
  const tFrac =
    span > 0
      ? Math.max(0, Math.min(1, (now.getTime() - sr.getTime()) / span))
      : 0.5;

  const arcLeft = 100;
  const arcRight = 980;
  const arcBase = 200;
  const arcPeak = -40;
  const arcMidX = (arcLeft + arcRight) / 2;
  const sunX =
    (1 - tFrac) ** 2 * arcLeft +
    2 * (1 - tFrac) * tFrac * arcMidX +
    tFrac ** 2 * arcRight;
  const sunY =
    (1 - tFrac) ** 2 * arcBase +
    2 * (1 - tFrac) * tFrac * arcPeak +
    tFrac ** 2 * arcBase;

  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };
  const dateLabel = now
    .toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    .toLowerCase();

  const cityLine = (name + (country ? `, ${country}` : "")).toLowerCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          flexDirection: "column",
          background: palette.gradient,
          padding: 64,
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              opacity: 0.7,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            cernos · today's sky
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 600,
              marginTop: 12,
              letterSpacing: -1,
            }}
          >
            {cityLine}
          </div>
          <div style={{ fontSize: 26, opacity: 0.7, marginTop: 4 }}>
            {dateLabel}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 360,
              fontWeight: 200,
              lineHeight: 1,
              letterSpacing: -12,
            }}
          >
            {temp}°
          </div>
          <div
            style={{
              fontSize: 44,
              opacity: 0.9,
              marginTop: 16,
            }}
          >
            {condition.label.toLowerCase()}
          </div>
          <div
            style={{
              display: "flex",
              gap: 28,
              fontSize: 24,
              opacity: 0.7,
              marginTop: 18,
            }}
          >
            <span>feels {feels}°</span>
            <span>·</span>
            <span>
              high {tmax}° / low {tmin}°
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <svg
            width="952"
            height="240"
            viewBox="0 0 1080 240"
            style={{ overflow: "visible" }}
          >
            <path
              d={`M ${arcLeft} ${arcBase} Q ${arcMidX} ${arcPeak} ${arcRight} ${arcBase}`}
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
              strokeDasharray="6 8"
            />
            <circle
              cx={arcLeft}
              cy={arcBase}
              r="6"
              fill="rgba(255,255,255,0.6)"
            />
            <circle
              cx={arcRight}
              cy={arcBase}
              r="6"
              fill="rgba(255,255,255,0.6)"
            />
            <circle
              cx={sunX}
              cy={sunY}
              r="48"
              fill={isDay ? "#fde68a" : "#e0e7ff"}
              opacity="0.25"
            />
            <circle
              cx={sunX}
              cy={sunY}
              r="22"
              fill={isDay ? "#fde68a" : "#e0e7ff"}
            />
          </svg>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: 880,
              marginTop: 4,
              fontSize: 22,
              opacity: 0.75,
            }}
          >
            <span>rise {fmtTime(sunriseStr)}</span>
            <span>set {fmtTime(sunsetStr)}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: 24,
            fontSize: 22,
            opacity: 0.8,
          }}
        >
          <span>a moment of sky</span>
          <span style={{ fontWeight: 600 }}>cernos.app</span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    }
  );
}
