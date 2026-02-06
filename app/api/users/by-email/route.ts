import { NextRequest, NextResponse } from "next/server";

import { getUserByEmail } from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
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
