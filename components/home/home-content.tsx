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
import PromoCodeCard from "@/components/custom/promo-code-card";
import { countries } from "@/lib/countries";
import IpDetectorBlock from "@/components/custom/ip-detector-block";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import InitModal from "@/components/home/init-modal";
import { PayResponse } from "@/app/api/bridger/pay/route";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUserStore } from "@/lib/user-store";
import { useShallow } from "zustand/react/shallow";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useLoginModalStore } from "@/components/custom/login-modal";
import ConfirmActionDialog from "@/components/custom/confirm-action-dialog";
import { canStackCoupons } from "@/lib/topone/coupon-stacking";
import { initBridgerPayDisclaimerListener } from "@/lib/topone/bridger-disclaimer";

declare global {
  interface Window {
    seon?: {
      init: () => void;
      getSession: () => Promise<string>;
    };
  }
}

type HomeContentProps = {
  isAuthenticated?: boolean
}

export default function HomeContent({ isAuthenticated = false }: HomeContentProps) {
  const searchParams = useSearchParams();
  const isTesting = searchParams?.get("testing") === "true";
  const openLoginModal = useLoginModalStore((state) => state.openModal)
  const [accountType, setAccountType] = useState("instant-sim-funded");
  const [accountSize, setAccountSize] = useState("50k");
  const [platform, setPlatform] = useState("tradovate-ninjatrader");
  const [quantity, setQuantity] = useState(1);
  const [quantityLimit, setQuantityLimit] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [wooProductId, setWooProductId] = useState<number | null>(null);
  const [wooVariantId, setWooVariantId] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [accountTypeOptions, setAccountTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [accountSizeOptions, setAccountSizeOptions] = useState<{ value: string; label: string }[]>([]);
  const [platformOptions, setPlatformOptions] = useState<{ value: string; label: string }[]>([]);
  const [countryCode, setCountryCode] = useState("us");
  const [phoneCode, setPhoneCode] = useState("1");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newsletter] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedCoupons, setAppliedCoupons] = useState<
    Array<{
      id: number;
      code: string;
      description?: string;
      discountAmount: number;
      discountType?: string;
      amount?: string;
      individual_use?: boolean;
      coupon_categories?: Array<{ slug: string }> | null;
      meta_data?: Array<{ key: string; value: unknown }> | null;
    }>
  >([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<{ cashierKey: string; cashierToken: string } | null>(null);
  const [seonSession, setSeonSession] = useState<string | null>(null);
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

  const isMonthlyPayment = useMemo(() => {
    return recurrence?.toLowerCase() === "monthly";
  }, [recurrence]);

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

  {/* MARK: SEON */}
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SEON_ENABLED !== "true") {
      return
    }

    const scriptId = "seon-sdk"
    const loadSeonSession = () => {
      if (!window.seon) {
        return
      }
      try {
        window.seon.init()
        window.seon.getSession().then(setSeonSession).catch(() => {})
      } catch {
        // ignore errors; keep checkout running
      }
    }

    if (document.getElementById(scriptId)) {
      loadSeonSession()
      return
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = "https://cdn.seonintelligence.com/js/v6/agent.umd.js"
    script.async = true
    script.onload = loadSeonSession
    document.body.appendChild(script)
  }, [])

  {/* MARK: User/Order details */}
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    let isMounted = true
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/users/me")
        if (!response.ok) {
          throw new Error("Failed to load profile")
        }
        const data = (await response.json()) as {
          user?: {
            email?: string
            first_name?: string
            last_name?: string
            billing?: {
              first_name?: string
              last_name?: string
              address_1?: string
              address_2?: string
              city?: string
              postcode?: string
              country?: string
              phone?: string
              email?: string
            }
          } | null
        }
        if (!isMounted || !data.user) {
          return
        }

        const billing = data.user.billing ?? {}
        const resolveName = (billingValue?: string, userValue?: string) => billingValue || userValue || ""
        const normalizedCountry = billing.country?.trim().toLowerCase() ?? ""
        const phoneValue = billing.phone?.trim() ?? ""
        const normalizedPhone = phoneValue.replace(/\D/g, "")
        const billingCountryPhoneCode = normalizedCountry
          ? countries.find((country) => country.code === normalizedCountry)?.phoneCode?.replace(/^\+/, "")
          : undefined
        const phoneCodeCandidates = [...countries]
          .map((country) => country.phoneCode?.replace(/^\+/, ""))
          .filter((code): code is string => Boolean(code))
          .sort((a, b) => b.length - a.length)
        const resolvedPhoneCode =
          (billingCountryPhoneCode && normalizedPhone.startsWith(billingCountryPhoneCode)
            ? billingCountryPhoneCode
            : phoneCodeCandidates.find((code) => normalizedPhone.startsWith(code))) ?? ""
        const resolvedPhoneNumber = resolvedPhoneCode ? normalizedPhone.slice(resolvedPhoneCode.length) : normalizedPhone

        if (billing.email || data.user.email) {
          setEmail(billing.email ?? data.user.email ?? "")
        }
        if (resolveName(billing.first_name, data.user.first_name)) {
          setFirstName(resolveName(billing.first_name, data.user.first_name))
        }
        if (resolveName(billing.last_name, data.user.last_name)) {
          setLastName(resolveName(billing.last_name, data.user.last_name))
        }
        if (billing.address_1) {
          setAddress1(billing.address_1)
        }
        if (billing.address_2) {
          setAddress2(billing.address_2)
        }
        if (billing.city) {
          setCity(billing.city)
        }
        if (billing.postcode) {
          setPostcode(billing.postcode)
        }
        if (normalizedCountry) {
          setCountryCode(normalizedCountry)
        }
        if (resolvedPhoneCode) {
          setPhoneCode(resolvedPhoneCode)
        }
        if (resolvedPhoneNumber) {
          setPhoneNumber(resolvedPhoneNumber)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (!isMounted) {
          return
        }
      }
    }

    loadProfile()
    return () => {
      isMounted = false
    }
  }, [
    address1,
    address2,
    city,
    countryCode,
    email,
    firstName,
    isAuthenticated,
    lastName,
    phoneCode,
    phoneNumber,
    postcode,
  ])

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

  /* MARK: Bridger Pay Disclaimer */
  useEffect(() => {
    if (!paymentModalOpen) {
      return
    }

    return initBridgerPayDisclaimerListener()
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

  const totalDiscountAmount = useMemo(() => {
    return appliedCoupons.reduce((sum, coupon) => sum + (coupon.discountAmount ?? 0), 0);
  }, [appliedCoupons]);

  const formattedTotalPrice = useMemo(() => {
    if (price === null) {
      return "—";
    }
    const total = Math.max(0, price * quantity - totalDiscountAmount);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(total);
  }, [price, quantity, totalDiscountAmount]);

  const formatDiscount = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const handleApplyCoupon = async (event: React.FormEvent) => {
    event.preventDefault()
    setPromoError(null);
    if (!promoCode.trim()) {
      setPromoError("Enter a promo code.");
      return;
    }
    if (appliedCoupons.length >= 2) {
      setPromoError("You can stack up to two promo codes.");
      return;
    }
    if (!email.trim()) {
      setPromoError("Enter your email before applying a promo code.");
      return;
    }
    if (!wooProductId || price === null) {
      setPromoError("Select a product before applying a promo code.");
      return;
    }

    setPromoLoading(true);
    try {
      const response = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim(),
          email,
          productId: wooProductId,
          total: Math.max(0, price * quantity - totalDiscountAmount),
        }),
      });

      const data = (await response.json()) as {
        valid?: boolean;
        reason?: string;
        discountAmount?: number;
        totalAfterDiscount?: number;
        coupon?: {
          id: number;
          code: string;
          description?: string;
          discount_type?: string;
          amount?: string;
          individual_use?: boolean;
          coupon_categories?: Array<{ slug: string }> | null;
          meta_data?: Array<{ key: string; value: unknown }> | null;
        } | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to apply promo code.");
      }

      if (!data.valid || !data.coupon || !data.discountAmount) {
        setPromoError(data.reason ?? "Promo code could not be applied.");
        return;
      }

      const stackCheck = canStackCoupons(appliedCoupons, {
        id: data.coupon.id,
        code: data.coupon.code,
        individual_use: data.coupon.individual_use,
        coupon_categories: data.coupon.coupon_categories ?? null,
        meta_data: data.coupon.meta_data ?? null,
      });

      if (!stackCheck.allowed) {
        const trimmedCode = data.coupon.code.trim().toUpperCase();
        const conflictCode = stackCheck.conflictCode?.trim().toUpperCase();
        if (conflictCode) {
          setPromoError(`Promo code ${trimmedCode} can’t be stacked with ${conflictCode}.`);
        } else {
          setPromoError(stackCheck.reason ?? "This promo code cannot be combined.");
        }
        return;
      }

      setAppliedCoupons((prev) =>
        [...prev, {
          id: data.coupon!.id,
          code: data.coupon!.code,
          description: data.coupon!.description,
          discountType: data.coupon!.discount_type,
          amount: data.coupon!.amount,
          discountAmount: data.discountAmount ?? 0,
          individual_use: data.coupon!.individual_use,
          coupon_categories: data.coupon!.coupon_categories ?? null,
          meta_data: data.coupon!.meta_data ?? null,
        }].slice(0, 2)
      );
      setPromoCode("");
    } catch (error) {
      setPromoError(error instanceof Error ? error.message : "Failed to apply promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

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

  const walletIframeSrcDoc = useMemo(() => {
    if (!paymentData) {
      return "";
    }

    return `<!DOCTYPE html>
<html>
  <head>
    <script crossorigin src='https://applepay.cdn-apple.com/jsapi/v1.3.1/apple-pay-sdk.js'></script>
  </head>
  <body>
    <script src='https://checkout.bridgerpay.com/v2/launcher'
      data-cashier-key='${paymentData.cashierKey}'
      data-cashier-token='${paymentData.cashierToken}'
      data-button-mode='wallet'
    ></script>
    <script>
      window.dispatchEvent(
        new CustomEvent('[bp][checkout:${paymentData.cashierKey}]:wallet-open-applepay-overlay')
      )
    </script>
  </body>
</html>`;
  }, [paymentData]);

  const activeIframeSrcDoc = paymentMethod === "wallet" ? walletIframeSrcDoc : iframeSrcDoc;

  const selectedCountry = useMemo(
    () => countries.find((country) => country.code === countryCode.toLowerCase()),
    [countryCode]
  );

  const phoneCodeCountry = useMemo(() => {
    if (!phoneCode) {
      return undefined;
    }
    return [...countries].reverse().find(
      (country) => country.phoneCode?.replace(/^\+/, "") === phoneCode
    );
  }, [phoneCode]);

  const handleCountryChange = (value: string) => {
    const normalizedValue = value.toLowerCase();
    setCountryCode(normalizedValue);
    const selectedPhoneCode = countries.find((country) => country.code === normalizedValue)?.phoneCode;
    if (selectedPhoneCode) {
      setPhoneCode(selectedPhoneCode.replace(/^\+/, ""));
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
    if (!state.trim()) {
      errors.state = "State / province is required.";
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
  const handleSubmit = async (skipAuthCheck = false) => {
    setSubmitError(null)
    setSubmitSuccess(null)
    if (!validateForm()) {
      return
    }

    if (!skipAuthCheck && !isAuthenticated && isMonthlyPayment) {
      openLoginModal(() => {
        handleSubmit(true)
      })
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
          state,
          postcode,
          phoneCode,
          phoneNumber,
          quantity,
          accountType,
          accountSize,
          platform,
          newsletter,
          wooProductId,
          wooVariantId,
          couponCodes: appliedCoupons.map((coupon) => coupon.code),
          seonSession,
        }),
      })

      const wooData = (await wooresponse
        .json()
        .catch(() => ({}))) as {
        error?: string
        orderId?: number
        orderIds?: number[]
        orderAccessToken?: string
      }
      if (!wooresponse.ok) {
        throw new Error(wooData.error ?? "Failed to place order.")
      }

      // Get the order ID from the response
      const orderIds = Array.isArray(wooData.orderIds) && wooData.orderIds.length
        ? wooData.orderIds
        : wooData.orderId
          ? [wooData.orderId]
          : []
      if (!orderIds.length) {
        throw new Error("Order created, but no order ID was returned.")
      }

      // Store the order ID in sessionStorage
      sessionStorage.setItem("tof_order_id", String(orderIds[0]))
      sessionStorage.setItem("tof_order_ids", JSON.stringify(orderIds))
      if (wooData.orderAccessToken) {
        sessionStorage.setItem("tof_order_access_token", wooData.orderAccessToken)
      }

      // Start payment process with Bridger Pay
      const bridgerResponse = await fetch("/api/bridger/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: String(orderIds[0]),
          orderIds,
          country: countryCode,
          quantity,
          firstName,
          lastName,
          phone: `${phoneCode}${phoneNumber}`,
          email,
          address: address1,
          address2: address2 || undefined,
          city,
          state,
          zipCode: postcode,
          wooProductId,
          wooVariantId,
          couponCodes: appliedCoupons.map((coupon) => coupon.code),
        }),
      })

      const bridgerData = (await bridgerResponse.json()) as PayResponse
      if (bridgerData.skipPayment) {
        window.location.href = "/thank-you"
        return
      }
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

        const data = (await response.json()) as {
          price: number;
          recurrence: string;
          wooProductId?: number | null;
          wooVariantId?: number | null;
          quantityLimit?: number | null;
        };
        if (isMounted) {
          setPrice(data.price);
          setRecurrence(data.recurrence);
          setWooProductId(data.wooProductId ?? null);
          setWooVariantId(data.wooVariantId ?? null);
          setQuantityLimit(data.quantityLimit ?? null);
        }
      } catch (error) {
        if (isMounted) {
          setPrice(null);
          setRecurrence(null);
          setWooProductId(null);
          setWooVariantId(null);
          setQuantityLimit(null);
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

  const handlePaymentModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setConfirmCancelOpen(true);
      setPaymentModalOpen(true);
      return;
    }

    setPaymentModalOpen(true);
  };

  useEffect(() => {
    if (!quantityLimit) {
      return;
    }
    setQuantity((current) => Math.min(current, quantityLimit));
  }, [quantityLimit]);

  useEffect(() => {
    if (!appliedCoupons.length) {
      return;
    }
    setAppliedCoupons([]);
    setPromoError(null);
  }, [accountType, accountSize, platform, quantity, price, wooProductId, email]);

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
    <div className="flex flex-col gap-10 font-sans text-white">
      {/* MARK: Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={handlePaymentModalOpenChange}>
        <DialogContent
          className="max-w-[960px] w-[96vw] p-1 bg-[#363636] rounded-2xl"
          showCloseButton
          onPointerDownOutside={(event) => {
            event.preventDefault();
            setConfirmCancelOpen(true);
          }}
        >
          <DialogTitle className="sr-only">Bridger Pay Checkout</DialogTitle>
          <div className="w-full">
            <iframe
              ref={iframeRef}
              title="Bridger Pay Checkout"
              srcDoc={activeIframeSrcDoc}
              className="w-full"
              onLoad={handleIframeLoad}
            />
          </div>
        </DialogContent>
      </Dialog>
      {/* MARK: Confirm Cancel Modal */}
      <ConfirmActionDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancel payment?"
        description="If you leave now, your payment will not be completed."
        confirmLabel="Yes, cancel payment"
        cancelLabel="Continue checkout"
        confirmVariant="destructive"
        onConfirm={() => {
          setConfirmCancelOpen(false);
          setPaymentModalOpen(false);
        }}
        onCancel={() => {
          setConfirmCancelOpen(false);
        }}
      />

      {/* MARK: Init Modal */}
      {!isAuthenticated && <InitModal defaultOpen={!isTesting} isTesting={isTesting} />}
      <div className="flex flex-col md:gap-4 gap-2">
        <h1 className="md:text-6xl text-4xl font-semibold">Checkout</h1>
        <p className="lg:text-lg md:text-base text-sm max-w-md leading-tight">
          Please fill out the information and get funded.<br />
          {!isAuthenticated &&
            <>
              Existing customer?{" "}
              <Link
                href="#"
                className="text-neon-yellow font-semibold"
                onClick={(event) => {
                  event.preventDefault()
                  openLoginModal()
                }}
                >
                Log In
              </Link>{" "}
              before you checkout.
            </>
          }
        </p>
      </div>

      <div className="flex flex-col md:flex-row xl:gap-16 md:gap-8 gap-4">
        {/* MARK: Account Information */}
        <div className="flex flex-col gap-10 w-full md:w-1/2">
          {/* Fist Column */}
          {/* #1 Confirm account information */}
          <div className="flex flex-col gap-4">
            <InstructionItem number={1} caption="Confirm trading account information" />
            <FormSection title="Account type">
              <RadioGroup value={accountType} onValueChange={setAccountType} className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2">
                {accountTypeOptions.map((option) => (
                  <TofRadioItem key={option.value} id={option.value} value={option.value} label={option.label} tag={option.value === "s2f-sim-pro" ? "Highest Payouts" : option.value === "ignite-instant" ? "Most Popular" : ""} />
                ))}
              </RadioGroup>
            </FormSection>

            <FormSection title="Account size">
              <RadioGroup value={accountSize} onValueChange={setAccountSize} className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2">
                {accountSizeOptions.map((option) => (
                  <TofRadioItem key={option.value} id={option.value} value={option.value} label={option.label} />
                ))}
              </RadioGroup>
            </FormSection>

            <FormSection title="Platform">
              <RadioGroup value={platform} onValueChange={setPlatform} className="grid grid-cols-1 lg:grid-cols-2 gap-2">
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
            <div className="grid grid-cols-10 gap-3">
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
                <CountryCombobox
                  onChange={handleCountryChange}
                  defaultValue="US"
                  controlledValue={countryCode}
                />
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
                className="col-span-5"
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
                  placeholder="State / Province"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.state)}
                />
                {fieldErrors.state && <span className="text-sm text-red-400">{fieldErrors.state}</span>}
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
                <div className="flex items-center gap-2 rounded-md border bg-input/50 border-input h-12 px-3">
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
                    className="flex-1 border-0 bg-transparent px-0 focus-visible:ring-0"
                    aria-invalid={Boolean(fieldErrors.phoneCode)}
                  />
                </div>
                {fieldErrors.phoneCode && <span className="text-sm text-red-400">{fieldErrors.phoneCode}</span>}
              </div>
              <div className="col-span-7 flex flex-col gap-2">
                <Input
                  placeholder="Phone number"
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.phoneNumber)}
                />
                {fieldErrors.phoneNumber && <span className="text-sm text-red-400">{fieldErrors.phoneNumber}</span>}
              </div>

              {/* <div className="col-span-10 py-2">
                <TofCheckbox
                  id="newsletter"
                  name="newsletter"
                  label="Keep me up to date on news and exclusive offers (optional)"
                  checked={newsletter}
                  onCheckedChange={setNewsletter}
                />
              </div> */}
            </div>
          </div>
        </div>

        {/* MARK: Order Summary */}
        <div className="flex flex-col gap-4 w-full md:w-1/2 lg:min-w-lg md:min-w-md md:shrink-0">
          {/* Second Column */}
          <div className="flex flex-col gap-4 bg-white/8 border border-white/10 rounded-2xl md:p-6 p-4">
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
                    onClick={() =>
                      setQuantity((q) => (quantityLimit ? Math.min(quantityLimit, q + 1) : q + 1))
                    }
                    disabled={quantityLimit ? quantity >= quantityLimit : false}
                    aria-label="Increase quantity"
                  >
                    <PlusIcon />
                  </Button>
                </div>
                <div className="text-sm md:text-base min-w-[72px] text-right">
                  {priceLoading ? (
                    <Skeleton className="h-4 w-[72px] bg-white/10" />
                  ) : (
                    formattedPrice
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="flex justify-between items-start py-2">
              <div>Total</div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-3">
                  {appliedCoupons.length > 0 && !priceLoading ? (
                    <div className="text-lg text-white/30 line-through">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format((price ?? 0) * quantity)}
                    </div>
                  ) : null}
                  <div className="text-neon-yellow text-3xl font-semibold leading-none">
                    {priceLoading ? (
                      <Skeleton className="h-8 w-[140px] bg-neon-yellow/10" />
                    ) : (
                      formattedTotalPrice
                    )}
                  </div>
                </div>
                <div className="text-white/50 text-sm">{recurrence ? `${recurrence}` : ""}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {appliedCoupons.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {appliedCoupons.map((coupon) => (
                    <PromoCodeCard
                      key={coupon.code}
                      code={coupon.code}
                      description={coupon.description}
                      discountLabel={formatDiscount(coupon.discountAmount)}
                      onRemove={() => {
                        setAppliedCoupons((prev) => prev.filter((item) => item.code !== coupon.code));
                      }}
                    />
                  ))}
                </div>
              ) : null}
              {appliedCoupons.length < 2 ? (
                <div className="flex flex-col gap-2">
                  <form className="flex items-center gap-2" onSubmit={handleApplyCoupon}>
                    <Input
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(event) => setPromoCode(event.target.value)}
                    />
                    <Button variant="primary" size="lg" type="submit" disabled={promoLoading}>
                      {promoLoading ? "Applying..." : "Apply"}
                    </Button>
                  </form>
                  <div className="flex justify-between items-center gap-2">
                    <div className="text-xs text-white/50">Stack up to 2 compatible promo codes.</div>
                    {promoError && <div className="text-xs text-red-400 text-right">{promoError}</div>}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-white/50">Two promo codes applied.</div>
              )}
            </div>

            <Separator className="bg-white/0" />

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6">
                <h4 className="text-xl font-semibold">Choose payment method</h4>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="flex flex-col gap-4">
                  <PaymentRadioItem
                    id="credit-card"
                    value="credit-card"
                    title="Secure checkout"
                    subtitle="Using card or crypto"
                    availableMethods="visa, amex, mastercard, crypto, tether"
                  />
                  {/* <PaymentRadioItem
                    id="wallet"
                    value="wallet"
                    title="Pay with Google or Apple Pay"
                    availableMethods="apple pay, google pay"
                  /> */}
                </RadioGroup>
              </div>

              <div className="flex flex-col gap-2">
                <TofCheckbox
                  id="terms"
                  name="terms"
                  label={
                    <span>
                      Agree to our{" "}
                      <Link href="//toponefutures.com/privacy-policy" target="_blank" className="font-semibold text-neon-green hover:text-neon-yellow">
                        Privacy Policy
                      </Link>
                      {" "}and{" "}
                      <Link href="//toponefutures.com/terms-and-conditions" target="_blank" className="font-semibold text-neon-green hover:text-neon-yellow">
                        Terms and Conditions
                      </Link>
                      *
                    </span>
                  }
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
                  onClick={() => handleSubmit()}
                >
                  {priceLoading || submitLoading ? "Loading..." : "Proceed to Payment"}
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
