import Image from "next/image"
import { Button } from "../ui/button"

const Header = () => {
  return (
    <header className="w-full py-4 px-8">
      <div className="flex justify-between max-w-6xl mx-auto">
        <Image src="/images/tof-logo.png" alt="Logo" width={669} height={192} className="w-40" />
        <div className="flex gap-2">
          <Button variant="outline" size="lg">Log In</Button>
          <Button variant="primary" size="lg">Start Trading NOW</Button>
        </div>
      </div>
    </header>
  )
}

export default Header
