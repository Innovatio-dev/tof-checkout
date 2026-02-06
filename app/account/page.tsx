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
  const orders = await (async () => {
    if (!customer) return [] as WooOrder[];
    return getOrdersByCustomerId({ customerId: customer.id });
  })();

  return (
    <div className="min-h-screen px-6 py-12 text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Account</p>
          <h1 className="mt-2 text-4xl font-semibold">Welcome back</h1>
          <p className="mt-2 max-w-2xl text-white/60">
            Manage your orders, subscription settings, credits, and billing details from one place.
          </p>
        </div>

        <AccountTabs orders={orders} isAuthenticated={session.valid} customer={customer} />
      </div>
    </div>
  );
}
