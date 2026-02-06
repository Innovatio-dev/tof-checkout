import type { WooCustomer } from "@/lib/woocommerce";

type BillingDetailsProps = {
  customer: WooCustomer | null;
  isAuthenticated: boolean;
};

const fieldLabel = (label: string) => (
  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">{label}</span>
);

export default function BillingDetails({ customer, isAuthenticated }: BillingDetailsProps) {
  const billing = customer?.billing ?? {};
  const shipping = customer?.shipping ?? {};

  const fullName = [billing.first_name, billing.last_name].filter(Boolean).join(" ") || "—";
  const email = billing.email || customer?.email || "—";
  const phone = billing.phone || "—";
  const address = [billing.address_1, billing.address_2, billing.city, billing.state, billing.postcode]
    .filter(Boolean)
    .join(", ");
  const country = billing.country || "—";

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0c0e0c] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <header className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-semibold">Billing Details</h2>
        <p className="mt-1 text-sm text-white/60">
          Review the billing information on file for your account.
        </p>
      </header>

      {!isAuthenticated ? (
        <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
          Sign in to view your billing details.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Primary Billing</h3>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-200">
                Active
              </span>
            </div>
            <div className="mt-5 grid gap-4 text-sm text-white/80">
              <div className="space-y-2">
                {fieldLabel("Name")}
                <p className="text-base font-semibold text-white">{fullName}</p>
              </div>
              <div className="space-y-2">
                {fieldLabel("Email")}
                <p>{email}</p>
              </div>
              <div className="space-y-2">
                {fieldLabel("Phone")}
                <p>{phone}</p>
              </div>
              <div className="space-y-2">
                {fieldLabel("Address")}
                <p>{address || "—"}</p>
              </div>
              <div className="space-y-2">
                {fieldLabel("Country")}
                <p>{country}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
            <h3 className="text-base font-semibold">Shipping Details</h3>
            <p className="mt-2 text-sm text-white/60">
              Matches the latest shipping address used at checkout.
            </p>
            <div className="mt-5 grid gap-4 text-sm text-white/80">
              <div className="space-y-2">
                {fieldLabel("Recipient")}
                <p className="text-base font-semibold text-white">
                  {[shipping.first_name, shipping.last_name].filter(Boolean).join(" ") || "—"}
                </p>
              </div>
              <div className="space-y-2">
                {fieldLabel("Address")}
                <p>
                  {[shipping.address_1, shipping.address_2, shipping.city, shipping.state, shipping.postcode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
              </div>
              <div className="space-y-2">
                {fieldLabel("Country")}
                <p>{shipping.country || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
