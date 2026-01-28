import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";

type PaymentRadioItemProps = {
  id: string;
  value: string;
  title: string;
  subtitle?: string;
  availableMethods: string;
};

const normalizeMethod = (method: string) => method.trim().toLowerCase();

const MethodTile = ({ method }: { method: string }) => {
  const m = normalizeMethod(method);

  const logo = (() => {
    if (m === "visa") return { src: "/images/payment-methods/visa.png", w: 64, h: 40, bg: "bg-white", rounded: "rounded-md" };
    if (m === "amex" || m === "american express")
      return { src: "/images/payment-methods/amex.png", w: 64, h: 40, bg: "bg-white", rounded: "rounded-md" };
    if (m === "mastercard" || m === "master")
      return { src: "/images/payment-methods/mastercard.png", w: 64, h: 40, bg: "bg-white", rounded: "rounded-md" };
    if (m === "applepay" || m === "apple pay")
      return { src: "/images/payment-methods/ApplePay.png", w: 92, h: 40, bg: "bg-white", rounded: "rounded-md" };
    if (m === "googlepay" || m === "google pay" || m === "gpay" || m === "g pay")
      return { src: "/images/payment-methods/gpay.png", w: 92, h: 40, bg: "bg-white", rounded: "rounded-md" };
    if (m === "crypto" || m === "usdc")
      return { src: "/images/payment-methods/usdc.png", w: 40, h: 40, bg: "bg-transparent", rounded: "rounded-full" };
    if (m === "tether" || m === "usdt")
      return { src: "/images/payment-methods/usdt.png", w: 40, h: 40, bg: "bg-transparent", rounded: "rounded-full" };
    return null;
  })();

  if (logo) {
    return (
      <Image src={logo.src} alt={method.trim()} width={logo.w} height={logo.h} className="lg:h-7 md:h-5 h-7 w-auto" />
    );
  }
};

const PaymentRadioItem = ({ id, value, title, subtitle, availableMethods }: PaymentRadioItemProps) => {
  const methods = availableMethods
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  return (
    <div>
      <RadioGroupItem value={value} id={id} className="sr-only peer" />
      <label
        htmlFor={id}
        className={cn(
          "flex flex-col md:flex-row md:items-center md:justify-between md:gap-6 gap-4 rounded-2xl border md:p-6 p-5 cursor-pointer min-h-28",
          "border-white/10 bg-white/8",
          "transition-colors",
          "hover:border-white/30",
          "peer-data-[state=checked]:border-neon-green peer-data-[state=checked]:hover:border-neon-green",
          "peer-data-[state=checked]:bg-neon-green/10 peer-data-[state=checked]:hover:bg-neon-green/10",
          // Checkbox indicator
          "peer-data-[state=checked]:[&_.payment-indicator]:border-neon-green",
          "peer-data-[state=checked]:[&_.payment-indicator]:bg-neon-green/10",
          "peer-data-[state=checked]:[&_.payment-indicator]:inset-glow",
          "peer-data-[state=checked]:[&_.payment-check]:opacity-100",
        )}
      >
        <div className="flex items-center md:gap-5 gap-3">
          <div
            className={cn(
              "payment-indicator relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
              "border-white/30"
            )}
          >
            <Check className="payment-check h-4 w-4 text-white opacity-0" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="md:text-lg text-base font-semibold text-white leading-none">{title}</div>
            {subtitle ? <div className="text-sm text-white/60 leading-none">{subtitle}</div> : null}
          </div>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          {methods.map((m) => (
            <MethodTile key={m} method={m} />
          ))}
        </div>
      </label>
    </div>
  );
};

export default PaymentRadioItem;
