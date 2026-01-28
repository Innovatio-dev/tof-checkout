 "use client";

import Image from "next/image";
import InstructionItem from "@/components/custom/instruction-item";
import TofRadioItem from "@/components/custom/tof-radio-item";
import PaymentRadioItem from "@/components/custom/payment-radio-item";
import { RadioGroup } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import FormSection from "@/components/custom/form-section";
import TofCheckbox from "@/components/custom/tof-checkbox";
import { Button } from "@/components/ui/button";
import { Lock, LockIcon, LockKeyholeIcon, MinusIcon, PlusIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
 import { useMemo, useState } from "react";

export default function Home() {
  const [accountType, setAccountType] = useState("instant-sim-funded");
  const [accountSize, setAccountSize] = useState("50k");
  const [platform, setPlatform] = useState("tradovate-ninjatrader");

  const accountTypeLabel = useMemo(() => {
    switch (accountType) {
      case "one-step-elite":
        return "1- Step ELITE Challenge";
      case "instant-sim-funded":
        return "INSTANT Sim Funded";
      case "s2f-sim-pro":
        return "S2F Sim PRO";
      case "ignite-instant":
        return "IGNITE Instant Funding";
      default:
        return accountType;
    }
  }, [accountType]);

  const accountSizeLabel = useMemo(() => {
    switch (accountSize) {
      case "25k":
        return "$25,000";
      case "50k":
        return "$50,000";
      case "100k":
        return "$100,000";
      case "250k":
        return "$250,000";
      default:
        return accountSize;
    }
  }, [accountSize]);

  const platformLabel = useMemo(() => {
    switch (platform) {
      case "tradovate-ninjatrader":
        return "Tradovate / Ninjatrader";
      default:
        return platform;
    }
  }, [platform]);

  return (
    <div className="flex flex-col gap-16 font-sans text-white">
      <div>
        <h1 className="text-6xl font-semibold">Checkout</h1>
        <p className="text-lg max-w-md">Please fill out the information and get funded. Existing customer? Log In before you checkout.</p>
      </div>

      <div className="flex gap-16">
        <div className="flex flex-col gap-16 w-1/2"> {/* Fist Column */}
          {/* #1 Confirm account information */}
          <div className="flex flex-col gap-4">
            <InstructionItem number={1} caption="Confirm trading account information" />
            <FormSection title="Account type">
              <RadioGroup value={accountType} onValueChange={setAccountType} className="grid grid-cols-2 gap-3">
                <TofRadioItem id="one-step-elite" value="one-step-elite" label="1- Step ELITE Challenge"/>
                <TofRadioItem id="instant-sim-funded" value="instant-sim-funded" label="INSTANT Sim Funded"/>
                <TofRadioItem id="s2f-sim-pro" value="s2f-sim-pro" label="S2F Sim PRO"/>
                <TofRadioItem id="ignite-instant" value="ignite-instant" label="IGNITE Instant Funding"/>
              </RadioGroup>
            </FormSection>

            <FormSection title="Account size">
              <RadioGroup value={accountSize} onValueChange={setAccountSize} className="grid grid-cols-2 gap-3">
                <TofRadioItem id="25k" value="25k" label="$25,000"/>
                <TofRadioItem id="50k" value="50k" label="$50,000"/>
                <TofRadioItem id="100k" value="100k" label="$100,000"/>
                <TofRadioItem id="250k" value="250k" label="$250,000"/>
              </RadioGroup>
            </FormSection>

            <FormSection title="Platform">
              <RadioGroup value={platform} onValueChange={setPlatform} className="grid grid-cols-2 gap-3">
                <TofRadioItem id="tradovate-ninjatrader" value="tradovate-ninjatrader" label="Tradovate / Ninjatrader"/>
              </RadioGroup>
            </FormSection>
          </div>

          {/* #2 Customer information */}
          <div className="flex flex-col gap-4">
            <InstructionItem number={2} caption="Customer information" />
            <Input placeholder="Enter your email" />
          </div>

          {/* #3 Billing details */}
          <div className="flex flex-col gap-4">
            <InstructionItem number={3} caption="Billing details" />
            <div className="grid grid-cols-10 gap-4">
              <Input placeholder="First name" className="col-span-6" />
              <Input placeholder="Last name" className="col-span-4" />

              <Input placeholder="Select country" className="col-span-10" />
              <Input placeholder="House number and street name" className="col-span-10" />
              <Input placeholder="Apartment, suite, etc. (optional)" className="col-span-10" />
              <Input placeholder="City" className="col-span-5" />
              <Input placeholder="Postcode / ZIP" className="col-span-5" />

              <Input placeholder="Phone code" className="col-span-2" />
              <Input placeholder="Phone number" className="col-span-8" />

              <div className="col-span-10 py-2">
                <TofCheckbox id="newsletter" name="newsletter" label="Keep me up to date on news and exclusive offers (optional)" />
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/2"> {/* Second Column */}
          <div className="flex flex-col gap-4 bg-white/8 border border-white/10 rounded-2xl p-6">
            <h4 className="text-xl font-semibold">Top One Futures Account</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-white/80">
                <span className="text-white/50">Type</span>
                <span className="text-white">{accountTypeLabel}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-white/80">
                <span className="text-white/50">Size</span>
                <span className="text-white">{accountSizeLabel}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-neon-yellow/20 bg-white/8 px-3 py-1 text-white/80">
                <span className="text-white/50">Platform</span>
                <span className="text-neon-yellow">{platformLabel}</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <div>Account ($100K)</div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <Button size={'icon'}><MinusIcon /></Button>
                  <span>1</span>
                  <Button size={'icon'}><PlusIcon /></Button>
                </div>
                <div>$100,000</div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="flex justify-between items-start py-2">
              <div>Total</div>
              <div className="text-neon-yellow text-3xl font-semibold">$100,000</div>
            </div>

            <div className="flex items-center gap-2">
              <Input placeholder="Enter promo code" />
              <Button variant={'primary'} size={'lg'}>Apply</Button>
            </div>

            <Separator className="bg-white/0" />

            <div className="flex flex-col gap-6">
              <h4 className="text-xl font-semibold">Choose payment method</h4>
              <RadioGroup defaultValue="credit-card" className="flex flex-col gap-4">
                <PaymentRadioItem
                  id="credit-card"
                  value="credit-card"
                  title="Secure checkout"
                  subtitle="Using card or crypto"
                  availableMethods="visa, amex, mastercard, crypto, tether"
                />
                <PaymentRadioItem
                  id="paypal"
                  value="paypal"
                  title="Pay with Google or Apple Pay"
                  availableMethods="apple pay, google pay"
                />
              </RadioGroup>
              <TofCheckbox id="terms" name="terms" label="Agree to our Privacy Policy and Terms and Conditions *" />
            </div>

            <Button size={'lg'} className="w-full" variant={'primary'}>Place order</Button>
            <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
              <LockIcon className="w-4 h-4" />
              All payments are secured and encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
