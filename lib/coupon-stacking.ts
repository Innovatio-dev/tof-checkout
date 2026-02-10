export type StackableCoupon = {
  code: string;
  individual_use?: boolean;
  product_categories?: number[] | null;
  excluded_product_categories?: number[] | null;
  excluded_coupons_categories_ids?: number[] | null;
};

const normalizeIds = (values?: number[] | null) => (values ?? []).filter((value) => Number.isFinite(value));

const hasCategoryOverlap = (source?: number[] | null, target?: number[] | null) => {
  const sourceIds = normalizeIds(source);
  const targetIds = new Set(normalizeIds(target));
  return sourceIds.some((id) => targetIds.has(id));
};

export const canStackCoupons = (existingCoupons: StackableCoupon[], nextCoupon: StackableCoupon) => {
  if (!existingCoupons.length) {
    return { allowed: true };
  }

  if (nextCoupon.individual_use) {
    return { allowed: false, reason: "This coupon cannot be combined with other offers." };
  }

  const nextExcludedCategories =
    nextCoupon.excluded_coupons_categories_ids ?? nextCoupon.excluded_product_categories ?? null;

  for (const existing of existingCoupons) {
    if (existing.individual_use) {
      return { allowed: false, reason: "This coupon cannot be combined with other offers." };
    }

    if (existing.code.trim().toLowerCase() === nextCoupon.code.trim().toLowerCase()) {
      return { allowed: false, reason: "This promo code is already applied." };
    }

    const existingExcludedCategories =
      existing.excluded_coupons_categories_ids ?? existing.excluded_product_categories ?? null;

    if (hasCategoryOverlap(existing.product_categories, nextExcludedCategories)) {
      return { allowed: false, reason: "This promo code can’t be stacked with one already applied." };
    }

    if (hasCategoryOverlap(nextCoupon.product_categories, existingExcludedCategories)) {
      return { allowed: false, reason: "This promo code can’t be stacked with one already applied." };
    }
  }

  return { allowed: true };
};
