import "server-only";

import { getCouponByCode, type WooCouponDetail } from "@/lib/woocommerce";

export type CouponValidationInput = {
  code: string;
  email: string;
  productId: number;
  total: number;
};

export type CouponValidationResult = {
  valid: boolean;
  reason?: string;
  coupon: WooCouponDetail | null;
  discountAmount: number;
  totalAfterDiscount: number;
};

const toNumber = (value?: string | number | null) => {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const validateCoupon = async ({
  code,
  email,
  productId,
  total,
}: CouponValidationInput): Promise<CouponValidationResult> => {
  const normalizedCode = code.trim();
  if (!normalizedCode) {
    return {
      valid: false,
      reason: "Coupon code is required.",
      coupon: null,
      discountAmount: 0,
      totalAfterDiscount: total,
    };
  }

  const coupon = await getCouponByCode(normalizedCode);
  if (!coupon) {
    return {
      valid: false,
      reason: "Coupon not found.",
      coupon: null,
      discountAmount: 0,
      totalAfterDiscount: total,
    };
  }

  if (coupon.status && coupon.status !== "publish") {
    return {
      valid: false,
      reason: "Coupon is not active.",
      coupon,
      discountAmount: 0,
      totalAfterDiscount: total,
    };
  }

  if (coupon.date_expires_gmt) {
    const expiresAt = new Date(coupon.date_expires_gmt).getTime();
    if (Number.isFinite(expiresAt) && Date.now() > expiresAt) {
      return {
        valid: false,
        reason: "Coupon has expired.",
        coupon,
        discountAmount: 0,
        totalAfterDiscount: total,
      };
    }
  }

  if (coupon.product_ids?.length && !coupon.product_ids.includes(productId)) {
    return {
      valid: false,
      reason: "Coupon is not valid for the selected product.",
      coupon,
      discountAmount: 0,
      totalAfterDiscount: total,
    };
  }

  if (coupon.excluded_product_ids?.length && coupon.excluded_product_ids.includes(productId)) {
    return {
      valid: false,
      reason: "Coupon is not valid for the selected product.",
      coupon,
      discountAmount: 0,
      totalAfterDiscount: total,
    };
  }

  if (coupon.usage_limit && coupon.usage_limit > 0) {
    const usageCount = coupon.usage_count ?? 0;
    if (usageCount >= coupon.usage_limit) {
      return {
        valid: false,
        reason: "Coupon usage limit reached.",
        coupon,
        discountAmount: 0,
        totalAfterDiscount: total,
      };
    }
  }

  if (coupon.email_restrictions?.length) {
    const normalizedEmail = email.trim().toLowerCase();
    const allowedEmails = coupon.email_restrictions.map((entry) => entry.toLowerCase());
    if (!allowedEmails.includes(normalizedEmail)) {
      return {
        valid: false,
        reason: "Coupon is not valid for this email.",
        coupon,
        discountAmount: 0,
        totalAfterDiscount: total,
      };
    }
  }

  const minAmount = toNumber(coupon.minimum_amount);
  const maxAmount = toNumber(coupon.maximum_amount);
  if (minAmount > 0 && total < minAmount) {
    return {
      valid: false,
      reason: "Order total does not meet the minimum amount.",
      coupon,
      discountAmount: 0,
      totalAfterDiscount: total,
    };
  }
  if (maxAmount > 0 && total > maxAmount) {
    return {
      valid: false,
      reason: "Order total exceeds the maximum amount.",
      coupon,
      discountAmount: 0,
      totalAfterDiscount: total,
    };
  }

  const amountValue = toNumber(coupon.amount);
  const rawDiscount = coupon.discount_type === "percent" ? (total * amountValue) / 100 : amountValue;
  const discountAmount = Math.min(total, Math.max(0, rawDiscount));
  const totalAfterDiscount = Math.max(0, total - discountAmount);

  return {
    valid: true,
    coupon,
    discountAmount,
    totalAfterDiscount,
  };
};
