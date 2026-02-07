import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";
import { getUserByEmail, getUsers, isWooUserAdmin } from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(sessionCookie);

  if (!session.valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const requester = await getUserByEmail(session.email);
  if (!isWooUserAdmin(requester)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

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
