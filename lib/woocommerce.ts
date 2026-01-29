export type WooCommerceRequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined>;
};

const baseUrl = process.env.WC_BASE_URL?.replace(/\/$/, "");
const apiPrefix = (process.env.WC_API_PREFIX ?? "/wp-json/wc/v3").replace(/\/$/, "");
const consumerKey = process.env.WC_CONSUMER_KEY;
const consumerSecret = process.env.WC_CONSUMER_SECRET;

export const isWooCommerceConfigured = () => {
  return Boolean(baseUrl && consumerKey && consumerSecret);
};

const buildUrl = (path: string, query?: WooCommerceRequestOptions["query"]) => {
  if (!baseUrl) {
    throw new Error("WC_BASE_URL is not set");
  }
  const normalizedPath = path.replace(/^\//, "");
  const url = new URL(`${apiPrefix}/${normalizedPath}`, baseUrl);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url;
};

export const wcRequest = async <T>(path: string, options: WooCommerceRequestOptions = {}) => {
  if (!isWooCommerceConfigured()) {
    throw new Error("WooCommerce environment variables are not configured");
  }

  const url = buildUrl(path, options.query);
  const headers = new Headers(options.headers);
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  headers.set("Authorization", `Basic ${credentials}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WooCommerce request failed (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
};
