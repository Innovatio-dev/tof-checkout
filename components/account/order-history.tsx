import type { WooOrder } from "@/lib/woocommerce";

type OrderHistoryProps = {
  orders: WooOrder[];
  isAuthenticated: boolean;
};

const formatOrderDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const statusStyles: Record<string, string> = {
  pending: "text-amber-400",
  "pending-payment": "text-amber-400",
  processing: "text-emerald-400",
  completed: "text-emerald-400",
  failed: "text-rose-400",
  cancelled: "text-rose-400",
  refunded: "text-rose-300",
};

const formatStatus = (status?: string) => {
  if (!status) return "Unknown";
  return status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getOrderSummary = (order: WooOrder) => {
  const items = order.line_items ?? [];
  if (!items.length) return "Order";
  return items.map((item) => item.name).join(" / ");
};

export default function OrderHistory({ orders, isAuthenticated }: OrderHistoryProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0c0e0c] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-semibold">Orders History</h2>
          <p className="mt-1 text-sm text-white/60">Track the latest orders tied to your account.</p>
        </div>
        {!isAuthenticated ? (
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase text-amber-200">
            Sign in to see orders
          </span>
        ) : (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-200">
            {orders.length} orders
          </span>
        )}
      </header>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-[minmax(110px,1fr)_2.2fr_1.3fr_1fr_1.1fr] gap-4 bg-white/5 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
          <span>ID</span>
          <span>Challenge Name</span>
          <span>Date</span>
          <span>Amount</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-white/5">
          {orders.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-white/60">
              {isAuthenticated ? "No orders found yet." : "Sign in to view your order history."}
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[minmax(110px,1fr)_2.2fr_1.3fr_1fr_1.1fr] gap-4 px-6 py-5 text-sm text-white/80"
              >
                <span className="font-semibold text-emerald-300">#{order.id}</span>
                <span className="font-semibold text-white">{getOrderSummary(order)}</span>
                <span className="text-white/70">{formatOrderDate(order.date_created)}</span>
                <span className="font-semibold text-white">
                  {order.currency} {Number(order.total).toFixed(2)}
                </span>
                <span className={`font-semibold ${statusStyles[order.status] ?? "text-white/70"}`}>
                  {formatStatus(order.status)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
