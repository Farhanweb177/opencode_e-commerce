"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { TrackedOrder } from "@/lib/types";

export type ReviewResult = {
  ok: boolean;
  error?: string;
};

export async function submitReview(input: {
  productId: string;
  productSlug?: string;
  authorName: string;
  rating: number;
  comment?: string;
}): Promise<ReviewResult> {
  const name = input.authorName.trim();
  const rating = Math.round(Number(input.rating));
  const comment = (input.comment ?? "").trim();

  if (!name || !input.productId) {
    return { ok: false, error: "Naam aur rating zaroori hain." };
  }
  if (rating < 1 || rating > 5 || Number.isNaN(rating)) {
    return { ok: false, error: "Rating 1 se 5 ke darmiyan honi chahiye." };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database connected nahi — review save nahi hua." };
  }

  try {
    const supabase = await createClient();

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("rating, reviews")
      .eq("id", input.productId)
      .single();
    if (productError) throw productError;

    const { error } = await supabase.from("reviews").insert({
      product_id: input.productId,
      author_name: name,
      rating,
      comment: comment || null,
    });
    if (error) throw error;

    const oldRating = Number(product?.rating ?? 4.5);
    const oldCount = Number(product?.reviews ?? 0);
    const newCount = oldCount + 1;
    const newRating = Math.round(((oldRating * oldCount + rating) / newCount) * 10) / 10;

    await supabase
      .from("products")
      .update({ rating: Math.min(newRating, 5), reviews: newCount })
      .eq("id", input.productId);

    revalidatePath(`/product/${input.productSlug || input.productId}`);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[review] save failed:", error);
    return { ok: false, error: "Review save nahi hua. Dobara koshish karein." };
  }
}

export type TrackResult = {
  ok: boolean;
  order?: TrackedOrder;
  error?: string;
};

export async function trackOrder(
  orderNumber: string,
  phone: string
): Promise<TrackResult> {
  if (!orderNumber.trim() || !phone.trim()) {
    return { ok: false, error: "Order number aur phone number daalein." };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Database connected nahi — tracking available nahi." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("track_order", {
      p_order_number: orderNumber.trim(),
      p_phone: phone.trim(),
    });
    if (error) throw error;

    const result = data as TrackedOrder & { error?: string };
    if (!result || result.error === "not_found" || !result.order_number) {
      return {
        ok: false,
        error: "Order nahi mila. Order number aur phone sahi likhein.",
      };
    }
    return { ok: true, order: result };
  } catch (error) {
    console.error("[track] failed:", error);
    return { ok: false, error: "Tracking check nahi hui. Dobara koshish karein." };
  }
}