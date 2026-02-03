import { Suspense } from "react";

import HomeContent from "./home-content";

export default function Home() {
  return (
    <Suspense fallback={<div className="py-16 text-white/70">Loading checkout...</div>}>
      <HomeContent />
    </Suspense>
  );
}
