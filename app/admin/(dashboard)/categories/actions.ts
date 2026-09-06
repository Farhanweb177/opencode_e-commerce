"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminReady } from "@/lib/supabase/config";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function guard(): Promise<boolean> {
  await requireAdmin();
  return true;
}

export async function createCategory(formData: FormData): Promise<void> {
  if (!(await guard()) || !isAdminReady()) return;

  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "🛍️").trim() || "🛍️";
  const description = String(formData.get("description") ?? "").trim();
  const gradient =
    String(formData.get("gradient") ?? "").trim() ||
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  const slug = slugify(slugInput || name);
  if (!slug) return;

  const supabase = createAdminClient();
  await supabase.from("categories").insert({
    slug,
    name,
    emoji,
    description,
    gradient,
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
}

export async function updateCategory(formData: FormData): Promise<void> {
  if (!(await guard()) || !isAdminReady()) return;

  const originalSlug = String(formData.get("originalSlug") ?? "").trim();
  if (!originalSlug) return;

  const name = String(formData.get("name") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "🛍️").trim() || "🛍️";
  const description = String(formData.get("description") ?? "").trim();
  const gradient =
    String(formData.get("gradient") ?? "").trim() ||
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  const supabase = createAdminClient();
  await supabase
    .from("categories")
    .update({ name, emoji, description, gradient })
    .eq("slug", originalSlug);

  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  if (!(await guard()) || !isAdminReady()) return;

  const slug = String(formData.get("id") ?? "").trim();
  if (!slug) return;

  const supabase = createAdminClient();

  // Category ke products pehle delete karna hoga (FK cascade DB mein set hai)
  await supabase.from("categories").delete().eq("slug", slug);

  revalidatePath("/", "layout");
  revalidatePath("/admin/categories");
}
