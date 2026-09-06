"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminReady } from "@/lib/supabase/config";

async function guard(): Promise<boolean> {
  await requireAdmin();
  return true;
}

function parseCoupon(formData: FormData) {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  const discountType = String(formData.get("discountType") ?? "percent");
  const discountValue = Number(formData.get("discountValue"));
  const minSubtotalRaw = String(formData.get("minSubtotal") ?? "").trim();
  const maxUsesRaw = String(formData.get("maxUses") ?? "").trim();
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();

  return {
    ok: Boolean(
      code &&
        (discountType === "percent" || discountType === "fixed") &&
        discountValue > 0
    ),
    values: {
      code,
      discount_type: discountType,
      discount_value: discountValue,
      min_subtotal: Math.max(0, Number(minSubtotalRaw) || 0),
      max_uses: maxUsesRaw ? Math.max(1, parseInt(maxUsesRaw, 10) || 1) : null,
      expires_at: expiresRaw ? new Date(expiresRaw).toISOString() : null,
    },
  };
}

export async function createCoupon(formData: FormData): Promise<void> {
  if (!(await guard()) || !isAdminReady()) return;

  const { ok, values } = parseCoupon(formData);
  if (!ok) return;

  const supabase = createAdminClient();
  const { error } = await supabase.from("coupons").insert({
    ...values,
    active: true,
  });
  if (error && error.code === "23505") {
    return;
  }

  revalidatePath("/admin/coupons");
}

export async function updateCoupon(formData: FormData): Promise<void> {
  if (!(await guard()) || !isAdminReady()) return;

  const originalCode = String(formData.get("originalCode") ?? "").trim();
  const { ok, values } = parseCoupon(formData);
  if (!originalCode || !ok) return;

  const supabase = createAdminClient();
  await supabase.from("coupons").update(values).eq("code", originalCode);

  revalidatePath("/admin/coupons");
}

export async function toggleCoupon(formData: FormData): Promise<void> {
  if (!(await guard()) || !isAdminReady()) return;

  const code = String(formData.get("id") ?? "").trim();
  const active = formData.get("active") === "true";
  if (!code) return;

  const supabase = createAdminClient();
  await supabase.from("coupons").update({ active: !active }).eq("code", code);

  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(formData: FormData): Promise<void> {
  if (!(await guard()) || !isAdminReady()) return;

  const code = String(formData.get("id") ?? "").trim();
  if (!code) return;

  const supabase = createAdminClient();
  await supabase.from("coupons").delete().eq("code", code);

  revalidatePath("/admin/coupons");
}