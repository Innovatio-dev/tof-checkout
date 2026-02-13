import { NextRequest, NextResponse } from "next/server";

import { getOrderById, updateOrder } from "@/lib/woocommerce";

/**
 * Maps:
 * approved → completed (set_paid: true)
 * declined → failed
 * approved_on_hold → on-hold
 * authorized → on-hold
 * voided → cancelled
 */
const statusMap: Record<string, { status: string; setPaid: boolean }> = {
  approved: { status: "completed", setPaid: true },
  declined: { status: "failed", setPaid: false },
  approved_on_hold: { status: "on-hold", setPaid: false },
  authorized: { status: "on-hold", setPaid: false },
  voided: { status: "cancelled", setPaid: false },
};

type BridgerWebhookPayload = {
  webhook?: {
    type?: string;
  };
  data?: {
    order_id?: string;
    psp_name?: string;
    charge?: {
      id?: string;
      uuid?: string;
      type?: string;
      attributes?: {
        status?: string;
        amount?: number;
        currency?: string;
        payment_method?: string;
      };
    };
  };
};

export async function POST(request: NextRequest) {
  // Log the incoming request
  const rawBody = await request.text();
  console.log("[WEBHOOK::Orders] Incoming request", {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
    body: rawBody,
  });

  // Parse the raw body as JSON
  const payload = ((): BridgerWebhookPayload | null => {
    if (!rawBody) {
      return null;
    }
    try {
      return JSON.parse(rawBody) as BridgerWebhookPayload;
    } catch {
      return null;
    }
  })();

  console.log("[WEBHOOK::Orders] Parsed payload", {
    hasPayload: Boolean(payload),
    webhookType: payload?.webhook?.type,
    chargeType: payload?.data?.charge?.type,
    orderId: payload?.data?.order_id,
    chargeId: payload?.data?.charge?.id,
    chargeUuid: payload?.data?.charge?.uuid,
    pspName: payload?.data?.psp_name,
  });

  if (!payload) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const rawStatus = payload.webhook?.type ?? payload.data?.charge?.type ?? "";
  const normalizedStatus = rawStatus.trim().toLowerCase();
  const mappedStatus = statusMap[normalizedStatus];
  const orderId = Number(payload.data?.order_id ?? "");

  console.log("[WEBHOOK::Orders] Status mapping", {
    rawStatus,
    normalizedStatus,
    mappedStatus,
    orderId,
  });

  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: "Missing order_id." }, { status: 400 });
  }

  if (!mappedStatus) {
    return NextResponse.json({ error: "Unsupported status." }, { status: 400 });
  }

  try {
    const primaryOrder = await getOrderById(orderId);
    const orderIdMeta = primaryOrder.meta_data?.find(
      (item: { key?: string; value?: unknown } | undefined) =>
        typeof item?.key === "string" && item.key === "bridgerpay_order_ids"
    );
    const relatedOrderIds = String(orderIdMeta?.value ?? "")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
    const targetOrderIds = relatedOrderIds.length ? relatedOrderIds : [orderId];

    console.log("[WEBHOOK::Orders] Target order ids", {
      primaryOrderId: orderId,
      relatedOrderIds,
      targetOrderIds,
      bridgerpayOrderIdsMeta: orderIdMeta?.value ?? null,
    });

    const updatePayload = {
      status: mappedStatus.status,
      set_paid: mappedStatus.setPaid,
      payment_method: payload.data?.psp_name,
      transaction_id: payload.data?.charge?.id ?? payload.data?.charge?.uuid,
      meta_data: [
        { key: "bridgerpay_status", value: normalizedStatus },
        { key: "bridgerpay_charge_id", value: payload.data?.charge?.id ?? null },
        { key: "bridgerpay_charge_uuid", value: payload.data?.charge?.uuid ?? null },
        { key: "bridgerpay_psp", value: payload.data?.psp_name ?? null },
      ],
    };

    console.log("[WEBHOOK::Orders] Update payload", {
      updatePayload,
      targetOrderIds,
    });

    const updatedOrders = await Promise.all(
      targetOrderIds.map((id) => updateOrder(id, updatePayload))
    );

    console.log("[WEBHOOK::Orders] Orders updated", {
      updatedOrderIds: updatedOrders.map((order) => order?.id ?? null),
      count: updatedOrders.length,
    });

    return NextResponse.json({ received: true, orders: updatedOrders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
