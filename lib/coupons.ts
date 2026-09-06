import type { ValidatedCoupon } from "@/lib/types";

export function computeDiscount(
  coupon: ValidatedCoupon | null,
  subtotal: number
): number {
  if (!coupon) return 0;
  if (subtotal < coupon.min_subtotal) return 0;
  if (coupon.discount_type === "percent") {
    return Math.round(subtotal * (coupon.discount_value / 100));
  }
  return Math.min(coupon.discount_value, subtotal);
}

export function formatDiscount(
  coupon: ValidatedCoupon | null,
  discount: number
): string {
  if (!coupon) return "";
  if (coupon.discount_type === "percent") return `${coupon.discount_value}% OFF`;
  return `Rs. ${discount.toLocaleString("en-PK")} OFF`;
}