import { NextRequest, NextResponse } from "next/server";

import { verifyEmailOtp } from "@/lib/woocommerce";
import { createSessionCookie, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/auth";

type VerifyOtpRequestBody = {
  email?: string;
  otp?: string | number;
};

export async function POST(request: NextRequest) {
  const { email, otp } = (await request.json().catch(() => ({}))) as VerifyOtpRequestBody;

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const otpString = String(otp ?? "").trim();
  if (!/^\d{6}$/.test(otpString)) {
    return NextResponse.json({ error: "OTP must be 6 digits." }, { status: 400 });
  }

  try {
    const response = await verifyEmailOtp({ email: normalizedEmail, otp: otpString });
    console.log("[api/otp/verify] upstream response:", response);

    if (!response.ok) {
      const body = response.body as { error?: string; message?: string } | string | null | undefined
      const errorMessage =
        typeof body === "string"
          ? body
          : body && typeof body === "object"
            ? (body as { error?: string; message?: string }).error ?? (body as { error?: string; message?: string }).message
            : null

      return NextResponse.json(
        {
          ok: false,
          error: errorMessage ?? "Failed to verify OTP.",
          result: response.body,
        },
        { status: response.status }
      );
    }

    const sessionCookie = await createSessionCookie(normalizedEmail);
    const apiResponse = NextResponse.json({ ok: true, result: response.body });
    apiResponse.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return apiResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify OTP.";
    console.error("[api/otp/verify] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
