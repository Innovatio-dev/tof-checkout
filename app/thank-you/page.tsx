"use client";

import Link from "next/link";
import { useMemo } from "react";
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

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "T1F-2025";
  const email = searchParams.get("email") ?? "trader@example.com";
  const total = searchParams.get("total") ?? "$0.00";
  const paymentMethod = searchParams.get("payment") ?? "Card";
  const orderDate = useMemo(() => formatDate(searchParams.get("date")), [searchParams]);

  const overviewItems = [
    { label: "Order number", value: `#${orderNumber}` },
    { label: "Date", value: orderDate },
    { label: "Email", value: email },
    { label: "Total", value: total },
    { label: "Payment method", value: paymentMethod },
  ];

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
                <span className="text-sm text-white/60">Account package</span>
                <span className="text-base font-semibold text-white">Instant Sim Funded</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-white/60">Platform</span>
                <span className="text-base font-semibold text-white">Tradovate + NinjaTrader</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm text-white/60">Quantity</span>
                <span className="text-base font-semibold text-white">1</span>
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
}
