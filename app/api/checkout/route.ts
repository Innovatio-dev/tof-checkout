import { NextRequest, NextResponse } from "next/server";

import {
  createCustomer,
  createOrder,
  getCustomersByEmail,
  getProducts,
  type CreateOrderPayload,
} from "@/lib/woocommerce";

type CheckoutPayload = {
  email?: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  address1?: string;
  address2?: string;
  city?: string;
  postcode?: string;
  phoneCode?: string;
  phoneNumber?: string;
  quantity?: number;
  accountType?: string;
  accountSize?: string;
  platform?: string;
  newsletter?: boolean;
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
    "postcode",
    "phoneCode",
    "phoneNumber",
    "quantity",
    "accountType",
    "accountSize",
    "platform",
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
  const customer =
    existingCustomers[0] ??
    (await createCustomer({
      email,
      first_name: payload.firstName,
      last_name: payload.lastName,
      billing: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        address_1: payload.address1,
        address_2: payload.address2 ?? "",
        city: payload.city,
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
        postcode: payload.postcode,
        country: payload.countryCode,
      },
    }));

  const products = await getProducts({ per_page: 1 });
  const product = products[0];

  if (!product) {
    return NextResponse.json({ error: "No products available." }, { status: 404 });
  }

  const orderPayload: CreateOrderPayload = {
    customer_id: customer.id,
    line_items: [
      {
        product_id: product.id,
        quantity: payload.quantity ?? 1,
      },
    ],
    billing: {
      first_name: payload.firstName,
      last_name: payload.lastName,
      address_1: payload.address1,
      address_2: payload.address2 ?? "",
      city: payload.city,
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
      postcode: payload.postcode,
      country: payload.countryCode,
    },
    customer_note: `Account type: ${payload.accountType}\nAccount size: ${payload.accountSize}\nPlatform: ${payload.platform}\nNewsletter: ${payload.newsletter ? "yes" : "no"}`,
  };

  // TODO: add the Gateway payment integration.

  const order = await createOrder(orderPayload);

  return NextResponse.json({ orderId: order.id });
}
