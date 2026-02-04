import { Suspense } from "react";

import PaymentCancelledContent from "@/components/payment-cancelled/payment-cancelled-content";

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={<div className="py-16 text-white/70">Loading order details...</div>}>
      <PaymentCancelledContent />
    </Suspense>
  );
}
