import { NextRequest, NextResponse } from "next/server";
import { addFavorite, listFavorites, removeFavorite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ favorites: listFavorites() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, country, admin1, latitude, longitude } = body ?? {};
  if (!name || typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const favorites = addFavorite({ name, country: country ?? "", admin1, latitude, longitude });
  return NextResponse.json({ favorites });
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const favorites = removeFavorite(id);
  return NextResponse.json({ favorites });
}
