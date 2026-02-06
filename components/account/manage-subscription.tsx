"use client";

import { useState } from "react";

import SubscriptionDetail from "@/components/account/subscription-detail";

type SubscriptionRow = {
  id: string;
  name: string;
  nextPayment: string;
  amount: string;
  status: string;
};

const subscriptionRows: SubscriptionRow[] = [
  {
    id: "#280278",
    name: "Elite Challenge – $25,000 – Tradovate/Ninjatrader",
    nextPayment: "–",
    amount: "$69.00",
    status: "On hold",
  },
];

export default function ManageSubscription() {
  const [showDetail, setShowDetail] = useState(false);

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

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
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
    </section>
  );
}
