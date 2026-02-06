type SubscriptionDetailProps = {
  onBack: () => void;
};

type DetailRow = {
  label: string;
  value: string;
  accent?: "success" | "warning" | "danger";
};

const detailRows: DetailRow[] = [
  { label: "Status", value: "On hold", accent: "warning" },
  { label: "Start date", value: "January 30, 2026" },
  { label: "Last order date", value: "January 30, 2026" },
  { label: "Next payment date", value: "–" },
  { label: "Payment", value: "Via Secured Checkouts" },
  { label: "Actions", value: "Cancel", accent: "danger" },
];

const totals = {
  product: "Elite Challenge – $25,000 – Tradovate/Ninjatrader",
  amount: "$69.00 / month",
};

export default function SubscriptionDetail({ onBack }: SubscriptionDetailProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0c0e0c] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-semibold">Subscription #280278</h2>
          <p className="mt-1 text-sm text-white/60">Subscription details and billing summary.</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 hover:text-white"
        >
          ← All Subscriptions
        </button>
      </header>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <div className="divide-y divide-white/10">
          {detailRows.map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_1.2fr] gap-4 px-6 py-4 text-sm">
              <span className="font-semibold text-white/70">{row.label}</span>
              <span
                className={`font-semibold ${
                  row.accent === "warning"
                    ? "text-amber-300"
                    : row.accent === "danger"
                      ? "text-rose-400"
                      : "text-white"
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold">Subscription totals</h3>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-[2fr_1fr] gap-4 bg-white/5 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            <span>Product</span>
            <span>Total</span>
          </div>
          <div className="divide-y divide-white/10">
            <div className="grid grid-cols-[2fr_1fr] gap-4 px-6 py-4 text-sm text-white/80">
              <span className="font-semibold text-emerald-300">{totals.product}</span>
              <span className="font-semibold text-white">{totals.amount}</span>
            </div>
            <div className="grid grid-cols-[2fr_1fr] gap-4 px-6 py-3 text-sm text-white/70">
              <span>Subtotal</span>
              <span className="font-semibold text-white">$69.00</span>
            </div>
            <div className="grid grid-cols-[2fr_1fr] gap-4 px-6 py-3 text-sm text-white/70">
              <span>Total</span>
              <span className="font-semibold text-white">$69.00 / month</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-semibold">Related orders</h3>
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-[1fr_1.3fr_1fr_1fr] gap-4 bg-white/5 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            <span>Order</span>
            <span>Date</span>
            <span>Status</span>
            <span>Total</span>
          </div>
          <div className="divide-y divide-white/10">
            <div className="grid grid-cols-[1fr_1.3fr_1fr_1fr] gap-4 px-6 py-4 text-sm text-white/80">
              <span className="font-semibold text-emerald-300">#280277</span>
              <span>January 30, 2026</span>
              <span className="font-semibold text-rose-400">Failed</span>
              <span className="font-semibold text-white">$69.00</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
