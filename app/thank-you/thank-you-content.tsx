"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formatDate = (value: string | null) => {
  if (!value) {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ThankYouContent = () => {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [order, setOrder] = useState<{
    id: number;
    total: string;
    currency: string;
    date_created?: string;
    payment_method_title?: string;
    billing?: { email?: string };
    line_items?: Array<{ id: number; name: string; quantity: number; total: string }>;
  } | null>(null);

  useEffect(() => {
    setOrderId(sessionStorage.getItem("tof_order_id"));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadOrder = async () => {
      if (!orderId) {
        setOrderError("Missing order ID.");
        return;
      }

      setOrderLoading(true);
      setOrderError(null);
      try {
        const response = await fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? "Failed to load order details.");
        }
        const data = (await response.json()) as { order?: typeof order };
        if (!data.order) {
          throw new Error("Order details were not returned.");
        }
        if (isMounted) {
          setOrder(data.order);
        }
      } catch (error) {
        if (isMounted) {
          setOrderError(error instanceof Error ? error.message : "Failed to load order details.");
        }
      } finally {
        if (isMounted) {
          setOrderLoading(false);
        }
      }
    };

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const orderNumber = order?.id ? `${order?.id}` : orderId ?? "—";
  const email = order?.billing?.email ?? "—";
  const total = order?.total ? `$${order.total}` : "—";
  const paymentMethod = order?.payment_method_title ?? "—";
  const orderDate = useMemo(
    () => formatDate(order?.date_created ?? null),
    [order?.date_created]
  );

  const overviewItems = [
    { label: "Order number", value: `#${orderNumber}` },
    { label: "Date", value: orderDate },
    { label: "Email", value: email },
    { label: "Total", value: total },
    { label: "Payment method", value: paymentMethod },
  ];

  if (orderLoading) {
    return <div className="py-16 text-white/70">Loading order details...</div>;
  }

  if (orderError) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-white/70">
        {orderError}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 py-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10">
        <div className="flex flex-col gap-4 text-left">
          <span className="text-3xl font-semibold text-white">
            Thank you. Your order has been received
          </span>
          <p className="text-base text-white/70">
            Please wait 5-10 minutes to receive your confirmation email &amp; login details.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <Card className="border-white/10 bg-dark-gray text-white">
          <CardHeader>
            <CardTitle className="text-xl">Order overview</CardTitle>
            <CardDescription className="text-white/60">
              Keep this for your records while we prepare your trading access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {overviewItems.map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <span className="text-sm text-white/60">{item.label}</span>
                  <span className="text-base font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-dark-gray text-white">
            <CardHeader>
              <CardTitle className="text-xl">Customer details</CardTitle>
              <CardDescription className="text-white/60">
                We&apos;ll use these details for account provisioning.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-white/60">Email</span>
                <span className="text-base font-semibold text-white">{email}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-white/60">Account access</span>
                <span className="text-base font-semibold text-white">
                  Login details will be sent to your inbox shortly.
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-white/60">Support</span>
                <span className="text-base font-semibold text-white">support@toponefutures.com</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-dark-gray text-white">
            <CardHeader>
              <CardTitle className="text-xl">Order details</CardTitle>
              <CardDescription className="text-white/60">
                Summary of your selected account package.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-white/60">Primary item</span>
                <span className="text-base font-semibold text-white">
                  {order?.line_items?.[0]?.name ?? "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-white/60">Quantity</span>
                <span className="text-base font-semibold text-white">
                  {order?.line_items?.[0]?.quantity ?? "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-white/60">Line total</span>
                <span className="text-base font-semibold text-white">
                  {order?.line_items?.[0]?.total ? `$${order.line_items[0].total}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-sm text-white/60">Total</span>
                <span className="text-lg font-semibold text-white">{total}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-white/60">
            Questions? Reach out and we&apos;ll help you get started.
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="lg">
              <Link href="https://portal.toponefutures.com" target="_blank" rel="noreferrer">
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="primary" size="lg">
              <Link href="/">Back to Checkout</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThankYouContent;
