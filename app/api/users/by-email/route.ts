import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";
import { getUserByEmail, isWooUserAdmin } from "@/lib/woocommerce";

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
  const email = searchParams.get("email")?.trim();

  if (!email) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }

  try {
    const user = await getUserByEmail(email);
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
