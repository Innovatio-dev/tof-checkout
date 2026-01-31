import { Suspense } from "react";

import ThankYouContent from "./thank-you-content";

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="py-16 text-white/70">Loading order details...</div>}>
      <ThankYouContent />
    </Suspense>
  );
}
