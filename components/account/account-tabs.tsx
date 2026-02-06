"use client";

import { useState } from "react";

import BillingDetails from "@/components/account/billing-details";
import ManageSubscription from "@/components/account/manage-subscription";
import OrderHistory from "@/components/account/order-history";
import { logout } from "@/lib/auth";
import type { WooCustomer, WooOrder } from "@/lib/woocommerce";
import Link from "next/link";
import { LogOutIcon } from "lucide-react";

type AccountTabsProps = {
  orders: WooOrder[];
  isAuthenticated: boolean;
  customer: WooCustomer | null;
};

type TabKey = "orders" | "subscription" | "credits" | "billing" | "coupons";

const navItems: Array<{ key: TabKey; label: string }> = [
  { key: "orders", label: "Orders History" },
  { key: "subscription", label: "Manage Subscription" },
  // { key: "credits", label: "Store Credits" },
  { key: "billing", label: "Billing Details" },
  // { key: "coupons", label: "My Coupons" },
];

export default function AccountTabs({ orders, isAuthenticated, customer }: AccountTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("orders");

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-3xl border border-white/10 bg-linear-to-b from-white/5 via-white/3 to-transparent p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition cursor-pointer ${
                activeTab === item.key
                  ? "bg-[#6dd46a] text-[#0c120c] shadow-[0_8px_20px_rgba(109,212,106,0.35)]"
                  : "bg-white/5 text-white/75 hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-2 mt-10 border-t border-white/10 pt-10">
          <Link href="/" className="flex w-full items-center justify-between rounded-2xl border border-neon-green/20 px-4 py-4 text-sm font-semibold text-neon-green cursor-pointer">
            Go to Checkout
            <span className="text-lg">↗</span>
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-between rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm font-semibold text-rose-300 cursor-pointer"
          >
            Sign Out
            <LogOutIcon className="w-4" />
          </button>
        </div>
      </aside>

      {activeTab === "orders" && <OrderHistory orders={orders} isAuthenticated={isAuthenticated} />}
      {activeTab === "subscription" && <ManageSubscription />}
      {activeTab === "credits" && (
        <section className="rounded-3xl border border-white/10 bg-[#0c0e0c] p-6 text-sm text-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          Store credits content will be added here.
        </section>
      )}
      {activeTab === "billing" && (
        <BillingDetails customer={customer} isAuthenticated={isAuthenticated} />
      )}
      {activeTab === "coupons" && (
        <section className="rounded-3xl border border-white/10 bg-[#0c0e0c] p-6 text-sm text-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          Coupons content will be added here.
        </section>
      )}
    </div>
  );
}
