"use client";

import { useEffect, useMemo, useState } from "react";

import SubscriptionDetail from "@/components/account/subscription-detail";
import type { WooSubscription } from "@/lib/woocommerce";

type SubscriptionRow = {
  id: string;
  name: string;
  nextPayment: string;
  amount: string;
  status: string;
};

const formatCurrency = (amount: number, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (value?: string) => {
  if (!value) return "–";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "–";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
};

const formatStatus = (status?: string) => {
  if (!status) return "Unknown";
  return status.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function ManageSubscription() {
  const [showDetail, setShowDetail] = useState(false);
  const [subscriptions, setSubscriptions] = useState<WooSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadSubscriptions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/subscriptions", { method: "GET" });
        const data = (await response.json()) as {
          subscriptions?: WooSubscription[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to load subscriptions.");
        }

        if (isActive) {
          setSubscriptions(data.subscriptions ?? []);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load subscriptions.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadSubscriptions();

    return () => {
      isActive = false;
    };
  }, []);

  const subscriptionRows = useMemo<SubscriptionRow[]>(() => {
    return subscriptions.map((subscription) => {
      const lineItem = subscription.line_items?.[0];
      const amountNumber = Number(subscription.total ?? 0);
      return {
        id: `#${subscription.id}`,
        name: lineItem?.name ?? "Subscription",
        nextPayment: formatDate(subscription.next_payment_date),
        amount: formatCurrency(amountNumber, subscription.currency ?? "USD"),
        status: formatStatus(subscription.status),
      };
    });
  }, [subscriptions]);

  if (showDetail) {
    return <SubscriptionDetail onBack={() => setShowDetail(false)} />;
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0c0e0c] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <header className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-semibold">Subscriptions</h2>
        <p className="mt-1 text-sm text-white/60">
          Manage your active subscriptions and upcoming payments.
        </p>
      </header>

      {isLoading && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
          Loading subscriptions...
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && subscriptionRows.length === 0 && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
          No subscriptions found yet.
        </div>
      )}

      {!isLoading && !errorMessage && subscriptionRows.length > 0 && (
        <div className="mt-6 flex flex-col gap-4 md:hidden">
          {subscriptionRows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/80">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-300">{row.id}</span>
                <span className="text-xs font-semibold uppercase text-amber-300">{row.status}</span>
              </div>
              <p className="mt-2 text-base font-semibold text-white">{row.name}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
                <span>Next payment: {row.nextPayment}</span>
                <span className="text-sm font-semibold text-white">{row.amount}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDetail(true)}
                className="mt-4 w-full rounded-full bg-[#6dd46a] px-4 py-2 text-xs font-semibold text-[#0c120c]"
              >
                View
              </button>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !errorMessage && subscriptionRows.length > 0 && (
        <div className="mt-6 hidden w-full overflow-x-auto md:block">
          <div className="inline-block min-w-[720px] rounded-2xl border border-white/10">
            <div className="grid grid-cols-[minmax(110px,1fr)_2fr_1.1fr_0.9fr_0.9fr_0.7fr] gap-4 bg-white/5 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
              <span>ID</span>
              <span>Challenge Name</span>
              <span>Next payment</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            <div className="divide-y divide-white/5">
              {subscriptionRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(110px,1fr)_2fr_1.1fr_0.9fr_0.9fr_0.7fr] gap-4 px-6 py-5 text-sm text-white/80"
                >
                  <span className="font-semibold text-emerald-300">{row.id}</span>
                  <span className="font-semibold text-white">{row.name}</span>
                  <span className="text-white/70">{row.nextPayment}</span>
                  <span className="font-semibold text-white">{row.amount}</span>
                  <span className="font-semibold text-amber-300">{row.status}</span>
                  <span>
                    <button
                      type="button"
                      onClick={() => setShowDetail(true)}
                      className="rounded-full bg-[#6dd46a] px-4 py-2 text-xs font-semibold text-[#0c120c]"
                    >
                      View
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
