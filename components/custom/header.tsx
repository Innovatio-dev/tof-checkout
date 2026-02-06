"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "../ui/button"
import { useLoginModalStore } from "@/components/custom/login-modal"
import { LogOutIcon } from "lucide-react"
import { logout } from "@/lib/auth"

type HeaderProps = {
  isAuthenticated?: boolean
}

const Header = ({ isAuthenticated = false }: HeaderProps) => {
  const openModal = useLoginModalStore((state) => state.openModal)

  return (
    <header className="w-full py-4 px-8">
      <div className="flex justify-between max-w-6xl mx-auto">
        <Link href="https://toponefutures.com" target="_blank" rel="noreferrer">
          <Image src="/images/tof-logo.png" alt="Logo" width={669} height={192} className="w-40" />
        </Link>
        <div className="flex gap-2 items-center">
          {isAuthenticated ? (
            <Link href="/account">
              <Button variant="outline" size="lg">
                My account
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="lg" onClick={openModal}>
              Log In
            </Button>
          )}
          <Link href="https://portal.toponefutures.com" target="_blank" rel="noreferrer">
            <Button variant="primary" size="lg">Start Trading NOW</Button>
          </Link>
          {isAuthenticated && (
            <Button variant="outline" size="icon-lg" onClick={logout} className="h-12">
              <LogOutIcon />
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
