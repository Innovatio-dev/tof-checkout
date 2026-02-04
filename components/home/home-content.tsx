"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRightIcon, LockIcon, MinusIcon, PlusIcon } from "lucide-react";

import InstructionItem from "@/components/custom/instruction-item";
import TofRadioItem from "@/components/custom/tof-radio-item";
import PaymentRadioItem from "@/components/custom/payment-radio-item";
import { RadioGroup } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import FormSection from "@/components/custom/form-section";
import TofCheckbox from "@/components/custom/tof-checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CountryCombobox from "@/components/custom/country-combobox";
import SnappFlag from "@/components/custom/snapp-flag";
import { countries } from "@/lib/countries";
import IpDetectorBlock from "@/components/custom/ip-detector-block";
import { Spinner } from "@/components/ui/spinner";
import InitModal from "@/components/home/init-modal";
import { PayResponse } from "@/app/api/bridger/pay/route";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUserStore } from "@/lib/user-store";
import { useShallow } from "zustand/react/shallow";

export default function HomeContent() {
  const searchParams = useSearchParams();
  const isTesting = searchParams?.get("testing") === "true";
  const [accountType, setAccountType] = useState("instant-sim-funded");
  const [accountSize, setAccountSize] = useState("50k");
  const [platform, setPlatform] = useState("tradovate-ninjatrader");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<number | null>(null);
  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [accountTypeOptions, setAccountTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [accountSizeOptions, setAccountSizeOptions] = useState<{ value: string; label: string }[]>([]);
  const [platformOptions, setPlatformOptions] = useState<{ value: string; label: string }[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<{ cashierKey: string; cashierToken: string } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { email: storedEmail, firstName: storedFirstName, lastName: storedLastName } = useUserStore(
    useShallow((state) => ({
      email: state.email,
      firstName: state.firstName,
      lastName: state.lastName,
    }))
  );

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

  useEffect(() => {
    if (storedEmail && !email) {
      setEmail(storedEmail)
    }
    if (storedFirstName && !firstName) {
      setFirstName(storedFirstName)
    }
    if (storedLastName && !lastName) {
      setLastName(storedLastName)
    }
  }, [email, firstName, lastName, storedEmail, storedFirstName, storedLastName])

  useEffect(() => {
    if (!paymentModalOpen) {
      return
    }

    const scriptId = "bridger-iframe-resizer"
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script")
      script.id = scriptId
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.min.js"
      script.integrity = "sha512-+bpyZqiNr/4QlUd6YnrAeLXzgooA1HKN5yUagHgPSMACPZgj8bkpCyZezPtDy5XbviRm4w8Z1RhfuWyoWaeCyg=="
      script.crossOrigin = "anonymous"
      script.referrerPolicy = "no-referrer"
      document.body.appendChild(script)
    }
  }, [paymentModalOpen])

  const handleIframeLoad = () => {
    const iframe = iframeRef.current
    if (!iframe) {
      return
    }

    const resize = (window as Window & { iFrameResize?: (options: { checkOrigin: boolean }, target: string | HTMLElement) => void })
      .iFrameResize

    resize?.({ checkOrigin: false }, iframe)
  }

  const formattedTotalPrice = useMemo(() => {
    if (price === null) {
      return "—";
    }
    const total = price * quantity;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(total);
  }, [price, quantity]);

  /* MARK: Payment Iframe */
  const iframeSrcDoc = useMemo(() => {
    if (!paymentData) {
      return "";
    }

    return `<!DOCTYPE html>
<html>
  <head>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.9/iframeResizer.contentWindow.min.js' integrity='sha512-mdT/HQRzoRP4laVz49Mndx6rcCGA3IhuyhP3gaY0E9sZPkwbtDk9ttQIq9o8qGCf5VvJv1Xsy3k2yTjfUoczqw==' crossorigin='anonymous' referrerpolicy='no-referrer'></script>
    <style>html,body{margin:0;padding:0;background:transparent}</style>
  </head>
  <body>
    <script src='https://checkout.bridgerpay.com/v2/launcher'
      data-cashier-key='${paymentData.cashierKey}'
      data-cashier-token='${paymentData.cashierToken}'
    ></script>
    <script>
      window.addEventListener('[bp]:redirect', ({ detail: { url } }) => window.top.location.href = url)
    </script>
  </body>
</html>`;
  }, [paymentData]);

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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Enter a valid email address.";
    }
    if (!firstName.trim()) {
      errors.firstName = "First name is required.";
    }
    if (!lastName.trim()) {
      errors.lastName = "Last name is required.";
    }
    if (!countryCode.trim()) {
      errors.countryCode = "Country is required.";
    }
    if (!address1.trim()) {
      errors.address1 = "Street address is required.";
    }
    if (!city.trim()) {
      errors.city = "City is required.";
    }
    if (!postcode.trim()) {
      errors.postcode = "Postcode is required.";
    }
    if (!phoneCode.trim()) {
      errors.phoneCode = "Phone code is required.";
    }
    if (!phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required.";
    }
    if (!termsAccepted) {
      errors.terms = "You must accept the terms to place your order.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* MARK: Submit function */
  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitSuccess(null)
    if (!validateForm()) {
      return
    }

    setSubmitLoading(true)
    try {
      // Create an order in the database of WooCommerce
      const wooresponse = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          countryCode,
          address1,
          address2,
          city,
          postcode,
          phoneCode,
          phoneNumber,
          quantity,
          accountType,
          accountSize,
          platform,
          newsletter,
        }),
      })

      if (!wooresponse.ok) {
        const data = (await wooresponse.json()) as { error?: string }
        throw new Error(data.error ?? "Failed to place order.")
      }

      // Get the order ID from the response
      const wooData = (await wooresponse.json()) as { orderId?: number }
      if (!wooData.orderId) {
        throw new Error("Order created, but no order ID was returned.")
      }

      // Store the order ID in sessionStorage
      sessionStorage.setItem("tof_order_id", String(wooData.orderId))

      // Start payment process with Bridger Pay
      const bridgerResponse = await fetch("/api/bridger/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: String(wooData.orderId),
          currency: "USD",
          country: countryCode,
          amount: (price ?? 0),
          quantity,
          firstName,
          lastName,
          phone: `${phoneCode}${phoneNumber}`,
          email,
          address: address1,
          address2: address2 || undefined,
          city,
          state: "",
          zipCode: postcode,
        }),
      })

      const bridgerData = (await bridgerResponse.json()) as PayResponse
      if (!bridgerData.cashierKey || !bridgerData.cashierToken) {
        throw new Error("Failed to start payment process.")
      }

      const { cashierKey, cashierToken } = bridgerData
      setPaymentData({ cashierKey, cashierToken })
      setPaymentModalOpen(true)

      // Redirect to the payment page
      // window.location.href = "/thank-you"
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to place order.")
    } finally {
      setSubmitLoading(false)
    }
  }

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

        const data = (await response.json()) as { price: number; recurrence: string };
        if (isMounted) {
          setPrice(data.price);
          setRecurrence(data.recurrence);
        }
      } catch (error) {
        if (isMounted) {
          setPrice(null);
          setRecurrence(null);
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
      {/* MARK: Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-[960px] w-[96vw] p-1 bg-[#363636] rounded-2xl" showCloseButton={false}>
          <div className="w-full">
            <iframe
              ref={iframeRef}
              title="Bridger Pay Checkout"
              srcDoc={iframeSrcDoc}
              className="w-full"
              onLoad={handleIframeLoad}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* MARK: Init Modal */}
      <InitModal defaultOpen={!isTesting} isTesting={isTesting} />
      <div>
        <h1 className="text-6xl font-semibold">Checkout</h1>
        <p className="text-lg max-w-md">
          Please fill out the information and get funded. Existing customer?{" "}
          <Link href="#" className="text-neon-yellow font-semibold">
            Log In
          </Link>{" "}
          before you checkout.
        </p>
      </div>

      <div className="flex flex-col md:flex-row xl:gap-16 md:gap-8 gap-4">
        {/* MARK: Account Information */}
        <div className="flex flex-col gap-16 w-full md:w-1/2">
          {/* Fist Column */}
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
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && <span className="text-sm text-red-400">{fieldErrors.email}</span>}
            </div>
          </div>

          {/* #3 Billing details */}
          <div className="flex flex-col gap-4">
            <InstructionItem number={3} caption="Billing details" />
            <div className="grid grid-cols-10 gap-4">
              <div className="col-span-6 flex flex-col gap-2">
                <Input
                  placeholder="First name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.firstName)}
                />
                {fieldErrors.firstName && <span className="text-sm text-red-400">{fieldErrors.firstName}</span>}
              </div>
              <div className="col-span-4 flex flex-col gap-2">
                <Input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.lastName)}
                />
                {fieldErrors.lastName && <span className="text-sm text-red-400">{fieldErrors.lastName}</span>}
              </div>

              <div className="col-span-10 flex flex-col gap-2">
                <CountryCombobox onChange={handleCountryChange} />
                {fieldErrors.countryCode && <span className="text-sm text-red-400">{fieldErrors.countryCode}</span>}
              </div>
              <div className="col-span-10 flex flex-col gap-2">
                <Input
                  placeholder="House number and street name"
                  value={address1}
                  onChange={(event) => setAddress1(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.address1)}
                />
                {fieldErrors.address1 && <span className="text-sm text-red-400">{fieldErrors.address1}</span>}
              </div>
              <Input
                placeholder="Apartment, suite, etc. (optional)"
                className="col-span-10"
                value={address2}
                onChange={(event) => setAddress2(event.target.value)}
              />
              <div className="col-span-5 flex flex-col gap-2">
                <Input
                  placeholder="City"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.city)}
                />
                {fieldErrors.city && <span className="text-sm text-red-400">{fieldErrors.city}</span>}
              </div>
              <div className="col-span-5 flex flex-col gap-2">
                <Input
                  placeholder="Postcode / ZIP"
                  value={postcode}
                  onChange={(event) => setPostcode(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.postcode)}
                />
                {fieldErrors.postcode && <span className="text-sm text-red-400">{fieldErrors.postcode}</span>}
              </div>

              <div className="col-span-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-md border bg-input/50 border-input h-10 px-3">
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
                    aria-invalid={Boolean(fieldErrors.phoneCode)}
                  />
                </div>
                {fieldErrors.phoneCode && <span className="text-sm text-red-400">{fieldErrors.phoneCode}</span>}
              </div>
              <div className="col-span-7 flex flex-col gap-2">
                <Input
                  placeholder="Phone number"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.phoneNumber)}
                />
                {fieldErrors.phoneNumber && <span className="text-sm text-red-400">{fieldErrors.phoneNumber}</span>}
              </div>

              <div className="col-span-10 py-2">
                <TofCheckbox
                  id="newsletter"
                  name="newsletter"
                  label="Keep me up to date on news and exclusive offers (optional)"
                  checked={newsletter}
                  onCheckedChange={setNewsletter}
                />
              </div>
            </div>
          </div>
        </div>

        {/* MARK: Order Summary */}
        <div className="flex flex-col gap-8 w-full md:w-1/2 lg:min-w-lg md:min-w-md md:shrink-0">
          {/* Second Column */}
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
              <div className="text-sm md:text-base">Account ({accountSizeLabel})</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon />
                  </Button>
                  <span className="md:min-w-6 min-w-4 text-center font-bold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                  >
                    <PlusIcon />
                  </Button>
                </div>
                <div className="text-sm md:text-base min-w-[72px] text-right">{formattedPrice}</div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="flex justify-between items-start py-2">
              <div>Total</div>
              <div className="flex flex-col items-end">
                <div className="text-neon-yellow text-3xl font-semibold leading-none">
                  {formattedTotalPrice}
                </div>
                <div className="text-white/50 text-sm">{recurrence ? `${recurrence}` : ""}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input placeholder="Enter promo code" />
              <Button variant="primary" size="lg">
                Apply
              </Button>
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

              <div className="flex flex-col gap-2">
                <TofCheckbox
                  id="terms"
                  name="terms"
                  label="Agree to our Privacy Policy and Terms and Conditions*"
                  checked={termsAccepted}
                  onCheckedChange={setTermsAccepted}
                />
                {fieldErrors.terms && <span className="text-sm text-red-400">{fieldErrors.terms}</span>}
              </div>

              <div className="flex flex-col gap-4">
                <Button
                  size="lg"
                  className="w-full font-bold h-12 white-glow"
                  variant="primary"
                  disabled={priceLoading || submitLoading}
                  onClick={handleSubmit}
                >
                  {priceLoading || submitLoading ? "Loading..." : "Place order"}
                  {priceLoading || submitLoading ? (
                    <Spinner />
                  ) : (
                    <span className="bg-black text-white py-[2px] px-3 rounded-full">
                      <ArrowRightIcon className="tof-arrow-float-x -translate-y-px" />
                    </span>
                  )}
                </Button>
                {submitError && <span className="text-sm text-red-400">{submitError}</span>}
                {submitSuccess && <span className="text-sm text-green-400">{submitSuccess}</span>}
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
