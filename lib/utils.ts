export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}

export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Electronics",
  "ladies-boutique": "Ladies Boutique",
  "winter-clothing": "Winter Clothing",
  "summer-clothing": "Summer Clothing",
  cosmetics: "Cosmetics",
  "laptop-accessories": "Laptop Accessories",
};

export function formatCategoryName(slug: string): string {
  const known = CATEGORY_LABELS[slug];
  if (known) return known;
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
