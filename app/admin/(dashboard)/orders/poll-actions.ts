"use server";

import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminReady } from "@/lib/supabase/config";

export type PolledOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  city: string;
  phone: string;
  total: number;
  payment_method: string;
  created_at: string;
};

// Orders privacy: orders table par anon SELECT policy nahi hai. Isliye naya
// order notification service-role se server-side poll hoti hai (secure).
export async function getRecentOrders(): Promise<PolledOrder[]> {
  const user = await getAdminUser();
  if (!user) return [];
  if (!isAdminReady()) return [];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id,order_number,customer_name,city,phone,total,payment_method,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return data as PolledOrder[];
  } catch (error) {
    console.error("[admin] recent orders poll failed:", error);
    return [];
  }
}