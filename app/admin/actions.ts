"use server";

import { redirect } from "next/navigation";
import {
  clearAdminSession,
  getAdminPassword,
  setAdminSession,
  isAdminConfigured,
} from "@/lib/admin-auth";
import {
  checkRateLimit,
  recordFailedAttempt,
  resetAttempts,
  getRequestIp,
} from "@/lib/rate-limit";

export type LoginState = { error: string | null };

export async function signIn(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const ip = await getRequestIp();
  const rateCheck = checkRateLimit(ip);

  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.remainingMs ?? 0) / 60000);
    return {
      error: `Bahut zyada ghalat koshishein. ${minutes} minute baad try karein.`,
    };
  }

  if (!isAdminConfigured()) {
    return {
      error:
        "Admin password setup nahi hai. .env.local mein ADMIN_PASSWORD add karein.",
    };
  }

  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "Password zaroori hai." };
  }

  if (password !== getAdminPassword()) {
    recordFailedAttempt(ip);
    return {
      error: "Password ghalat hai. 5 ghalat koshishein ke baad 15 minute lock.",
    };
  }

  resetAttempts(ip);
  await setAdminSession();
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}
