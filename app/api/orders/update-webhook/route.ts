import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  let payload: unknown = rawBody;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    // Non-JSON payloads fall back to raw text.
  }

  console.log("[WEBHOOK::Orders] Incoming payload", payload);

  return NextResponse.json({ received: true });
}
