import { NextRequest, NextResponse } from "next/server";

import { requestEmailOtp } from "@/lib/woocommerce";

type OtpRequestBody = {
  email?: string;
};

export async function POST(request: NextRequest) {
  const { email } = (await request.json().catch(() => ({}))) as OtpRequestBody;

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  try {
    const result = await requestEmailOtp(normalizedEmail);
    console.log("[api/otp] upstream response:", result);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request OTP.";
    console.error("[api/otp] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
