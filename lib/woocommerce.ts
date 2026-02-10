import "server-only";
import WooCommerceRestApi, { type WooCommerceRestApiVersion } from "@woocommerce/woocommerce-rest-api";

export type WooCommerceRequestOptions = {
  query?: Record<string, string | number | boolean | undefined>;
  data?: Record<string, unknown> | Record<string, unknown>[];
};

const siteUrl = process.env.WP_SITE_URL?.replace(/\/$/, "");
const consumerKey = process.env.WP_CONSUMER_KEY;
const consumerSecret = process.env.WP_CONSUMER_SECRET;
const apiVersion = (process.env.WP_API_VERSION ?? "wc/v3") as WooCommerceRestApiVersion;

const getWooCommerceApi = () => {
  if (!siteUrl) {
    throw new Error("WP_SITE_URL is not set");
  }
  if (!consumerKey || !consumerSecret) {
    throw new Error("WooCommerce environment variables are not configured");
  }

  return new WooCommerceRestApi({
    url: siteUrl,
    consumerKey,
    consumerSecret,
    version: apiVersion,
  });
};

export const isWooCommerceConfigured = () => {
  return Boolean(siteUrl && consumerKey && consumerSecret);
};

export const wcRequest = async <T>(path: string, options: WooCommerceRequestOptions = {}) => {
  const api = getWooCommerceApi();
  const response = await api.get(path, options.query);
  return response.data as T;
};

export type WooProduct = {
  id: number;
  name: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
};

export type WooProductVariation = {
  id: number;
  product_id: number;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
};

export type WooCoupon = {
  id: number;
  code: string;
  amount: string;
  discount_type: string;
  date_expires?: string | null;
};

export type WooCouponDetail = {
  id: number;
  code: string;
  amount: string;
  status?: string;
  date_created?: string;
  date_created_gmt?: string;
  date_modified?: string;
  date_modified_gmt?: string;
  discount_type?: string;
  description?: string;
  date_expires?: string | null;
  date_expires_gmt?: string | null;
  usage_count?: number;
  individual_use?: boolean;
  product_ids?: number[];
  excluded_product_ids?: number[];
  usage_limit?: number | null;
  usage_limit_per_user?: number | null;
  limit_usage_to_x_items?: number | null;
  product_categories?: number[];
  excluded_product_categories?: number[];
  exclude_sale_items?: boolean;
  minimum_amount?: string;
  maximum_amount?: string;
  email_restrictions?: string[];
};

export type WooCouponQuery = {
  per_page?: number;
  page?: number;
  code?: string;
  status?: string;
  search?: string;
};

export type WooCustomer = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  shipping?: {
    first_name?: string;
    last_name?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

export type WooUser = WooCustomer & {
  role?: string;
  roles?: string[];
  meta_data?: Array<{ key: string; value: unknown }>;
};

export type WooUserQuery = {
  per_page?: number;
  page?: number;
  email?: string;
  search?: string;
  role?: string;
  orderby?: string;
  order?: "asc" | "desc";
};

export type WooOrder = {
  id: number;
  status: string;
  total: string;
  currency: string;
  date_created?: string;
  payment_method_title?: string;
  billing?: {
    email?: string;
  };
  line_items?: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
  }>;
};

export type WooSubscription = {
  id: number;
  status: string;
  total: string;
  currency: string;
  date_created?: string;
  next_payment_date?: string;
  billing?: {
    email?: string;
  };
  line_items?: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
  }>;
};

export type WooOrderQuery = {
  per_page?: number;
  page?: number;
  order?: "asc" | "desc";
  orderby?: string;
  customer?: number;
  status?: string;
};

export type WooSubscriptionQuery = {
  per_page?: number;
  page?: number;
  order?: "asc" | "desc";
  orderby?: string;
  customer?: number;
  status?: string;
};

export const getProducts = async (query?: Record<string, string | number | boolean | undefined>) => {
  const api = getWooCommerceApi();
  const response = await api.get("products", query);
  return response.data as WooProduct[];
};

export const getProductById = async (productId: number) => {
  const api = getWooCommerceApi();
  const response = await api.get(`products/${productId}`);
  return response.data as WooProduct;
};

export const getProductVariationById = async (productId: number, variationId: number) => {
  const api = getWooCommerceApi();
  const response = await api.get(`products/${productId}/variations/${variationId}`);
  return response.data as WooProductVariation;
};

export const getCoupons = async (query?: WooCouponQuery) => {
  const api = getWooCommerceApi();
  const response = await api.get("coupons", query);
  return response.data as WooCoupon[];
};

