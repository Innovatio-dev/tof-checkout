import { NextRequest, NextResponse } from "next/server";

import { getCouponByCode } from "@/lib/woocommerce";

interface CouponResponseData {
  id: number;
  code: string;
  amount: string;
  status?: string;
  date_created?: string;
  date_created_gmt?: string;
  date_modified?: string;
  date_modified_gmt?: string;
  discount_type?: string;
  description?: string;
  date_expires?: string | null;
  date_expires_gmt?: string | null;
  usage_count?: number;
  individual_use?: boolean;
  product_ids?: number[];
  excluded_product_ids?: number[];
  usage_limit?: number | null;
  usage_limit_per_user?: number | null;
  limit_usage_to_x_items?: number | null;
  product_categories?: number[];
  excluded_product_categories?: number[];
  exclude_sale_items?: boolean;
  minimum_amount?: string;
  maximum_amount?: string;
  email_restrictions?: string[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const resolvedParams = await params;
  const code = resolvedParams.code?.trim();
  if (!code) {
    return NextResponse.json({ error: "Missing coupon code." }, { status: 400 });
  }

  try {
    const coupon = (await getCouponByCode(code)) as CouponResponseData | null;
    return NextResponse.json(coupon);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load coupon.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
