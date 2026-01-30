
import "server-only";

export type NewsletterSubscriberPayload = {
  email: string;
  first_name?: string;
  last_name?: string;
  country?: string;
  region?: string;
  city?: string;
  list_N?: number;
  status?: "confirmed" | "pending" | "unsubscribed";
  lists?: {
    id: number;
    value?: number;
  }[];
};

const siteUrl = process.env.WP_SITE_URL?.replace(/\/$/, "");
const newsletterClientId = process.env.NEWSLETTER_CLIENT_ID;
const newsletterClientSecret = process.env.NEWSLETTER_CLIENT_SECRET;

const getNewsletterBaseUrl = () => {
  if (!siteUrl) {
    throw new Error("WP_SITE_URL is not set");
  }

  return `${siteUrl}/wp-json/newsletter/v2`;
};

const getNewsletterApiUrl = () => {
  return `${getNewsletterBaseUrl()}/subscribers`;
};

const getNewsletterAuthHeader = () => {
  if (!newsletterClientId || !newsletterClientSecret) {
    throw new Error("Newsletter environment variables are not configured");
  }

  const credentials = Buffer.from(`${newsletterClientId}:${newsletterClientSecret}`).toString("base64");
  return `Basic ${credentials}`;
};

export const isNewsletterConfigured = () => {
  return Boolean(siteUrl && newsletterClientId && newsletterClientSecret);
};

export const createNewsletterSubscriber = async (payload: NewsletterSubscriberPayload) => {
  const response = await fetch(getNewsletterApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getNewsletterAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Newsletter API error: ${response.status} ${errorBody}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
};

export const getNewsletterLists = async () => {
  const response = await fetch(`${getNewsletterBaseUrl()}/lists`, {
    method: "GET",
    headers: {
      Authorization: getNewsletterAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Newsletter API error: ${response.status} ${errorBody}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
};

export const getNewsletterSubscribers = async (params?: { per_page?: number; page?: number }) => {
  const searchParams = new URLSearchParams();
  if (params?.per_page) {
    searchParams.set("per_page", params.per_page.toString());
  }
  if (params?.page) {
    searchParams.set("page", params.page.toString());
  }

  const response = await fetch(`${getNewsletterApiUrl()}?${searchParams.toString()}`, {
    method: "GET",
    headers: {
      Authorization: getNewsletterAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Newsletter API error: ${response.status} ${errorBody}`);
  }

  return response.json() as Promise<Record<string, unknown>>;
};
