import { cookies } from "next/headers"

import Header from "@/components/custom/header"
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth"

export default async function HeaderWrapper() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const { valid } = await verifySessionCookie(sessionCookie)

  return <Header isAuthenticated={valid} />
}
