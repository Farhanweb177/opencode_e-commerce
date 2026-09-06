import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_TTL_MS,
} from "./session-crypto";

const SESSION_COOKIE = "admin_session";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

// Session signing secret — dedicated value use karein. Nahin to ADMIN_PASSWORD
// fallback hota hai taake naya setup bina extra env ke kaam kare.
export function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || getAdminPassword();
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminPassword()) && Boolean(process.env.DATABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export async function getAdminUser(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const valid = await verifySessionToken(token, getSessionSecret());
  if (!valid) return null;

  return { email: process.env.ADMIN_EMAIL ?? "admin" };
}

export async function requireAdmin(): Promise<{ email: string }> {
  const user = await getAdminUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}

export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = await createSessionToken(getSessionSecret());
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000), // 7 din
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}