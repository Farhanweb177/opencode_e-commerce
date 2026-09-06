import type { Product } from "@/lib/types";

export function ProductImage({
  product,
  size = "medium",
}: {
  product: Product;
  size?: "medium" | "large";
}) {
  if (product.imageUrl) {
    return (
      <div className={`product-image product-image-${size} product-image-photo`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
      </div>
    );
  }

  return (
    <div
      className={`product-image product-image-${size}`}
      style={{ background: product.gradient }}
      aria-hidden="true"
    >
      <span className="product-image-emoji">{product.emoji}</span>
    </div>
  );
}
