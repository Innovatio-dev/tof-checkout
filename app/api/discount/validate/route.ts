import { NextRequest, NextResponse } from "next/server";

import { validateCoupon } from "@/lib/discounts";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as {
    code?: string;
    email?: string;
    productId?: number;
    total?: number;
  } | null;

  if (!payload?.code || !payload?.email || !payload?.productId || payload.total === undefined) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const productId = Number(payload.productId);
  const total = Number(payload.total);
  if (!Number.isFinite(productId) || !Number.isFinite(total)) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  try {
    const result = await validateCoupon({
      code: payload.code,
      email: payload.email,
      productId,
      total,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to validate coupon.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
