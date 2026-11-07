import { describe, expect, it } from "vitest";
import { formatCategoryName, formatPrice, isExpired } from "./utils";

describe("formatPrice", () => {
  it("formats PKR numbers with thousands separator", () => {
    expect(formatPrice(1500)).toBe("Rs. 1,500");
  });

  it("handles small values", () => {
    expect(formatPrice(99)).toBe("Rs. 99");
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("Rs. 0");
  });

  it("handles large numbers", () => {
    expect(formatPrice(1234567)).toBe("Rs. 1,234,567");
  });
});

describe("isExpired", () => {
  it("treats missing expiry as not expired", () => {
    expect(isExpired(null)).toBe(false);
  });

  it("detects past dates", () => {
    expect(isExpired("2000-01-01T00:00:00+00:00")).toBe(true);
  });

  it("does not flag future dates", () => {
    expect(isExpired("2999-01-01T00:00:00+00:00")).toBe(false);
  });
});

describe("formatCategoryName", () => {
  it("uses friendly label for known categories", () => {
    expect(formatCategoryName("laptop-accessories")).toBe("Laptop Accessories");
  });

  it("title-cases unknown slugs", () => {
    expect(formatCategoryName("home-decor")).toBe("Home Decor");
  });

  it("passes through single-word slugs", () => {
    expect(formatCategoryName("cosmetics")).toBe("Cosmetics");
  });
});