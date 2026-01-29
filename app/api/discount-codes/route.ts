import { NextResponse } from "next/server";
import { wcRequest } from "@/lib/woocommerce";

export const runtime = "nodejs";

type DiscountRequest = {
  code: string;
};

type WooCoupon = {
  id: number;
  code: string;
  amount: string;
  discount_type: string;
  date_expires?: string | null;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as DiscountRequest | null;

  if (!payload?.code) {
    return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
  }

  const coupons = await wcRequest<WooCoupon[]>("coupons", {
    query: { code: payload.code },
  });

  const coupon = coupons[0];

  if (!coupon) {
    return NextResponse.json({ valid: false, message: "Coupon not found" }, { status: 404 });
  }

  return NextResponse.json({
    valid: true,
    coupon,
  });
}
