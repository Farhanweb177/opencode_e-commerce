import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatCategoryName, formatPrice } from "@/lib/utils";
import { ProductImage } from "./ProductImage";
import { AddToCartButton } from "./AddToCartButton";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100
      )
    : 0;

  const lowStock =
    typeof product.stock === "number" &&
    product.stock > 0 &&
    product.stock <= 5;

  const available = product.inStock && (product.stock ?? 1) > 0;

  return (
    <div className="product-card">
      <Link href={`/product/${product.slug}`} className="product-card-media">
        <ProductImage product={product} />
        {product.tag && <span className="product-tag">{product.tag}</span>}
        {discount > 0 && <span className="product-discount">-{discount}%</span>}
      </Link>
      <WishlistButton product={product} position="card" />

      <div className="product-card-body">
        <span className="product-category-label">
          {formatCategoryName(product.category)}
        </span>
        <Link href={`/product/${product.slug}`} className="product-name">
          {product.name}
        </Link>
        <div className="product-rating">
          <span className="stars">{"★".repeat(Math.round(product.rating))}</span>
          <span className="rating-value">
            {product.rating} ({product.reviews})
          </span>
        </div>
        <div className="product-price-row">
          <span className="product-price">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="product-original-price">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
        {available ? (
          <>
            {lowStock && (
              <span className="low-stock-hint">
                Only {product.stock} left in stock
              </span>
            )}
            <AddToCartButton product={product} />
          </>
        ) : (
          <button className="btn btn-disabled" disabled>
            Out of Stock
          </button>
        )}
      </div>
    </div>
  );
}
