import { describe, expect, it } from "vitest";
import type { ValidatedCoupon } from "./types";
import { computeDiscount, formatDiscount } from "./coupons";

const percentCoupon: ValidatedCoupon = {
  code: "WELCOME10",
  discount_type: "percent",
  discount_value: 10,
  min_subtotal: 0,
};

const fixedCoupon: ValidatedCoupon = {
  code: "FLAT150",
  discount_type: "fixed",
  discount_value: 150,
  min_subtotal: 1000,
};

describe("computeDiscount", () => {
  it("returns 0 without a coupon", () => {
    expect(computeDiscount(null, 2000)).toBe(0);
  });

  it("applies percent discount", () => {
    expect(computeDiscount(percentCoupon, 2000)).toBe(200);
  });

  it("rounds percent discount", () => {
    expect(computeDiscount(percentCoupon, 99)).toBe(10);
  });

  it("applies fixed discount", () => {
    expect(computeDiscount(fixedCoupon, 2500)).toBe(150);
  });

  it("caps fixed discount at subtotal", () => {
    const tinyOrder: ValidatedCoupon = {
      code: "FLAT150",
      discount_type: "fixed",
      discount_value: 150,
      min_subtotal: 0,
    };
    expect(computeDiscount(tinyOrder, 100)).toBe(100);
  });

  it("returns 0 when subtotal is below min_subtotal", () => {
    expect(computeDiscount(fixedCoupon, 500)).toBe(0);
  });
});

describe("formatDiscount", () => {
  it("formats percent coupons", () => {
    expect(formatDiscount(percentCoupon, 200)).toBe("10% OFF");
  });

  it("formats fixed coupons", () => {
    expect(formatDiscount(fixedCoupon, 150)).toBe("Rs. 150 OFF");
  });

  it("returns empty string without coupon", () => {
    expect(formatDiscount(null, 0)).toBe("");
  });
});