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

const toBase64Url = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

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

export const createSessionCookie = async (email: string) => {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${email}|${expiresAt}`;
  const signature = await signPayload(payload);
  return `${payload}|${signature}`;
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
