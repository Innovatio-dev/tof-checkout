import { NextResponse } from "next/server";
import { wcRequest } from "@/lib/woocommerce";

export const runtime = "nodejs";

type PricingRequest = {
  productId: number;
  quantity?: number;
};

type WooProduct = {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
};

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as PricingRequest | null;

  if (!payload?.productId) {
    return NextResponse.json({ error: "productId is required" }, { status: 400 });
  }

  const product = await wcRequest<WooProduct>(`products/${payload.productId}`);

  const quantity = payload.quantity ?? 1;
  const unitPrice = Number(product.sale_price || product.price || 0);

  return NextResponse.json({
    ok: true,
    product,
    quantity,
    total: unitPrice * quantity,
  });
}
