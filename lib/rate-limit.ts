import { headers } from "next/headers";

const attempts = new Map<string, { count: number; lastAttempt: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const MAX_TRACKED_IPS = 5000;

// Ghalat koshishein tracked IPs zyada na hon — memory safe rakho
function cleanupStale(): void {
  if (attempts.size < MAX_TRACKED_IPS) return;
  const now = Date.now();
  for (const [ip, record] of attempts) {
    if (now - record.lastAttempt > LOCKOUT_MS) attempts.delete(ip);
  }
}

export function checkRateLimit(ip: string): { allowed: boolean; remainingMs?: number } {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record) return { allowed: true };

  if (record.count >= MAX_ATTEMPTS) {
    const elapsed = now - record.lastAttempt;
    if (elapsed < LOCKOUT_MS) {
      return { allowed: false, remainingMs: LOCKOUT_MS - elapsed };
    }
    attempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string): void {
  cleanupStale();

  const now = Date.now();
  const record = attempts.get(ip);

  if (record && now - record.lastAttempt > LOCKOUT_MS) {
    attempts.delete(ip);
    attempts.set(ip, { count: 1, lastAttempt: now });
    return;
  }

  if (record) {
    record.count++;
    record.lastAttempt = now;
  } else {
    attempts.set(ip, { count: 1, lastAttempt: now });
  }
}

export function resetAttempts(ip: string): void {
  attempts.delete(ip);
}

export function isIpBlocked(ip: string): boolean {
  return !checkRateLimit(ip).allowed;
}

// Server Action mein caller ka IP nikalo (Vercel aur standard proxies dono ke liye)
export async function getRequestIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp;
  } catch {
    // headers() kisi non-request context mein fail ho sakta hai — `unknown` bucket
  }
  return "unknown";
}