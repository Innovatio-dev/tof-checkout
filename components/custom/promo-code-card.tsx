import { Button } from "../ui/button";

type PromoCodeCardProps = {
  code: string;
  discountLabel: string;
  description?: string | null;
  onRemove: () => void;
};

export default function PromoCodeCard({
  code,
  discountLabel,
  description,
  onRemove,
}: PromoCodeCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neon-yellow/40 bg-neon-yellow/10 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-white/40">Promo code</div>
          <div className="flex items-center gap-8 text-sm font-bold text-neon-yellow tracking-wider uppercase">
            {code}
          </div>
          {description ? <div className="text-[11px] text-white/70">{description}</div> : null}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-white/60">Discount</div>
            <div className="text-lg font-bold text-white">-{discountLabel}</div>
          </div>
          <Button variant="outline" size="sm" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
