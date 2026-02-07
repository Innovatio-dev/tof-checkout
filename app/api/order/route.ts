import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";
import { getOrderById } from "@/lib/woocommerce";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(sessionCookie);

  if (!session.valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { orderId?: number | string } | null;
  const orderId = Number(payload?.orderId ?? "");
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "Invalid orderId." }, { status: 400 });
  }

  try {
    const order = await getOrderById(orderId);
    const orderEmail = order.billing?.email?.trim().toLowerCase();
    if (!orderEmail || orderEmail !== session.email.trim().toLowerCase()) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