export const getAllCoupons = async ({
  perPage = 100,
  maxPages = 200,
  status,
  search,
}: {
  perPage?: number;
  maxPages?: number;
  status?: string;
  search?: string;
} = {}) => {
  const coupons: WooCoupon[] = [];
  let page = 1;

  while (page <= maxPages) {
    const batch = await getCoupons({ per_page: perPage, page, status, search });
    coupons.push(...batch);
    if (batch.length < perPage) {
      break;
    }
    page += 1;
  }

  return coupons;
};

export const getCouponByCode = async (code: string) => {
  const normalizedCode = code.trim().toLowerCase();
  if (!normalizedCode) {
    return null;
  }
  const coupons = await getCoupons({ code: normalizedCode });
  const coupon = coupons.find((item) => item.code?.toLowerCase() === normalizedCode) as
    | (WooCouponDetail & Record<string, unknown>)
    | undefined;
  if (!coupon) {
    return null;
  }

  return {
    id: coupon.id,
    code: coupon.code,
    amount: coupon.amount,
    status: coupon.status,
    date_created: coupon.date_created,
    date_created_gmt: coupon.date_created_gmt,
    date_modified: coupon.date_modified,
    date_modified_gmt: coupon.date_modified_gmt,
    discount_type: coupon.discount_type,
    description: coupon.description,
    date_expires: coupon.date_expires,
    date_expires_gmt: coupon.date_expires_gmt,
    usage_count: coupon.usage_count,
    individual_use: coupon.individual_use,
    product_ids: coupon.product_ids,
    excluded_product_ids: coupon.excluded_product_ids,
    usage_limit: coupon.usage_limit,
    usage_limit_per_user: coupon.usage_limit_per_user,
    limit_usage_to_x_items: coupon.limit_usage_to_x_items,
    product_categories: coupon.product_categories,
    excluded_product_categories: coupon.excluded_product_categories,
    exclude_sale_items: coupon.exclude_sale_items,
    minimum_amount: coupon.minimum_amount,
    maximum_amount: coupon.maximum_amount,
    email_restrictions: coupon.email_restrictions,
  };
};

export type CreateCustomerPayload = {
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  billing?: Record<string, unknown>;
  shipping?: Record<string, unknown>;
};

export const createCustomer = async (payload: CreateCustomerPayload) => {
  const api = getWooCommerceApi();
  try {
    const response = await api.post("customers", payload);
    return response.data as WooCustomer;
  } catch (error) {
    const normalizedEmail = payload.email?.trim().toLowerCase();
    if (normalizedEmail) {
      const existingUser = await getUserByEmail(normalizedEmail);
      if (existingUser) {
        return existingUser;
      }
    }
    throw error;
  }
};

export const getCustomersByEmail = async (email: string) => {
  const api = getWooCommerceApi();
  const response = await api.get("customers", { email });
  return response.data as WooCustomer[];
};

export const getUsers = async (query?: WooUserQuery) => {
  const api = getWooCommerceApi();
  const response = await api.get("customers", query);
  return response.data as WooUser[];
};

export const getUserByEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const users = await getUsers({ email: normalizedEmail });
  const matchedUser = users.find((item) => item.email?.trim().toLowerCase() === normalizedEmail) ?? users[0];
  if (matchedUser) {
    return matchedUser;
  }

  const searchedUsers = await getUsers({ search: normalizedEmail });
  const searchedMatch =
    searchedUsers.find((item) => item.email?.trim().toLowerCase() === normalizedEmail) ??
    searchedUsers[0];
  if (searchedMatch) {
    return searchedMatch;
  }

  const subscriberUsers = await getUsers({ search: normalizedEmail, role: "subscriber" });
  const subscriberMatch =
    subscriberUsers.find((item) => item.email?.trim().toLowerCase() === normalizedEmail) ??
    subscriberUsers[0];
  return subscriberMatch ?? null;
};

const ADMIN_ROLE_SET = new Set(["administrator", "admin", "shop_manager"]);

const extractRolesFromMeta = (metaData: WooUser["meta_data"]) => {
  if (!metaData) {
    return [] as string[];
  }

  const roles: string[] = [];
  for (const entry of metaData) {
    const key = entry.key?.toLowerCase();
    if (!key) {
      continue;
    }
    if (key === "wp_capabilities" || key === "capabilities" || key === "roles") {
      const value = entry.value;
      if (Array.isArray(value)) {
        roles.push(...value.map((item) => String(item)));
      } else if (typeof value === "string") {
        roles.push(...value.split(",").map((item) => item.trim()));
      } else if (value && typeof value === "object") {
        roles.push(...Object.keys(value as Record<string, unknown>));
      }
    }
  }

  return roles;
};

