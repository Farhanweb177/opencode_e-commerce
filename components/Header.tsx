"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";
import { SearchBox } from "./SearchBox";

export function Header({ categories }: { categories: Category[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { count: wishlistCount } = useWishlist();
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="top-bar">
        <div className="container top-bar-inner">
          <span className="top-bar-text">🔥 Free Delivery on orders above Rs. 2,000</span>
          <span className="top-bar-links">
            <Link href="/track">Track Order</Link>
            <Link href="/account">Account</Link>
            <Link href="/wishlist">Wishlist</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/checkout">Checkout</Link>
          </span>
        </div>
      </div>

      <div className="container header-main">
        <button
          className="menu-toggle"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        <Link href="/" className="logo">
          <span className="logo-badge">A</span>
          <span className="logo-text">
            All <span>in</span> One
          </span>
        </Link>

        <div className="header-center">
          <SearchBox />
        </div>

        <div className="header-actions">
          <Link
            href="/wishlist"
            className="cart-btn"
            aria-label="Wishlist"
            title="Wishlist"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="cart-count wishlist-count">{wishlistCount}</span>
            )}
          </Link>

          <Link href="/cart" className="cart-btn" aria-label="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
          </Link>
        </div>
      </div>

      <nav className={`category-nav ${menuOpen ? "open" : ""}`}>
        <div className="container category-nav-inner">
          <Link
            href="/"
            className={pathname === "/" ? "nav-link active" : "nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className={
                pathname === `/category/${cat.slug}` ? "nav-link active" : "nav-link"
              }
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-emoji">{cat.emoji}</span>
              {cat.name}
            </Link>
          ))}
          <Link
            href="/track"
            className={pathname === "/track" ? "nav-link active" : "nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            📦 Track Order
          </Link>
        </div>
      </nav>
    </header>
  );
}
