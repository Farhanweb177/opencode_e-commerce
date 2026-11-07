"use server";

import { createClient, createServerAuthClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createCheckoutSession } from "@/lib/payment";
import { MANUAL_PAYMENT_METHODS } from "@/lib/payment-methods";
import type { CartItem, ValidatedCoupon } from "@/lib/types";

const ALLOWED_PAYMENT_METHODS = new Set([
  "Cash on Delivery",
  ...MANUAL_PAYMENT_METHODS.map((m) => m.label),
]);

export type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
  city: string;
  payment: string;
  coupon?: string;
};

export type PlaceOrderResult = {
  ok: boolean;
  saved: boolean;
  orderNumber?: string;
  discount?: number;
  error?: string;
};

function generateOrderNumber(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const n = String(100000 + (buf[0] % 900000));
  return `AIO-${n}`;
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ ok: boolean; coupon?: ValidatedCoupon; error?: string }> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "Coupon code daalein." };
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database connected nahi — coupon verify nahi hua." };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("validate_coupon", {
      p_code: trimmed,
      p_subtotal: subtotal,
    });
    if (error) throw error;
    const result = data as { valid: boolean; error?: string } & ValidatedCoupon;
    if (!result?.valid || result.error) {
      return { ok: false, error: result?.error ?? "Coupon invalid hai." };
    }
    return {
      ok: true,
      coupon: {
        code: result.code,
        discount_type: result.discount_type,
        discount_value: Number(result.discount_value),
        min_subtotal: Number(result.min_subtotal),
      },
    };
  } catch (error) {
    console.error("[coupon] validation failed:", error);
    return { ok: false, error: "Coupon check nahi hua. Dobara koshish karein." };
  }
}

async function fetchCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

// Client cart ke saath bharosa NAHI karte. place_order RPC server-side
// products ko DB se re-validate karti hai: current price, stock, quantity.
// Client se sirf productId + quantity aati hai; price DB se aata hai.
export async function placeOrder(
  form: CheckoutForm,
  items: CartItem[]
): Promise<PlaceOrderResult> {
  if (!form.name || !form.phone || !form.address || !form.city) {
    return { ok: false, saved: false, error: "Delivery details incomplete hain." };
  }
  if (!ALLOWED_PAYMENT_METHODS.has(form.payment)) {
    return { ok: false, saved: false, error: "Payment method valid nahi hai." };
  }
  if (!items.length) {
    return { ok: false, saved: false, error: "Cart khali hai." };
  }
  if (items.some((i) => !i.productId || !Number.isFinite(i.quantity) || i.quantity < 1)) {
    return { ok: false, saved: false, error: "Cart items valid nahi hain." };
  }

  const orderNumber = generateOrderNumber();

  // Supabase configured nahi — demo mode, sirf success dikhate hain
  if (!isSupabaseConfigured()) {
    return { ok: true, saved: false, orderNumber };
  }

  const supabase = await createClient();
  const user = await fetchCurrentUser();

  // Atomic order placement — server validates prices + stock + coupon
  // ek hi transaction mein (place_order RPC security definer hai).
  const payload = {
    p_order_number: orderNumber,
    p_user_id: user?.id ?? null,
    p_user_email: user?.email ?? null,
    p_customer_name: form.name,
    p_phone: form.phone,
    p_address: form.address,
    p_city: form.city,
    p_payment_method: form.payment,
    p_items: items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    })),
    p_coupon_code: form.coupon?.trim() ?? null,
  };

  try {
    const { data, error } = await supabase.rpc("place_order", payload);
    if (error) throw error;

    const result = data as {
      ok: boolean;
      order_number?: string;
      discount?: number;
    };
    if (!result?.ok || !result.order_number) {
      return { ok: false, saved: false, error: "Order place nahi hua." };
    }
    return {
      ok: true,
      saved: true,
      orderNumber: result.order_number,
      discount: Number(result.discount ?? 0),
    };
  } catch (error) {
    // RPC se aaya error message (jaise "stock khatam") pars karo
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
    console.error("[checkout] order save failed:", error);

    const unreachable =
      /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network|timeout/i.test(
        message
      );
    return {
      ok: false,
      saved: false,
      error: unreachable
        ? "Database se connect nahi ho saka. Supabase URL/keys check karein."
        : message && !message.includes("Supabase")
          ? message
          : "Order save nahi hua. Dobara koshish karein.",
    };
  }
}

export async function startOnlinePayment(
  orderNumber: string,
  amount: number
): Promise<{ url?: string; error?: string }> {
  return createCheckoutSession({ orderNumber, amount });
}