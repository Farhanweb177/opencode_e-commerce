"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminReady } from "@/lib/supabase/config";

export type ProductFormState = { error: string | null };

const IMAGE_BUCKET = "product-images";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB server-side limit

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const categorySlug = String(formData.get("category") ?? "").trim();
  const price = Number(formData.get("price"));
  const originalPriceRaw = String(formData.get("originalPrice") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "📦").trim() || "📦";
  const gradient = String(formData.get("gradient") ?? "").trim() ||
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
  const description = String(formData.get("description") ?? "").trim();
  const rating = Number(formData.get("rating") ?? 4.5);
  const reviews = parseInt(String(formData.get("reviews") ?? "0"), 10) || 0;
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const stock = stockRaw === "" ? 0 : Math.max(0, parseInt(stockRaw, 10) || 0);
  const tagRaw = String(formData.get("tag") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  return {
    ok: Boolean(
      name && categorySlug && !Number.isNaN(price) && price >= 0
    ),
    values: {
      name,
      slug: slugify(slugInput || name),
      category_slug: categorySlug,
      price,
      original_price:
        originalPriceRaw && !Number.isNaN(Number(originalPriceRaw))
          ? Number(originalPriceRaw)
          : null,
      emoji,
      gradient,
      image_url: imageUrl || null,
      description,
      rating: Math.min(Math.max(rating || 4.5, 0), 5),
      reviews: Math.max(reviews, 0),
      stock,
      in_stock: stock > 0,
      tag: tagRaw || null,
    },
  };
}

// ---------- Product image helpers (Supabase Storage) ----------

function bucketPathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function uploadProductImage(
  file: File
): Promise<{ url: string } | { error: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "Sirf image files upload karein." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "File size 8MB se kam hona chahiye." };
  }

  if (!isAdminReady()) {
    return { error: "Service role key missing." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const cleanExt = /^[a-z0-9]{1,5}$/.test(ext) ? ext : "png";
  const path = `products/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${cleanExt}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) {
    console.error("[products] image upload failed:", error);
    return { error: "Image upload fail hua." };
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/${path}`;
  return { url };
}

async function deleteProductImageIfBucket(imageUrl: string | null) {
  if (!imageUrl) return;
  const path = bucketPathFromUrl(imageUrl);
  if (!path) return;
  try {
    const supabase = createAdminClient();
    await supabase.storage.from(IMAGE_BUCKET).remove([path]);
  } catch (error) {
    console.error("[products] old image delete failed:", error);
  }
}

async function guard(): Promise<boolean> {
  await requireAdmin();
  return true;
}

// New image decide karein: uploaded file > pasted URL > clear
async function resolveImage(
  formData: FormData,
  currentImageUrl: string | null
): Promise<{ image_url: string | null; error?: string }> {
  const file = formData.get("image");
  const urlInput = String(formData.get("imageUrl") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadProductImage(file);
    if ("error" in uploaded && uploaded.error) {
      return { image_url: currentImageUrl, error: uploaded.error };
    }
    const newUrl = (uploaded as { url: string }).url;
    if (currentImageUrl && currentImageUrl !== newUrl) {
      await deleteProductImageIfBucket(currentImageUrl);
    }
    return { image_url: newUrl };
  }

  if (urlInput) {
    // Naye URL par switch kiya — agar purana bucket image thi to delete
    if (currentImageUrl && currentImageUrl !== urlInput) {
      await deleteProductImageIfBucket(currentImageUrl);
    }
    return { image_url: urlInput };
  }

  // Photo clear kardi gayi
  if (currentImageUrl) {
    await deleteProductImageIfBucket(currentImageUrl);
  }
  return { image_url: null };
}

export async function createProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  if (!(await guard()) || !isAdminReady()) {
    return { error: "Unauthorized ya service role key missing." };
  }

  const { ok, values } = parseProductForm(formData);
  if (!ok) {
    return { error: "Name, category aur price sahi bharein." };
  }

  const supabase = createAdminClient();
  const image = await resolveImage(formData, null);
  if (image.error) return { error: image.error };

  const { error } = await supabase
    .from("products")
    .insert({ ...values, image_url: image.image_url });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ye slug pehle se maujood hai. Doosra slug likhein." };
    }
    console.error("[products] create failed:", error);
    return { error: "Product save nahi hua." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function updateProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  if (!(await guard()) || !isAdminReady()) {
    return { error: "Unauthorized ya service role key missing." };
  }

  const id = String(formData.get("id") ?? "");
  const { ok, values } = parseProductForm(formData);
  if (!id || !ok) {
    return { error: "Name, category aur price sahi bharein." };
  }

  const supabase = createAdminClient();
  const { data: current } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .single();

  const image = await resolveImage(formData, current?.image_url ?? null);
  if (image.error) return { error: image.error };

  const { error } = await supabase
    .from("products")
    .update({ ...values, image_url: image.image_url })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Ye slug pehle se maujood hai. Doosra slug likhein." };
    }
    console.error("[products] update failed:", error);
    return { error: "Product update nahi hua." };
  }

  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isAdminReady()) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .single();
  if (data?.image_url) {
    await deleteProductImageIfBucket(data.image_url);
  }
  await supabase.from("products").delete().eq("id", id);

  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
}

export async function toggleStock(formData: FormData): Promise<void> {
  await requireAdmin();
  if (!isAdminReady()) return;

  const id = String(formData.get("id") ?? "");
  const inStock = formData.get("inStock") === "true";
  if (!id) return;

  const supabase = createAdminClient();
  await supabase.from("products").update({ in_stock: !inStock }).eq("id", id);

  revalidatePath("/", "layout");
  revalidatePath("/admin/products");
}