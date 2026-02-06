import { NextRequest, NextResponse } from "next/server";

import { getUsers } from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const perPage = Number(searchParams.get("perPage") ?? "10");
  const page = Number(searchParams.get("page") ?? "1");

  const sanitizedPerPage = Number.isFinite(perPage) ? Math.max(1, perPage) : 10;
  const sanitizedPage = Number.isFinite(page) ? Math.max(1, page) : 1;

  try {
    const users = await getUsers({
      per_page: sanitizedPerPage,
      page: sanitizedPage,
    });

    return NextResponse.json({ users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load users.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
