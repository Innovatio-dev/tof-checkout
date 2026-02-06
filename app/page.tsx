import { Suspense } from "react";
import { cookies } from "next/headers";

import HomeContent from "@/components/home/home-content";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const { valid } = await verifySessionCookie(sessionCookie);
  return (
    <Suspense fallback={<div className="py-16 text-white/70">Loading checkout...</div>}>
      <HomeContent isAuthenticated={valid} />
    </Suspense>
  );
}
