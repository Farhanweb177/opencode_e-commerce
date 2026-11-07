"use client";

import Link from "next/link";
import { useWishlist } from "@/components/WishlistProvider";
import { formatCategoryName, formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductImage } from "@/components/ProductImage";
import type { Product } from "@/lib/types";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist();

  if (items.length === 0) {
    return (
      <section className="container section empty-cart">
        <span className="empty-cart-emoji">❤️</span>
        <h1>Wishlist khali hai</h1>
        <p>Pasand ke products par heart dabayein — wo yahan save ho jayenge.</p>
        <Link href="/" className="btn btn-primary btn-lg">
          Start Shopping
        </Link>
      </section>
    );
  }

  return (
    <section className="container section">
      <div className="section-head">
        <h1 className="section-title">My Wishlist ({items.length})</h1>
        <button type="button" className="clear-btn" onClick={clearWishlist}>
          Clear wishlist
        </button>
      </div>

      <div className="wishlist-grid">
        {items.map((item) => {
          const product = {
            ...item,
            description: "",
            rating: 0,
            reviews: 0,
            inStock: item.inStock ?? true,
          } as Product;
          const available = product.inStock && (product.stock ?? 1) > 0;
          return (
            <div key={item.id} className="product-card">
              <Link
                href={`/product/${item.slug}`}
                className="product-card-media"
              >
                <ProductImage product={product} />
              </Link>
              <div className="product-card-body">
                <span className="product-category-label">
                  {formatCategoryName(item.category)}
                </span>
                <Link href={`/product/${item.slug}`} className="product-name">
                  {item.name}
                </Link>
                <div className="product-price-row">
                  <span className="product-price">
                    {formatPrice(item.price)}
                  </span>
                </div>
                {available ? (
                  <AddToCartButton product={product} />
                ) : (
                  <button className="btn btn-disabled" disabled>
                    Out of Stock
                  </button>
                )}
                <button
                  type="button"
                  className="wishlist-remove"
                  onClick={() => removeItem(item.id)}
                >
                  Remove from Wishlist
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}