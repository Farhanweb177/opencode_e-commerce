"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminReady } from "@/lib/supabase/config";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const VALID_PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "received",
  "failed",
];

async function guard(): Promise<boolean> {
  await requireAdmin();
  return true;
}

export async function updateOrderStatus(formData: FormData): Promise<void> {
  if (!(await guard()) || !isAdminReady()) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!id || !VALID_STATUSES.includes(status)) return;

  const supabase = createAdminClient();
  await supabase.from("orders").update({ status }).eq("id", id);

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function updatePaymentStatus(formData: FormData): Promise<void> {
  if (!(await guard()) || !isAdminReady()) return;

  const id = String(formData.get("id") ?? "");
  const paymentStatus = String(formData.get("paymentStatus") ?? "") as PaymentStatus;
  if (!id || !VALID_PAYMENT_STATUSES.includes(paymentStatus)) return;

  const supabase = createAdminClient();
  await supabase
    .from("orders")
    .update({ payment_status: paymentStatus })
    .eq("id", id);

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function deleteOrder(formData: FormData): Promise<void> {
  if (!(await guard()) || !isAdminReady()) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createAdminClient();
  await supabase.from("orders").delete().eq("id", id);

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
