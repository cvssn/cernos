import { NextRequest, NextResponse } from "next/server";
import {
  upsertRainAlarm,
  removeRainAlarm,
  findRainAlarm,
} from "@/lib/db";

export const dynamic = "force-dynamic";

type SubBody = {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  place?: {
    name?: string;
    country?: string;
    admin1?: string | null;
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as SubBody;
  const sub = body.subscription;
  const place = body.place;
  if (
    !sub?.endpoint ||
    !sub.keys?.p256dh ||
    !sub.keys.auth ||
    !place?.name ||
    typeof place.latitude !== "number" ||
    typeof place.longitude !== "number"
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const saved = upsertRainAlarm({
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    place: {
      name: place.name,
      country: place.country ?? "",
      admin1: place.admin1 ?? null,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone,
    },
  });
  return NextResponse.json({ ok: true, alarm: saved });
}

export async function DELETE(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ error: "missing_endpoint" }, { status: 400 });
  }
  removeRainAlarm(endpoint);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get("endpoint");
  if (!endpoint) {
    return NextResponse.json({ alarm: null });
  }
  return NextResponse.json({ alarm: findRainAlarm(endpoint) ?? null });
}
