"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, isAdminConfigured } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminReady } from "@/lib/supabase/config";
import { categories as staticCategories, products as staticProducts } from "@/lib/data";

export type SeedResult = { ok: boolean; message: string };

export async function seedStarterData(): Promise<SeedResult> {
  await requireAdmin();
  if (!isAdminConfigured()) {
    return { ok: false, message: "Admin setup nahi hai." };
  }
  if (!isAdminReady()) {
    return {
      ok: false,
      message: "SUPABASE_SERVICE_ROLE_KEY set nahi hai — .env.local mein add karein.",
    };
  }

  const supabase = createAdminClient();

  try {
    const { count: catCount } = await supabase
      .from("categories")
      .select("slug", { count: "exact", head: true });

    if (!catCount) {
      const { error } = await supabase.from("categories").insert(
        staticCategories.map((c) => ({
          slug: c.slug,
          name: c.name,
          emoji: c.emoji,
          gradient: c.gradient,
          description: c.description,
        }))
      );
      if (error) throw error;
    }

    const { count: prodCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true });

    if (!prodCount) {
      const { error } = await supabase.from("products").insert(
        staticProducts.map((p) => ({
          slug: p.slug,
          name: p.name,
          category_slug: p.category,
          price: p.price,
          original_price: p.originalPrice ?? null,
          emoji: p.emoji,
          gradient: p.gradient,
          image_url: p.imageUrl ?? null,
          description: p.description,
          rating: p.rating,
          reviews: p.reviews,
          in_stock: p.inStock,
          stock: typeof p.stock === "number" ? p.stock : 100,
          tag: p.tag ?? null,
        }))
      );
      if (error) throw error;
    }

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Seed complete: ${staticCategories.length} categories, ${staticProducts.length} products import ho gaye.`,
    };
  } catch (error) {
    console.error("[seed] failed:", error);
    const detail =
      error instanceof Error
        ? error.message
        : "Check karein ke schema.sql run ho chuka hai.";
    return {
      ok: false,
      message: `Seed fail hua: ${detail}`,
    };
  }
}
