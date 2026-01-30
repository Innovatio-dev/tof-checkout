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
import { ArrowRightIcon, Lock, LockIcon, LockKeyholeIcon, MinusIcon, PlusIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useEffect, useMemo, useState } from "react";
import CountryCombobox from "@/components/custom/country-combobox";
import Link from "next/link";
import SnappFlag from "@/components/custom/snapp-flag";
import { countries } from "@/lib/countries";
import IpDetectorBlock from "@/components/custom/ip-detector-block";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const [accountType, setAccountType] = useState("instant-sim-funded");
  const [accountSize, setAccountSize] = useState("50k");
  const [platform, setPlatform] = useState("tradovate-ninjatrader");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [accountTypeOptions, setAccountTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [accountSizeOptions, setAccountSizeOptions] = useState<{ value: string; label: string }[]>([]);
  const [platformOptions, setPlatformOptions] = useState<{ value: string; label: string }[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  const accountTypeLabel = useMemo(() => {
    return accountTypeOptions.find((option) => option.value === accountType)?.label ?? accountType;
  }, [accountType, accountTypeOptions]);

  const accountSizeLabel = useMemo(() => {
    return accountSizeOptions.find((option) => option.value === accountSize)?.label ?? accountSize;
  }, [accountSize, accountSizeOptions]);

  const platformLabel = useMemo(() => {
    return platformOptions.find((option) => option.value === platform)?.label ?? platform;
  }, [platform, platformOptions]);

  const formattedPrice = useMemo(() => {
    if (price === null) {
      return "—";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  }, [price]);

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === countryCode),
    [countryCode]
  );

  const phoneCodeCountry = useMemo(() => {
    if (!phoneCode) {
      return undefined;
    }
    return countries.reverse().find(
      (country) => country.phoneCode?.replace(/^\+/, "") === phoneCode
    );
  }, [phoneCode]);

  const handleCountryChange = (value: string) => {
    setCountryCode(value);
    if (!phoneCode) {
      const selectedPhoneCode = countries.find((country) => country.code === value)?.phoneCode;
      if (selectedPhoneCode) {
        setPhoneCode(selectedPhoneCode.replace(/^\+/, ""));
      }
    }
  };

  const handlePhoneCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "");
    setPhoneCode(digits);
    if (digits) {
      setCountryCode("");
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadPrice = async () => {
      setPriceLoading(true);
      try {
        const response = await fetch("/api/price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountType, accountSize, platform }),
        });

        if (!response.ok) {
          // If price is not found, return
          if (response.status === 404) {
            return;
          }
          throw new Error("Failed to load price");
        }

        const data = (await response.json()) as { price: number };
        if (isMounted) {
          setPrice(data.price);
        }
      } catch (error) {
        if (isMounted) {
          setPrice(null);
        }
        console.error(error);
      } finally {
        if (isMounted) {
          setPriceLoading(false);
        }
      }
    };

    loadPrice();
    return () => {
      isMounted = false;
    };
  }, [accountType, accountSize, platform]);

  useEffect(() => {
    let isMounted = true;
    const loadOptions = async () => {
      try {
        const response = await fetch(`/api/price?accountType=${accountType}`);
        if (!response.ok) {
          throw new Error("Failed to load options");
        }
        const data = (await response.json()) as {
          accountTypes: { value: string; label: string }[];
          accountSizes: { value: string; label: string }[];
          platforms: { value: string; label: string }[];
        };
        if (isMounted) {
          setAccountTypeOptions(data.accountTypes);
          setAccountSizeOptions(data.accountSizes);
          setPlatformOptions(data.platforms);

          if (data.accountSizes.length && !data.accountSizes.some((option) => option.value === accountSize)) {
            setAccountSize(data.accountSizes[0].value);
          }
          if (data.platforms.length && !data.platforms.some((option) => option.value === platform)) {
            setPlatform(data.platforms[0].value);
          }
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadOptions();
    return () => {
      isMounted = false;
    };
  }, [accountType, accountSize, platform]);

  return (
    <div className="flex flex-col gap-16 font-sans text-white">
      <div>
        <h1 className="text-6xl font-semibold">Checkout</h1>
        <p className="text-lg max-w-md">Please fill out the information and get funded. Existing customer? <Link href="#" className="text-neon-yellow font-semibold">Log In</Link> before you checkout.</p>
      </div>

      <div className="flex flex-col md:flex-row xl:gap-16 md:gap-8 gap-4">
        {/* MARK: Account Information */}
        <div className="flex flex-col gap-16 w-full md:w-1/2"> {/* Fist Column */}
          {/* #1 Confirm account information */}
          <div className="flex flex-col gap-4">
            <InstructionItem number={1} caption="Confirm trading account information" />
            <FormSection title="Account type">
              <RadioGroup value={accountType} onValueChange={setAccountType} className="grid grid-cols-2 gap-3">
                {accountTypeOptions.map((option) => (
                  <TofRadioItem key={option.value} id={option.value} value={option.value} label={option.label} />
                ))}
              </RadioGroup>
            </FormSection>

            <FormSection title="Account size">
              <RadioGroup value={accountSize} onValueChange={setAccountSize} className="grid grid-cols-2 gap-3">
                {accountSizeOptions.map((option) => (
                  <TofRadioItem key={option.value} id={option.value} value={option.value} label={option.label} />
                ))}
              </RadioGroup>
            </FormSection>

            <FormSection title="Platform">
              <RadioGroup value={platform} onValueChange={setPlatform} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {platformOptions.map((option) => (
                  <TofRadioItem key={option.value} id={option.value} value={option.value} label={option.label} />
                ))}
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

              <div className="col-span-10">
                <CountryCombobox onChange={handleCountryChange} />
              </div>
              <Input placeholder="House number and street name" className="col-span-10" />
              <Input placeholder="Apartment, suite, etc. (optional)" className="col-span-10" />
              <Input placeholder="City" className="col-span-5" />
              <Input placeholder="Postcode / ZIP" className="col-span-5" />

              <div className="col-span-3 flex items-center gap-2 rounded-md border bg-input/50 border-input h-10 px-3">
                {phoneCodeCountry || selectedCountry ? (
                  <SnappFlag code={(phoneCodeCountry ?? selectedCountry)!.code} size="s" className="shrink-0" />
                ) : (
                  <span className="h-5 w-6 rounded-[4px] border border-white/10" />
                )}
                <Input
                  placeholder="Phone code"
                  value={phoneCode ? `+${phoneCode}` : ""}
                  onChange={handlePhoneCodeChange}
                  inputMode="numeric"
                  pattern="\d*"
                  className="h-11 flex-1 border-0 bg-transparent px-0 focus-visible:ring-0"
                />
              </div>
              <Input placeholder="Phone number" className="col-span-7" />

              <div className="col-span-10 py-2">
                <TofCheckbox id="newsletter" name="newsletter" label="Keep me up to date on news and exclusive offers (optional)" />
              </div>
            </div>
          </div>
        </div>

        {/* MARK: Order Summary */}
        <div className="flex flex-col gap-8 w-full md:w-1/2 lg:min-w-lg md:min-w-md md:shrink-0"> {/* Second Column */}
          <div className="flex flex-col gap-4 bg-white/8 border border-white/10 rounded-2xl p-6">
            <h4 className="text-xl font-semibold">Top One Futures Account</h4>
            <div className="flex flex-wrap gap-2 text-xs min-h-[60px]">
              <span className="flex h-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-white/80">
                <span className="text-white/50">Type</span>
                <span className="text-white">{accountTypeLabel}</span>
              </span>
              <span className="flex h-fit items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-white/80">
                <span className="text-white/50">Size</span>
                <span className="text-white">{accountSizeLabel}</span>
              </span>
              <span className="flex h-fit items-center gap-2 rounded-full border border-neon-yellow/20 bg-white/8 px-3 py-1 text-white/80">
                <span className="text-white/50">Platform</span>
                <span className="text-neon-yellow">{platformLabel}</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-2 select-none">
              <div className="text-sm md:text-base">
                Account ({accountSizeLabel})
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={'outline'}
                    size={'icon'}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon />
                  </Button>
                  <span className="md:min-w-6 min-w-4 text-center font-bold">{quantity}</span>
                  <Button
                    variant={'outline'}
                    size={'icon'}
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                  >
                    <PlusIcon />
                  </Button>
                </div>
                <div className="text-sm md:text-base min-w-[72px] text-right">
                  {formattedPrice}
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="flex justify-between items-start py-2">
              <div>Total</div>
              <div className="text-neon-yellow text-3xl font-semibold">
                {formattedPrice}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input placeholder="Enter promo code" />
              <Button variant={'primary'} size={'lg'}>Apply</Button>
            </div>

            <Separator className="bg-white/0" />

            <div className="flex flex-col gap-10">
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
              </div>

              <TofCheckbox id="terms" name="terms" label="Agree to our Privacy Policy and Terms and Conditions*" />

              <div className="flex flex-col gap-4">
                <Button size={'lg'} className="w-full font-bold h-12" variant={'primary'} disabled={priceLoading}>
                  { priceLoading ? "Loading..." : "Place order"}
                  { priceLoading ? <Spinner /> : <span className="bg-black text-white py-1 px-3 rounded-full">
                    <ArrowRightIcon className="tof-arrow-float-x -translate-y-px" />
                  </span>}
                </Button>
                <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
                  <LockIcon className="w-4 h-4" />
                  All payments are secured and encrypted
                </div>
              </div>
            </div>
          </div>
          {/* MARK: IP Detection */}
          <IpDetectorBlock />
        </div>
      </div>
    </div>
  );
}
