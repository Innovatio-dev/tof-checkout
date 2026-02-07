import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";
import { getSubscriptionsByEmail } from "@/lib/woocommerce";

export async function GET() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(sessionCookie);

  if (!session.valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const subscriptions = await getSubscriptionsByEmail({ email: session.email });
    return NextResponse.json({ subscriptions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load subscriptions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
