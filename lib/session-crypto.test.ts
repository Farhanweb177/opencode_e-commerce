import { describe, expect, it, vi } from "vitest";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_TTL_MS,
} from "./session-crypto";

const SECRET = "test-secret-123";

describe("session-crypto", () => {
  it("creates a token that verifies", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken(token, SECRET)).toBe(true);
  });

  it("rejects tokens with a different secret", async () => {
    const token = await createSessionToken(SECRET);
    expect(await verifySessionToken(token, "other-secret")).toBe(false);
  });

  it("rejects malformed tokens", async () => {
    expect(await verifySessionToken(undefined, SECRET)).toBe(false);
    expect(await verifySessionToken("", SECRET)).toBe(false);
    expect(await verifySessionToken("garbage", SECRET)).toBe(false);
    expect(await verifySessionToken("v1.abc.def", SECRET)).toBe(false);
  });

  it("rejects tampered issued-at", async () => {
    const token = await createSessionToken(SECRET);
    const [, , sig] = token.split(".");
    expect(await verifySessionToken(`v2.${Date.now()}.${sig}`, SECRET)).toBe(false);
    expect(await verifySessionToken(`v1.abc.${sig}`, SECRET)).toBe(false);
  });

  it("rejects invalid base64 signatures without throwing", async () => {
    expect(await verifySessionToken(`v1.${Date.now()}.!!!!`, SECRET)).toBe(false);
    expect(await verifySessionToken("v1.123.%", SECRET)).toBe(false);
  });

  it("rejects expired tokens", async () => {
    vi.useFakeTimers();
    const token = await createSessionToken(SECRET);
    vi.setSystemTime(Date.now() + SESSION_TTL_MS + 1000);
    expect(await verifySessionToken(token, SECRET)).toBe(false);
    vi.useRealTimers();
  });
});