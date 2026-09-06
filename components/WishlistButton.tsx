"use client";

import type { Product } from "@/lib/types";
import { useWishlist } from "./WishlistProvider";

export function WishlistButton({
  product,
  position,
}: {
  product: Product;
  position?: "card" | "page";
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const active = isWishlisted(product.id);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      title={active ? "Wishlist se hatao" : "Wishlist mein add karo"}
      onClick={() =>
        toggleWishlist({
          id: product.id,
          slug: product.slug,
          name: product.name,
          category: product.category,
          price: product.price,
          emoji: product.emoji,
          gradient: product.gradient,
          imageUrl: product.imageUrl ?? null,
        })
      }
      className={`wishlist-btn ${active ? "active" : ""} ${
        position === "page" ? "wishlist-btn-page" : ""
      }`}
    >
      <svg
        width={position === "page" ? "24" : "18"}
        height={position === "page" ? "24" : "18"}
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}