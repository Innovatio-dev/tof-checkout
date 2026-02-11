export type StackableCoupon = {
  id: number;
  code: string;
  individual_use?: boolean;
  coupon_categories?: Array<{ slug: string }> | null;
  meta_data?: Array<{ key: string; value: unknown }> | null;
};

const normalizeStringSet = (values: Array<string | number> = []) =>
  new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean));

const extractExcludedCoupons = (coupon: StackableCoupon) => {
  const metaEntries = coupon.meta_data ?? [];
  const entry = metaEntries.find((item) => item.key === "_acfw_excluded_coupons");
  if (!entry || !Array.isArray(entry.value)) {
    return { excludedCouponIds: new Set<string>(), excludedCategorySlugs: new Set<string>() };
  }

  const excludedCouponIds = new Set<string>();
  const excludedCategorySlugs = new Set<string>();
  for (const raw of entry.value) {
    const value = String(raw ?? "").trim().toLowerCase();
    if (!value) {
      continue;
    }
    if (value.startsWith("cat_")) {
      const slug = value.slice(4).trim();
      if (slug) {
        excludedCategorySlugs.add(slug);
      }
      continue;
    }
    if (/^\d+$/.test(value)) {
      excludedCouponIds.add(value);
    }
  }

  return { excludedCouponIds, excludedCategorySlugs };
};

const getCouponCategorySlugs = (coupon: StackableCoupon) =>
  normalizeStringSet((coupon.coupon_categories ?? []).map((category) => category.slug));

const hasMutuallyExclusiveCategory = (a: Set<string>, b: Set<string>) => {
  const hasAffiliate = a.has("affiliate") || b.has("affiliate");
  const hasActive = a.has("active") || b.has("active");
  return hasAffiliate && hasActive;
};

export const canStackCoupons = (existingCoupons: StackableCoupon[], nextCoupon: StackableCoupon) => {
  if (!existingCoupons.length) {
    return { allowed: true };
  }

  if (nextCoupon.individual_use) {
    return { allowed: false, reason: "This coupon cannot be combined with other offers." };
  }

  const nextExcluded = extractExcludedCoupons(nextCoupon);
  const nextCategorySlugs = getCouponCategorySlugs(nextCoupon);

  for (const existing of existingCoupons) {
    if (existing.individual_use) {
      return { allowed: false, reason: "This coupon cannot be combined with other offers.", conflictCode: existing.code };
    }

    if (existing.code.trim().toLowerCase() === nextCoupon.code.trim().toLowerCase()) {
      return { allowed: false, reason: "This promo code is already applied.", conflictCode: existing.code };
    }

    const existingExcluded = extractExcludedCoupons(existing);
    const existingCategorySlugs = getCouponCategorySlugs(existing);

    if (hasMutuallyExclusiveCategory(existingCategorySlugs, nextCategorySlugs)) {
      return {
        allowed: false,
        reason: "This promo code can’t be stacked with one already applied.",
        conflictCode: existing.code,
      };
    }

    if (existingExcluded.excludedCouponIds.has(String(nextCoupon.id))) {
      return {
        allowed: false,
        reason: "This promo code can’t be stacked with one already applied.",
        conflictCode: existing.code,
      };
    }

    if (nextExcluded.excludedCouponIds.has(String(existing.id))) {
      return {
        allowed: false,
        reason: "This promo code can’t be stacked with one already applied.",
        conflictCode: existing.code,
      };
    }

    for (const slug of existingCategorySlugs) {
      if (nextExcluded.excludedCategorySlugs.has(slug)) {
        return {
          allowed: false,
          reason: "This promo code can’t be stacked with one already applied.",
          conflictCode: existing.code,
        };
      }
    }

    for (const slug of nextCategorySlugs) {
      if (existingExcluded.excludedCategorySlugs.has(slug)) {
        return {
          allowed: false,
          reason: "This promo code can’t be stacked with one already applied.",
          conflictCode: existing.code,
        };
      }
    }
  }

  return { allowed: true };
};
