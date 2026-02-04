import { Suspense } from "react";

import PaymentFailedContent from "@/components/payment-failed/payment-failed-content";

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="py-16 text-white/70">Loading order details...</div>}>
      <PaymentFailedContent />
    </Suspense>
  );
}
