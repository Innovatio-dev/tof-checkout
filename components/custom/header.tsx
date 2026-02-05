import Image from "next/image"
import Link from "next/link"
import { Button } from "../ui/button"

const Header = () => {
  return (
    <header className="w-full py-4 px-8">
      <div className="flex justify-between max-w-6xl mx-auto">
        <Link href="https://toponefutures.com" target="_blank" rel="noreferrer">
          <Image src="/images/tof-logo.png" alt="Logo" width={669} height={192} className="w-40" />
        </Link>
        <div className="flex gap-2">
          <Link href="https://portal.toponefutures.com" target="_blank" rel="noreferrer">
            <Button variant="outline" size="lg">Log In</Button>
          </Link>
          {/* <Button variant="primary" size="lg" className="hidden md:block">Start Trading NOW</Button> */}
        </div>
      </div>
    </header>
  )
}

export default Header
