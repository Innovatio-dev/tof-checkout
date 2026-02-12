import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifyOrderAccessToken, verifySessionCookie } from "@/lib/auth";
import { getOrderById } from "@/lib/woocommerce";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as
    | { orderId?: number | string; orderAccessToken?: string }
    | null;
  const orderId = Number(payload?.orderId ?? "");
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "Invalid orderId." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(sessionCookie);
  const token = payload?.orderAccessToken?.trim();
  const tokenResult = token ? await verifyOrderAccessToken(token) : null;

  if (!session.valid && !tokenResult?.valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const order = await getOrderById(orderId);
    const orderEmail = order.billing?.email?.trim().toLowerCase();
    const sessionEmail = session.valid ? session.email.trim().toLowerCase() : null;
    const tokenEmail = tokenResult?.valid ? tokenResult.email.trim().toLowerCase() : null;
    const tokenHasOrder = tokenResult?.valid ? tokenResult.orderIds.includes(orderId) : false;

    if (sessionEmail) {
      if (!orderEmail || orderEmail !== sessionEmail) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    } else {
      if (!orderEmail || !tokenEmail || orderEmail !== tokenEmail || !tokenHasOrder) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    }
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
