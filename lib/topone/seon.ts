import "server-only";

type SeonFraudResult = {
  allowed: boolean;
  reason?: string;
  score?: number;
  state?: string;
  skipped?: boolean;
};

type SeonFraudPayload = {
  email: string;
  ip: string | null;
  session?: string | null;
  amount: number;
  currency: string;
  isLoggedIn?: boolean;
};

const DEFAULT_SEON_API_URL = "https://api.us-east-1-main.seon.io/SeonRestService/fraud-api/v2";

const getSeonConfig = () => {
  const enabled = process.env.SEON_ENABLED === "true";
  const apiKey = process.env.SEON_API_KEY;
  const apiUrl = process.env.SEON_API_URL || DEFAULT_SEON_API_URL;
  return { enabled, apiKey, apiUrl };
};

export const validateSeonFraud = async (payload: SeonFraudPayload): Promise<SeonFraudResult> => {
  const { enabled, apiKey, apiUrl } = getSeonConfig();
  if (!enabled) {
    return { allowed: true, skipped: true };
  }
  if (!apiKey) {
    console.warn("[SEON] SEON_API_KEY is not set");
    return { allowed: true, skipped: true };
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      ip: payload.ip,
      email: payload.email,
      session: payload.session ?? undefined,
      transaction_type: "purchase",
      transaction_amount: payload.amount,
      transaction_currency: payload.currency,
      action_type: payload.isLoggedIn ? "purchase" : "account_register",
      config: {
        ip_api: true,
        email_api: true,
        phone_api: !payload.isLoggedIn,
        device_fingerprinting: true,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.warn("[SEON] API error", { status: response.status, body });
    return { allowed: true, skipped: true };
  }

  const body = (await response.json().catch(() => null)) as { data?: { fraud_score?: number; state?: string } } | null;
  const data = body?.data ?? {};
  const score = Number(data.fraud_score ?? 0);
  const state = data.state ?? "UNKNOWN";

  if (state === "DECLINE" || score >= 80) {
    return {
      allowed: false,
      score,
      state,
      reason: "We couldn’t process your order. Please contact support.",
    };
  }

  return { allowed: true, score, state };
};
