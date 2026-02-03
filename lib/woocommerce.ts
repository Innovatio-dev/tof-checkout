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

export type WooCoupon = {
  id: number;
  code: string;
  amount: string;
  discount_type: string;
  date_expires?: string | null;
};

export type WooCustomer = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
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

export const getCouponByCode = async (code: string) => {
  const api = getWooCommerceApi();
  const response = await api.get("coupons", { code });
  const coupons = response.data as WooCoupon[];
  return coupons[0] ?? null;
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
  const response = await api.post("customers", payload);
  return response.data as WooCustomer;
};

export const getCustomersByEmail = async (email: string) => {
  const api = getWooCommerceApi();
  const response = await api.get("customers", { email });
  return response.data as WooCustomer[];
};

export type CreateOrderLineItem = {
  product_id: number;
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

export const getOrderById = async (orderId: number) => {
  const api = getWooCommerceApi();
  const response = await api.get(`orders/${orderId}`);
  return response.data as WooOrder;
};
