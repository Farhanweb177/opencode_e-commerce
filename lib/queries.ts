import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  categories as staticCategories,
  products as staticProducts,
} from "./data";
import type { Category, Product, Review } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function rowToProduct(row: any): Product {
  return {
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
  };
}

function rowToCategory(row: any): Category {
  return {
    slug: row.slug,
    name: row.name,
    emoji: row.emoji,
    gradient: row.gradient,
    description: row.description,
  };
}

// Professional mode: jab Supabase configured hai to database HI source of
// truth hai — chahe usme 0 rows hon. Static data sirf tab aata hai jab
// Supabase configured NA ho (offline demo) ya DB query fail ho.
async function withFallback<T>(
  dbQuery: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await dbQuery();
  } catch (error) {
    console.error("[db] query failed, static data use kar rahe hain:", error);
    return fallback;
  }
}

export async function getCategories(): Promise<Category[]> {
  return withFallback(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at");
    if (error) throw error;
    return data.map(rowToCategory);
  }, staticCategories);
}

export async function getCategory(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getProducts(): Promise<Product[]> {
  return withFallback(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at");
    if (error) throw error;
    return data.map(rowToProduct);
  }, staticProducts);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) ?? null;
}

export async function getCategoryProducts(slug: string): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.category === slug);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter(
    (p) => p.tag === "Best Seller" || p.tag === "Sale"
  );
}

export async function getNewProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => p.tag === "New");
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (!query.trim()) return [];

  if (!isSupabaseConfigured()) {
    // Offline demo — static data se client-side filter
    return searchStaticProducts(query.trim());
  }

  let dbFailed = false;

  // Professional mode: PostgreSQL full-text search (GIN index + websearch)
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .textSearch("search_vector", query.trim(), { type: "websearch" })
      .order("created_at");
    if (error) throw error;
    if (data && data.length > 0) {
      return data.map(rowToProduct);
    }
  } catch (error) {
    dbFailed = true;
    console.error("[db] full-text search failed, falling back:", error);
  }

  // Fallback: ilike (ya search_vector column nahi bana to)
  // PostgREST filter syntax ko todne wale characters hata dete hain.
  const normalized = query
    .trim()
    .toLowerCase()
    .replace(/[%,()*"\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(
        `name.ilike.%${normalized}%,description.ilike.%${normalized}%,category_slug.ilike.%${normalized}%`
      )
      .order("created_at");
    if (error) throw error;
    if (data && data.length > 0) {
      return data.map(rowToProduct);
    }
  } catch (error) {
    dbFailed = true;
    console.error("[db] fallback search failed:", error);
  }

  // DB fail hui (offline) to static catalog par search karo
  if (dbFailed) return searchStaticProducts(query);

  return [];
}

function searchStaticProducts(query: string): Product[] {
  const normalized = query.trim().toLowerCase();
  return staticProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(normalized) ||
      p.description.toLowerCase().includes(normalized) ||
      p.category.toLowerCase().includes(normalized)
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getReviews(productId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];
  // Static fallback products ke ids UUID nahi hote — seedha khali return karo.
  if (!UUID_RE.test(productId)) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((row: any) => ({
      id: row.id,
      product_id: row.product_id,
      author_name: row.author_name,
      rating: Number(row.rating),
      comment: row.comment ?? null,
      created_at: row.created_at,
    }));
  } catch (error: any) {
    // Agar "reviews" table database mein nahi hai (schema run nahi hua) to
    // reviews khali show karein bina annoying console error ke.
    if (error?.code === "PGRST205") {
      return [];
    }
    console.error("[db] reviews fetch failed:", error);
    return [];
  }
}
