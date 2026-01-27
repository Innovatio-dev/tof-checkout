import Image from "next/image"
import { Button } from "../ui/button"

const Footer = () => {
  return (
    <footer className="w-full py-16 px-8">
      <div className="flex flex-col gap-16 justify-between max-w-7xl mx-auto">
        <Image src="/images/tof-logo.png" alt="Logo" width={669} height={192} className="w-40" />
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
