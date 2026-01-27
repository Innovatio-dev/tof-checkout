import Image from "next/image";
import InstructionItem from "@/components/custom/instruction-item";
import TofRadioItem from "@/components/custom/tof-radio-item";
import { RadioGroup } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import FormSection from "@/components/custom/form-section";
import TofCheckbox from "@/components/custom/tof-checkbox";

export default function Home() {
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
              <RadioGroup defaultValue="instant-sim-funded" className="grid grid-cols-2 gap-3">
                <TofRadioItem id="one-step-elite" value="one-step-elite" label="1- Step ELITE Challenge"/>
                <TofRadioItem id="instant-sim-funded" value="instant-sim-funded" label="INSTANT Sim Funded"/>
                <TofRadioItem id="s2f-sim-pro" value="s2f-sim-pro" label="S2F Sim PRO"/>
                <TofRadioItem id="ignite-instant" value="ignite-instant" label="IGNITE Instant Funding"/>
              </RadioGroup>
            </FormSection>

            <FormSection title="Account size">
              <RadioGroup defaultValue="50k" className="grid grid-cols-2 gap-3">
                <TofRadioItem id="25k" value="25k" label="$25,000"/>
                <TofRadioItem id="50k" value="50k" label="$50,000"/>
                <TofRadioItem id="100k" value="100k" label="$100,000"/>
                <TofRadioItem id="250k" value="250k" label="$250,000"/>
              </RadioGroup>
            </FormSection>

            <FormSection title="Platform">
              <RadioGroup defaultValue="tradovate-ninjatrader" className="grid grid-cols-2 gap-3">
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
          <div className="bg-white/8 border border-white/10 rounded-lg p-6">
            <h4 className="text-lg">Top One Futures Account</h4>
          </div>
        </div>
      </div>
    </div>
  );
}
