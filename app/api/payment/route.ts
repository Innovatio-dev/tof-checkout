import { NextResponse } from "next/server";
import { wcRequest } from "@/lib/woocommerce";

export const runtime = "nodejs";

type PaymentRequest = {
  productId: number;
  quantity: number;
  customer: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  billing?: Record<string, string>;
  couponCode?: string;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as PaymentRequest | null;

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const order = await wcRequest("orders", {
    method: "POST",
    body: JSON.stringify({
      payment_method: "pending",
      payment_method_title: "Pending",
      set_paid: false,
      customer_note: "Created via TOF checkout API template.",
      billing: {
        email: payload.customer.email,
        first_name: payload.customer.firstName,
        last_name: payload.customer.lastName,
        ...payload.billing,
      },
      line_items: [
        {
          product_id: payload.productId,
          quantity: payload.quantity,
        },
      ],
      coupon_lines: payload.couponCode
        ? [{ code: payload.couponCode }]
        : [],
    }),
  });

  return NextResponse.json({
    ok: true,
    order,
    message: "Order created. Attach payment provider flow next.",
  });
}
