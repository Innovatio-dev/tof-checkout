import { cookies } from "next/headers";

import AccountTabs from "@/components/account/account-tabs";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";
import { getOrdersByCustomerId, getUserByEmail, type WooOrder } from "@/lib/woocommerce";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionCookie(sessionCookie);
  const customer = await (async () => {
    if (!session.valid) return null;
    return getUserByEmail(session.email);
  })();
  console.log("[account] customer payload", {
    email: session.valid ? session.email : null,
    customer,
  });
  const orders = await (async () => {
    if (!customer) return [] as WooOrder[];
    return getOrdersByCustomerId({ customerId: customer.id });
  })();

  return (
    <div className="min-h-screen md:px-6 px-0 md:py-12 py-8 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Account</p>
          <h1 className="mt-2 text-4xl font-semibold">Welcome back</h1>
          <div className="mt-6 rounded-2xl border border-neon-green/30 bg-white/5 p-5">
            <div className="grid gap-1 text-xs text-white/80">
              <div>
                <span className="text-white/50">ID:</span> {customer?.id ?? "—"}
              </div>
              <div>
                <span className="text-white/50">Name:</span>{" "}
                {customer
                  ? (
                      `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
                      `${customer.billing?.first_name ?? ""} ${customer.billing?.last_name ?? ""}`.trim() ||
                      "—"
                    )
                  : "—"}
              </div>
              <div>
                <span className="text-white/50">Email:</span> {session.valid ? session.email : "—"}
              </div>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-white/60">
            Manage your orders, subscription settings, credits, and billing details from one place.
          </p>
        </div>

        <AccountTabs orders={orders} isAuthenticated={session.valid} customer={customer} />
      </div>
    </div>
  );
}
