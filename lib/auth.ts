const SESSION_COOKIE_NAME = "tof_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 2; // 2 days in seconds

const getAuthSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return secret;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toBase64Url = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const encodeText = (value: string) => toBase64Url(encoder.encode(value).buffer);

const fromBase64Url = (value: string) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const decodeText = (value: string) => decoder.decode(fromBase64Url(value));

const importKey = async () => {
  const secret = getAuthSecret();
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
};

const signPayload = async (payload: string) => {
  const key = await importKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toBase64Url(signature);
};

const verifySignature = async (payload: string, signature: string) => {
  const key = await importKey();
  return crypto.subtle.verify("HMAC", key, fromBase64Url(signature), encoder.encode(payload));
};

type OrderAccessPayload = {
  orderIds: number[];
  email: string;
};

export const createSessionCookie = async (email: string) => {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${email}|${expiresAt}`;
  const signature = await signPayload(payload);
  return `${payload}|${signature}`;
};

export const createOrderAccessToken = async ({ orderIds, email }: OrderAccessPayload) => {
  const normalizedEmail = email.trim().toLowerCase();
  const payload = JSON.stringify({ orderIds, email: normalizedEmail });
  const encodedPayload = encodeText(payload);
  const signature = await signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const verifyOrderAccessToken = async (token: string) => {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return { valid: false } as const;
  }

  const isValid = await verifySignature(encodedPayload, signature);
  if (!isValid) {
    return { valid: false } as const;
  }

  try {
    const decoded = decodeText(encodedPayload);
    const data = JSON.parse(decoded) as OrderAccessPayload;
    if (!Array.isArray(data.orderIds) || !data.orderIds.length || !data.email) {
      return { valid: false } as const;
    }
    return { valid: true, orderIds: data.orderIds, email: data.email } as const;
  } catch {
    return { valid: false } as const;
  }
};

export const verifySessionCookie = async (cookieValue: string | undefined | null) => {
  if (!cookieValue) {
    return { valid: false } as const;
  }

  const parts = cookieValue.split("|");
  if (parts.length !== 3) {
    return { valid: false } as const;
  }

  const [email, expiresAt, signature] = parts;
  const payload = `${email}|${expiresAt}`;
  const exp = Number(expiresAt);
  if (!Number.isFinite(exp) || exp < Date.now()) {
    return { valid: false } as const;
  }

  const isValid = await verifySignature(payload, signature);
  if (!isValid) {
    return { valid: false } as const;
  }

  return { valid: true, email } as const;
};

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE };

export const logout = async () => {
  await fetch("/api/auth/logout", { method: "POST" });
  if (typeof window !== "undefined") {
    window.location.reload();
  }
};
