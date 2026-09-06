import { describe, expect, it } from "vitest";
import { formatPrice } from "./utils";

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