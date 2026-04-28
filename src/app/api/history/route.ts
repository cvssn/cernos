import { NextResponse } from "next/server";
import { listHistory } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ history: listHistory(8) });
}
