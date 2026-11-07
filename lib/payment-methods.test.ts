import { describe, expect, it } from "vitest";
import {
  MANUAL_PAYMENT_METHODS,
  getManualPaymentMethod,
  ONLINE_DISABLED_MSG,
} from "./payment-methods";

describe("payment-methods", () => {
  it("exposes COD-compatible manual methods", () => {
    const labels = MANUAL_PAYMENT_METHODS.map((m) => m.label);
    expect(labels).toContain("JazzCash");
    expect(labels).toContain("Easypaisa");
    expect(labels).toContain("Bank Transfer");
  });

  it("looks up methods by id", () => {
    const jazz = getManualPaymentMethod("jazzcash");
    expect(jazz?.label).toBe("JazzCash");
    expect(getManualPaymentMethod("nope")).toBeUndefined();
  });

  it("looks up methods by checkout label (case-insensitive)", () => {
    expect(getManualPaymentMethod("JazzCash")?.id).toBe("jazzcash");
    expect(getManualPaymentMethod("easypaisa")?.id).toBe("easypaisa");
    expect(getManualPaymentMethod("Bank Transfer")?.id).toBe("bank");
  });

  it("has account details for every method", () => {
    for (const m of MANUAL_PAYMENT_METHODS) {
      expect(m.display).toBeTruthy();
      expect(m.accountTitle).toBeTruthy();
      expect(m.instructions).toBeTruthy();
    }
  });

  it("exposes a disable notice for online methods", () => {
    expect(ONLINE_DISABLED_MSG).toContain("COD");
  });
});