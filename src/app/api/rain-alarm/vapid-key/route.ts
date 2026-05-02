import { NextResponse } from "next/server";
import { getPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = getPublicKey();
  if (!key) {
    return NextResponse.json(
      { error: "vapid_unconfigured" },
      { status: 503 }
    );
  }
  return NextResponse.json({ publicKey: key });
}
