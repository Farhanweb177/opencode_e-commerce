"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import type { ProductSnapshot } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { placeOrder } from "@/lib/place-order";
import { buildWhatsAppLink, SITE_WHATSAPP_DISPLAY } from "@/lib/site";

export function AddToCartButton({
  product,
  label = "Add to Cart",
  large = false,
}: {
  product: ProductSnapshot;
  label?: string;
  large?: boolean;
}) {
  const { addItem, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [browseQty, setBrowseQty] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
  });
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const shipping = product.price * quantity >= 2000 ? 0 : 200;
  const total = product.price * quantity + shipping;
  const isValid = form.name && form.phone && form.address && form.city;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || placing) return;
    setPlacing(true);
    const result = await placeOrder(
      { ...form, payment: "Cash on Delivery" },
      [
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        category: product.category,
        price: product.price,
        emoji: product.emoji,
        gradient: product.gradient,
        imageUrl: product.imageUrl ?? null,
        quantity,
      },
    ]);
    if (result.ok && result.orderNumber) {
      setPlacedOrderId(result.orderNumber);
      removeItem(product.id);
    }
    setPlacing(false);
  }

  function handleCancel() {
    setOpen(false);
    setQuantity(1);
    setForm({ name: "", phone: "", address: "", city: "" });
  }

  if (placedOrderId) {
    return (
      <div className="quick-order-success">
        <span className="quick-order-success-emoji">✅</span>
        <strong>Order Placed Successfully!</strong>
        <p>
          Shukriya, <strong>{form.name}</strong>! Aapka order{" "}
          <strong>{placedOrderId}</strong> confirm ho gaya hai.
        </p>
        <p className="quick-order-success-detail">
          {quantity} × {product.name} — <strong>{formatPrice(total)}</strong>
          <br />
          Delivery: {form.address}, {form.city}
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className={large ? "buy-actions buy-actions-lg" : "buy-actions"}>
        {large && (
          <div className="pdp-qty">
            <span className="pdp-qty-label">Quantity</span>
            <div className="qty-control">
              <button
                type="button"
                onClick={() => setBrowseQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span>{browseQty}</span>
              <button
                type="button"
                onClick={() => setBrowseQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <span className="pdp-total">
              Total:{" "}
              <strong>{formatPrice(product.price * browseQty)}</strong>
            </span>
          </div>
        )}
        <button
          className={`btn ${large ? "btn-lg" : ""} btn-primary`}
          onClick={() => {
            addItem(product, browseQty);
            if (large) setOpen(true);
          }}
        >
          {label}
        </button>
      </div>
    );
  }

  return (
    <form className="quick-order" onSubmit={handlePlaceOrder}>
      <div className="quick-order-head">
        <span>Order Details</span>
        <button
          type="button"
          className="quick-order-close"
          onClick={handleCancel}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="quick-order-product">
        <span className="quick-order-product-emoji">{product.emoji}</span>
        <div className="quick-order-product-info">
          <strong>{product.name}</strong>
          <span>{formatPrice(product.price)}</span>
        </div>
        <div className="qty-control">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`qo-name-${product.id}`}>Full Name *</label>
        <input
          id={`qo-name-${product.id}`}
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Apna naam likhein"
          required
        />
      </div>

      <div className="quick-order-row">
        <div className="form-group">
          <label htmlFor={`qo-phone-${product.id}`}>Phone *</label>
          <input
            id={`qo-phone-${product.id}`}
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="03XX-XXXXXXX"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor={`qo-city-${product.id}`}>City *</label>
          <input
            id={`qo-city-${product.id}`}
            name="city"
            type="text"
            value={form.city}
            onChange={handleChange}
            placeholder="City"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={`qo-address-${product.id}`}>Address *</label>
        <input
          id={`qo-address-${product.id}`}
          name="address"
          type="text"
          value={form.address}
          onChange={handleChange}
          placeholder="Complete address"
          required
        />
      </div>

      <div className="summary-row total">
        <span>Total ({quantity} item{quantity > 1 ? "s" : ""})</span>
        <span>{formatPrice(total)}</span>
      </div>
      {shipping > 0 && (
        <p className="shipping-hint">
          Add {formatPrice(2000 - product.price * quantity)} more for FREE
          delivery!
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-lg btn-block"
        disabled={!isValid || placing}
      >
        {placing ? "Placing Order..." : `Place Order — ${formatPrice(total)}`}
      </button>

      <div className="whatsapp-divider">
        <span>ya</span>
      </div>

      <a
        className="whatsapp-contact"
        href={buildWhatsAppLink(
          `Assalam o Alaikum! Mujhe ye product chahiye:\n\n` +
            `${product.name}\nQuantity: ${quantity}\nTotal: ${total} Rs.\n\n` +
            (form.name ? `Naam: ${form.name}\n` : "") +
            (form.phone ? `Phone: ${form.phone}\n` : "") +
            (form.address ? `Address: ${form.address}\n` : "")
        )}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 32 32" className="whatsapp-icon" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16 3C9.4 3 4 8.4 4 15c0 2.6.8 5 2.2 7L4 29l7.2-2.1c1.9 1 4 1.6 4.8 1.6h.1c6.6 0 12-5.4 12-12S22.6 3 16 3zm0 22c-.1 0-2.6-.2-4.4-1.4l-.3-.2-4.3 1.3 1.3-4.2-.3-.3c-1.2-1.7-1.8-3.7-1.8-5.8 0-5.4 4.4-9.8 9.8-9.8s9.8 4.4 9.8 9.8S21.4 25 16 25zm5.4-7.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.1-.2.3-.8 1-.9 1.2-.1.1-.3.2-.5.1-1.2-.6-2.1-1.1-2.9-2.6-.2-.4.2-.4.6-1.4.1-.2 0-.4 0-.5-.1-.1-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.3 5.1 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.2-.2-.6-.4z"
          />
        </svg>
        <span className="whatsapp-text">
          WhatsApp par order karein
          <small>{SITE_WHATSAPP_DISPLAY}</small>
        </span>
      </a>

      <button type="button" className="clear-btn" onClick={handleCancel}>
        Cancel
      </button>
    </form>
  );
}
