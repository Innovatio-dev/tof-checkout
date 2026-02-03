import { NextRequest, NextResponse } from "next/server";

import { getOrderById } from "@/lib/woocommerce";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as { orderId?: number | string } | null;
  const orderId = Number(payload?.orderId ?? "");
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "Invalid orderId." }, { status: 400 });
  }

  try {
    const order = await getOrderById(orderId);
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
