"use client"

import Image from "next/image"
import { Button } from "../ui/button"
import { Separator } from "../ui/separator"
import { Input } from "../ui/input"
import Link from "next/link"
import { ArrowRight, ChevronRight } from "lucide-react"
import { useState } from "react"

const Footer = () => {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubscribe = async () => {
    if (!email) {
      setMessage("Please enter your email address.")
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error ?? "Subscription failed. Please try again.")
      }

      setEmail("")
      setMessage("You're in! We'll keep you updated.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Subscription failed."
      setMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <footer className="w-full py-16 px-8" style={{ backgroundImage: "url('/images/tof-dots.png')", backgroundSize: "100%", backgroundPosition: "center bottom", backgroundRepeat: "no-repeat" }}>
      <div className="flex flex-col gap-16 justify-between max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between gap-8">
          <div className="lg:max-w-xs w-full flex justify-center sm:justify-start">
            <div className="flex flex-col gap-4 max-w-xs items-center sm:items-start">
              <Image src="/images/tof-logo.png" alt="Logo" width={669} height={192} className="w-40" />
              <div className="text-white text-lg lg:text-2xl text-center sm:text-left">Get access to our exclusive updates and stay ahead with the latest news!</div>
              <div className="flex items-center bg-dark-gray pr-4 rounded-xl">
                <Input
                  placeholder="Email address"
                  className="border-none bg-transparent h-14 ring-0 text-white focus-visible:ring-0 pl-4"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                />
                <Button
                  size="icon"
                  variant="primary"
                  className="rounded-full"
                  onClick={handleSubscribe}
                  disabled={isSubmitting}
                  aria-label="Subscribe to newsletter"
                >
                  <ChevronRight className="w-7! h-7!" />
                </Button>
              </div>
              {message ? <p className="text-sm text-white/70">{message}</p> : null}
            </div>
          </div>
          <Separator className="block sm:hidden bg-white/5" />
          <div className="flex flex-col gap-4 text-white/60 w-full sm:w-auto">
            <h5 className="text-white text-xl">Navigation</h5>
            <ul className="flex flex-col gap-2">
              <li><Link href="/" className="hover:text-white">Home</Link></li>
              <li><Link href="/about" className="hover:text-white">Affiliate program</Link></li>
              <li><Link href="/contact" className="hover:text-white">Dashboard Sign in</Link></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4 text-white/60 w-full sm:w-auto">
            <h5 className="text-white text-xl">Contact</h5>
            <ul className="flex flex-col gap-2">
              <li><Link href="/" className="hover:text-white">Contact us</Link></li>
              <li><Link href="/about" className="hover:text-white">FAQ&apos;s</Link></li>
              <li><Link href="/contact" className="hover:text-white">Discord</Link></li>
            </ul>
          </div>
          <div className="flex flex-col gap-4 text-white/60 w-full sm:w-auto">
            <h5 className="text-white text-xl">Social Media</h5>
            <ul className="flex flex-col gap-2">
              <li><Link href="/" className="hover:text-white">Facebook</Link></li>
              <li><Link href="/about" className="hover:text-white">X</Link></li>
              <li><Link href="/contact" className="hover:text-white">Instagram</Link></li>
              <li><Link href="/contact" className="hover:text-white">Youtube</Link></li>
              <li><Link href="/contact" className="hover:text-white">Discord</Link></li>
            </ul>
          </div>
        </div>
        <Separator className="bg-white/5" />
        <div className="flex items-center justify-between text-white/90">
          <div className="flex flex-col gap-10">
            <div className="max-w-96">© 2025, Top One Futures. All Rights Reserved. Support@TopOneFutures.com</div>
            <div className="max-w-56">1621 Central Ave, Suite 8433 Cheyenne WY 82001</div>
          </div>
          <div className="hidden sm:flex gap-8">
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Use</Link>
          </div>
        </div>
        <div className="text-white/60 text-sm flex flex-col gap-2">
          <p>Disclaimer: All content and information provided on this website are for educational and informational purposes only, specifically relating to trading in financial markets. They should not be construed as specific investment recommendations, endorsements, or solicitations to buy or sell securities or any other investment instruments. It&apos;s emphasized that trading in financial markets carries inherent risks, and potential traders are advised not to invest more than they can afford to lose.</p>
          <p>Top One Futures, LLC does not provide direct broker services, trading services, or hold custody of any investor funds. Any and all broker-related services, including concerns about pricing, slippage, or any trading occurrences, are outsourced to a 3rd party broker over which Top One Futures, LLC has no direct control. The Company is also not a licensed investment service provider and does not offer any services that would fall under such categorization. Any references to “trading” or “trader” on our platform should be understood as notional or fictitious trading on demo accounts.</p>
          <p>Users of our platform should be aware that the technical solutions offered, including platforms and data feeds, may utilize third-party services. All rights reserved; the content on this website is copyrighted by Top One Futures, LLC. No portion of this website&apos;s content may be construed as a guarantee of future performance, and all investments carry the possibility of the total loss of the invested amount. We encourage all potential and current users to seek professional financial advice before making any investment decisions. This website is operated under the jurisdiction of applicable local laws and regulations. Top One Futures, LLC assumes no responsibility or liability for any misinterpretation, misuse, or reliance on the information provided on this website.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