export const isWooUserAdmin = (user: WooUser | null | undefined) => {
  if (!user) {
    return false;
  }

  const roles: string[] = [];
  if (user.role) {
    roles.push(user.role);
  }
  if (user.roles?.length) {
    roles.push(...user.roles);
  }
  roles.push(...extractRolesFromMeta(user.meta_data));

  return roles.some((role) => ADMIN_ROLE_SET.has(role.trim().toLowerCase()));
};

export const requestEmailOtp = async (email: string) => {
  if (!siteUrl) {
    throw new Error("WP_SITE_URL is not set");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const response = await fetch(`${siteUrl}/wp-json/email-otp/v1/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: normalizedEmail }),
  });

  const rawBody = await response.text().catch(() => "");
  const parsedBody = ((): unknown => {
    if (!rawBody) {
      return null;
    }
    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  })();

  if (!response.ok) {
    console.error("[wp/email-otp/request] non-ok response", {
      status: response.status,
      statusText: response.statusText,
      body: parsedBody,
    });
    const body = parsedBody as { error?: string; message?: string } | null;
    throw new Error(body?.error ?? body?.message ?? "Failed to request OTP");
  }

  console.log("[wp/email-otp/request] ok response", {
    status: response.status,
    body: parsedBody,
  });
  return (parsedBody ?? {}) as Record<string, unknown>;
};

export const verifyEmailOtp = async ({ email, otp }: { email: string; otp: string | number }) => {
  if (!siteUrl) {
    throw new Error("WP_SITE_URL is not set");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error("Email is required");
  }

  const otpString = String(otp).trim();
  if (!/^\d{6}$/.test(otpString)) {
    throw new Error("OTP must be 6 digits");
  }

  const response = await fetch(`${siteUrl}/wp-json/email-otp/v1/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      otp: Number(otpString),
    }),
  });

  const rawBody = await response.text().catch(() => "");
  const parsedBody = ((): unknown => {
    if (!rawBody) {
      return null;
    }
    try {
      return JSON.parse(rawBody);
    } catch {
      return rawBody;
    }
  })();

  if (!response.ok) {
    console.error("[wp/email-otp/verify] non-ok response", {
      status: response.status,
      statusText: response.statusText,
      body: parsedBody,
    });
    return {
      ok: false,
      status: response.status,
      body: parsedBody,
    };
  }

  console.log("[wp/email-otp/verify] ok response", {
    status: response.status,
    body: parsedBody,
  });
  return {
    ok: true,
    status: response.status,
    body: (parsedBody ?? {}) as Record<string, unknown>,
  };
};

export type CreateOrderLineItem = {
  product_id: number;
  variation_id?: number;
  quantity: number;
};

export type CreateOrderPayload = {
  customer_id?: number;
  payment_method?: string;
  payment_method_title?: string;
  set_paid?: boolean;
  currency?: string;
  billing?: Record<string, unknown>;
  shipping?: Record<string, unknown>;
  line_items: CreateOrderLineItem[];
  coupon_lines?: { code: string }[];
  customer_note?: string;
};

export const createOrder = async (payload: CreateOrderPayload) => {
  const api = getWooCommerceApi();
  const response = await api.post("orders", payload);
  return response.data as WooOrder;
};

export type UpdateOrderPayload = {
  status?: string;
  set_paid?: boolean;
  payment_method?: string;
  payment_method_title?: string;
  transaction_id?: string;
  customer_note?: string;
  meta_data?: Array<{ key: string; value: string | number | boolean | null }>;
};

export const updateOrder = async (orderId: number, payload: UpdateOrderPayload) => {
  const api = getWooCommerceApi();
  const response = await api.put(`orders/${orderId}`, payload);
  return response.data as WooOrder;
};

export const getOrderById = async (orderId: number) => {
  const api = getWooCommerceApi();
  const response = await api.get(`orders/${orderId}`);
  return response.data as WooOrder;
};

export const getOrders = async (query?: WooOrderQuery) => {
  const api = getWooCommerceApi();
  const response = await api.get("orders", query);
  return response.data as WooOrder[];
};

export const getSubscriptions = async (query?: WooSubscriptionQuery) => {
  const api = getWooCommerceApi();
  const response = await api.get("subscriptions", query);
  return response.data as WooSubscription[];
};

export const getOrdersByCustomerId = async ({
  customerId,
  perPage = 25,
}: {
  customerId: number;
  perPage?: number;
}) => {
  return getOrders({
    customer: customerId,
    per_page: perPage,
    orderby: "date",
    order: "desc",
  });
};

export const getSubscriptionsByEmail = async ({
  email,
  perPage = 25,
}: {
  email: string;
  perPage?: number;
}) => {
  const user = await getUserByEmail(email);
  if (!user) {
    return [] as WooSubscription[];
  }

  return getSubscriptions({
    customer: user.id,
    per_page: perPage,
    orderby: "date",
    order: "desc",
  });
};
