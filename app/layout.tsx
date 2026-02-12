import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import HeaderWrapper from "@/components/custom/header-wrapper";
import Footer from "@/components/custom/footer";
import LoginModal from "@/components/custom/login-modal";
import HyrosScript from "@/lib/topone/hyros-script";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: [
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ],
});

export const metadata: Metadata = {
  title: "Checkout - Top One Futures",
  description: "Trade futures with the top rated instant funding firm that pays out FAST.",
  other: {
    "facebook-domain-verification": "337dqrjjyppaayqltcucl01aierf8msn",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const convertAccountId = "10047892"
  const convertExperimentId = "100417614"
  return (
    <html lang="en">
      <head>
        <script
          type="text/javascript"
          src={`//cdn-4.convertexperiments.com/v1/js/${convertAccountId}-${convertExperimentId}.js?environment=production`}
        />
      </head>
      <body className={`${poppins.variable} antialiased bg-dark relative min-h-screen`}>
        <HyrosScript />
        <div className="absolute top-0 left-1/2 transform -translate-1/2 w-full">
          <Image src="/images/tof-dots.png" alt="Logo" width={1144} height={546} className="bg-transparent w-full" />
        </div>
        <div className="absolute w-1/2 aspect-square top-0 left-1/2 transform -translate-x-1/3 -translate-y-1/2 bg-neon-green/5 rounded-full blur-3xl"></div>
        <main className="relative">
          <HeaderWrapper />
          <LoginModal />
          <main className="p-6">
            <div className="w-full max-w-6xl mx-auto">
              {children}
            </div>
          </main>
          <Footer />
        </main>
      </body>
    </html>
  );
}
