import { NextRequest, NextResponse } from "next/server";

import { getAllCoupons } from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const perPage = Number(searchParams.get("perPage") ?? "100");
  const maxPages = Number(searchParams.get("maxPages") ?? "200");
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  const sanitizedPerPage = Number.isFinite(perPage) ? Math.max(1, perPage) : 100;
  const sanitizedMaxPages = Number.isFinite(maxPages) ? Math.max(1, maxPages) : 200;

  try {
    const coupons = await getAllCoupons({
      perPage: sanitizedPerPage,
      maxPages: sanitizedMaxPages,
      status,
      search,
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load coupons.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
