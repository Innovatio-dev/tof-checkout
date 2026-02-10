import { NextRequest, NextResponse } from "next/server";

import {
  createCustomer,
  createOrder,
  getCustomersByEmail,
  updateCustomer,
  type CreateOrderPayload,
} from "@/lib/woocommerce";
import { validateCoupon } from "@/lib/discounts";
import { getProductById, getProductVariationById } from "@/lib/woocommerce";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";
import { canStackCoupons, type StackableCoupon } from "@/lib/coupon-stacking";

type CheckoutPayload = {
  email?: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  phoneCode?: string;
  phoneNumber?: string;
  quantity?: number;
  accountType?: string;
  accountSize?: string;
  platform?: string;
  newsletter?: boolean;
  wooProductId?: number | null;
  wooVariantId?: number | null;
  couponCodes?: string[] | null;
};

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as CheckoutPayload;

  const requiredFields: Array<keyof CheckoutPayload> = [
    "email",
    "firstName",
    "lastName",
    "countryCode",
    "address1",
    "city",
    "state",
    "postcode",
    "phoneCode",
    "phoneNumber",
    "quantity",
    "accountType",
    "accountSize",
    "platform",
    "wooProductId",
  ];

  const missingField = requiredFields.find((field) => {
    const value = payload[field];
    if (typeof value === "string") {
      return !value.trim();
    }
    if (typeof value === "number") {
      return !Number.isFinite(value) || value <= 0;
    }
    return value === undefined || value === null;
  });

  if (missingField) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const email = payload.email!.trim().toLowerCase();
  const existingCustomers = await getCustomersByEmail(email);
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(sessionCookie);
  const customerPayload = {
    email,
    first_name: payload.firstName,
    last_name: payload.lastName,
    billing: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      address_1: payload.address1,
      address_2: payload.address2 ?? "",
      city: payload.city,
      state: payload.state,
      postcode: payload.postcode,
      country: payload.countryCode,
      phone: `+${payload.phoneCode}${payload.phoneNumber}`,
      email,
    },
    shipping: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      address_1: payload.address1,
      address_2: payload.address2 ?? "",
      city: payload.city,
      state: payload.state,
      postcode: payload.postcode,
      country: payload.countryCode,
    },
  };
  const existingCustomer = existingCustomers[0];
  const customer = existingCustomer
    ? session.valid && session.email.trim().toLowerCase() === email
      ? await updateCustomer(existingCustomer.id, customerPayload)
      : existingCustomer
    : await createCustomer(customerPayload);

  const productId = payload.wooProductId;
  if (!productId || !Number.isFinite(productId)) {
    return NextResponse.json({ error: "Invalid product selection." }, { status: 400 });
  }

  const rawQuantity = payload.quantity ?? 1;
  const sanitizedQuantity = Math.max(1, Number.isFinite(rawQuantity) ? rawQuantity : 1);

  const unitPrice = await (async () => {
    if (payload.wooVariantId) {
      const variation = await getProductVariationById(productId, payload.wooVariantId);
      return variation.price ? Number(variation.price) : null;
    }
    const product = await getProductById(productId);
    return product.price ? Number(product.price) : null;
  })();

  if (!unitPrice || !Number.isFinite(unitPrice)) {
    return NextResponse.json({ error: "Invalid product pricing." }, { status: 400 });
  }

  const orderPayload: CreateOrderPayload = {
    customer_id: customer.id,
    line_items: [
      {
        product_id: productId,
        variation_id: payload.wooVariantId ?? undefined,
        quantity: sanitizedQuantity,
      },
    ],
    billing: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      address_1: payload.address1,
      address_2: payload.address2 ?? "",
      city: payload.city,
      state: payload.state,
      postcode: payload.postcode,
      country: payload.countryCode,
      phone: `+${payload.phoneCode}${payload.phoneNumber}`,
      email,
    },
    shipping: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      address_1: payload.address1,
      address_2: payload.address2 ?? "",
      city: payload.city,
      state: payload.state,
      postcode: payload.postcode,
      country: payload.countryCode,
    },
    customer_note: `Account type: ${payload.accountType}\nAccount size: ${payload.accountSize}\nPlatform: ${payload.platform}\nNewsletter: ${payload.newsletter ? "yes" : "no"}`,
  };

  const rawCouponCodes = Array.isArray(payload.couponCodes)
    ? payload.couponCodes
    : typeof payload.couponCodes === "string"
      ? [payload.couponCodes]
      : [];
  const couponCodes = rawCouponCodes.map((code) => code.trim()).filter(Boolean).slice(0, 2);
  if (couponCodes.length) {
    const appliedCoupons: StackableCoupon[] = [];
    let runningTotal = unitPrice * sanitizedQuantity;

    for (const code of couponCodes) {
      const validation = await validateCoupon({
        code,
        email,
        productId,
        total: runningTotal,
      });
      if (!validation.valid || !validation.coupon) {
        return NextResponse.json({ error: validation.reason ?? "Invalid coupon." }, { status: 400 });
      }

      const stackCheck = canStackCoupons(appliedCoupons, {
        code: validation.coupon.code,
        individual_use: validation.coupon.individual_use,
        product_categories: validation.coupon.product_categories ?? null,
        excluded_product_categories: validation.coupon.excluded_product_categories ?? null,
        excluded_coupons_categories_ids: validation.coupon.excluded_coupons_categories_ids ?? null,
      });

      if (!stackCheck.allowed) {
        return NextResponse.json({ error: stackCheck.reason ?? "Coupons cannot be stacked." }, { status: 400 });
      }

      appliedCoupons.push({
        code: validation.coupon.code,
        individual_use: validation.coupon.individual_use,
        product_categories: validation.coupon.product_categories ?? null,
        excluded_product_categories: validation.coupon.excluded_product_categories ?? null,
        excluded_coupons_categories_ids: validation.coupon.excluded_coupons_categories_ids ?? null,
      });
      runningTotal = validation.totalAfterDiscount;
    }

    orderPayload.coupon_lines = appliedCoupons.map((coupon) => ({ code: coupon.code }));
  }

  // TODO: add the Gateway payment integration.

  const order = await createOrder(orderPayload);

  return NextResponse.json({ orderId: order.id });
}
