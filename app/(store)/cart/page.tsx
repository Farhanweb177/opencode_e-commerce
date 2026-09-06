"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <section className="container section empty-cart">
        <span className="empty-cart-emoji">🛒</span>
        <h1>Your cart is empty</h1>
        <p>Abhi tak kuch add nahi kiya. Pehle shopping karein!</p>
        <Link href="/" className="btn btn-primary btn-lg">
          Start Shopping
        </Link>
      </section>
    );
  }

  const shipping = subtotal >= 2000 ? 0 : 200;
  const total = subtotal + shipping;

  return (
    <section className="container section">
      <h1 className="page-title">Shopping Cart</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.productId} className="cart-item">
              <Link
                href={`/product/${item.slug}`}
                style={{ background: item.gradient }}
                className="cart-item-thumb"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <span className="cart-item-thumb-emoji">{item.emoji}</span>
                )}
              </Link>
              <div className="cart-item-info">
                <Link href={`/product/${item.slug}`} className="cart-item-name">
                  {item.name}
                </Link>
                <span className="product-category-label">{item.category}</span>
                <span className="cart-item-price">
                  {formatPrice(item.price)}
                </span>
              </div>
              <div className="qty-control">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <div className="cart-item-total">
                {formatPrice(item.price * item.quantity)}
              </div>
              <button
                className="remove-btn"
                onClick={() => removeItem(item.productId)}
                aria-label="Remove item"
              >
                ✕
              </button>
            </div>
          ))}
          <button className="clear-btn" onClick={clearCart}>
            Clear Cart
          </button>
        </div>

        <aside className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          {shipping > 0 && (
            <p className="shipping-hint">
              Add {formatPrice(2000 - subtotal)} more for FREE delivery!
            </p>
          )}
          <Link href="/checkout" className="btn btn-primary btn-lg btn-block">
            Proceed to Checkout →
          </Link>
        </aside>
      </div>
    </section>
  );
}
