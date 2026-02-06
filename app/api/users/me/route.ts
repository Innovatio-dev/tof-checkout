import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";
import { getUserByEmail } from "@/lib/woocommerce";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(sessionCookie);

  if (!session.valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const user = await getUserByEmail(session.email);
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
