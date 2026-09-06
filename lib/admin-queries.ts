import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminReady } from "@/lib/supabase/config";
import type { Order, OrderStatus, Product, Coupon } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Admin reads service-role client se hote hain (RLS bypass), kyunki:
// 1. Orders table par anon SELECT policy nahi hai (privacy) — anon key orders
//    kabhi nahi parh sakta.
// 2. Products/Coupons admin writes bhi isi key se hote hain.
// Ye key sirf server-side hai, browser mein kabhi expose nahi hoti.

function db() {
  if (!isAdminReady()) return null;
  return createAdminClient();
}

function rowToOrder(row: any): Order {
  return {
    id: row.id,
    order_number: row.order_number,
    user_id: row.user_id ?? null,
    user_email: row.user_email ?? null,
    customer_name: row.customer_name,
    phone: row.phone,
    address: row.address,
    city: row.city,
    payment_method: row.payment_method,
    payment_status: row.payment_status ?? "pending",
    items: row.items ?? [],
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    discount: Number(row.discount ?? 0),
    coupon_code: row.coupon_code ?? null,
    total: Number(row.total),
    status: row.status as OrderStatus,
    created_at: row.created_at,
  };
}

export async function getOrders(): Promise<Order[]> {
  const supabase = db();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map(rowToOrder);
  } catch (error) {
    console.error("[admin] orders fetch failed:", error);
    return [];
  }
}

export async function getOrderCountsByStatus(): Promise<
  Record<OrderStatus, number>
> {
  const orders = await getOrders();
  const counts: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const order of orders) {
    counts[order.status] += 1;
  }
  return counts;
}

export async function getProductCount(): Promise<number> {
  const supabase = db();
  if (!supabase) return 0;
  try {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getAdminProducts(): Promise<Product[]> {
  const supabase = db();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: row.category_slug,
      price: Number(row.price),
      originalPrice: row.original_price ? Number(row.original_price) : undefined,
      emoji: row.emoji,
      gradient: row.gradient,
      imageUrl: row.image_url ?? null,
      description: row.description,
      rating: Number(row.rating),
      reviews: row.reviews,
      inStock: row.in_stock,
      stock: row.stock ?? undefined,
      tag: row.tag ?? undefined,
    }));
  } catch (error) {
    console.error("[admin] products fetch failed:", error);
    return [];
  }
}

export async function getCoupons(): Promise<Coupon[]> {
  const supabase = db();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at");
    if (error) throw error;
    return data.map((row: any) => ({
      code: row.code,
      discount_type: row.discount_type,
      discount_value: Number(row.discount_value),
      min_subtotal: Number(row.min_subtotal),
      active: row.active,
      max_uses: row.max_uses ?? null,
      used_count: Number(row.used_count),
      expires_at: row.expires_at ?? null,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error("[admin] coupons fetch failed:", error);
    return [];
  }
}