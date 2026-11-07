"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { trackOrder } from "@/lib/store-actions";
import type { TrackedOrder } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_STEPS = ["pending", "confirmed", "shipped", "delivered"];

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [checking, setChecking] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");

  const currentIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;
  const cancelled = order?.status === "cancelled";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError("");
    try {
      const result = await trackOrder(orderNumber, phone);
      if (result.ok && result.order) {
        setOrder(result.order);
      } else {
        setOrder(null);
        setError(result.error ?? "Order nahi mila.");
      }
    } catch (error) {
      console.error("[track] request failed:", error);
      setOrder(null);
      setError("Server se connect nahi ho paya. Dobara koshish karein.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="container section track-page">
      <div className="track-head">
        <span className="empty-cart-emoji">📦</span>
        <h1 className="page-title">Track Your Order</h1>
        <p className="track-subtitle">
          Order number aur phone number daalein (jo checkout par use kiya tha)
          — order ki current status dekhein.
        </p>
      </div>

      <form className="track-form" onSubmit={handleSubmit}>
        <div className="track-form-row">
          <div className="form-group">
            <label htmlFor="track-order">Order Number *</label>
            <input
              id="track-order"
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. AIO-123456"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="track-phone">Phone Number *</label>
            <input
              id="track-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03XX-XXXXXXX"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={checking || !orderNumber.trim() || !phone.trim()}
        >
          {checking ? "Checking..." : "Track Order"}
        </button>
      </form>

      {error && <p className="track-error">{error}</p>}

      {order && (
        <div className="track-result">
          <div className="track-result-head">
            <h2>Order {order.order_number}</h2>
            <span className={`status-badge status-${order.status}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          <div className="track-timeline">
            {STATUS_STEPS.map((step, idx) => (
              <div
                key={step}
                className={`track-step ${
                  cancelled
                    ? idx === currentIndex
                      ? "cancelled"
                      : "muted"
                    : idx <= currentIndex
                      ? "done"
                      : "muted"
                }`}
              >
                <span className="track-step-dot">
                  {!cancelled && idx <= currentIndex ? "✓" : idx + 1}
                </span>
                <span className="track-step-label">
                  {STATUS_LABELS[step]}
                </span>
              </div>
            ))}
          </div>

          {cancelled && (
            <p className="track-cancelled-note">
              Ye order cancel ho chuka hai. Kisi sawal ke liye support se rabta
              karein.
            </p>
          )}

          <div className="track-details">
            <div className="track-detail-col">
              <h4>Items</h4>
              {order.items.map((item, idx) => (
                <div key={idx} className="summary-item">
                  <span className="summary-item-name">
                    {item.emoji} {item.name}
                    <span className="summary-item-qty"> × {item.quantity}</span>
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>
                  {order.shipping === 0 ? "FREE" : formatPrice(order.shipping)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="summary-row discount-row">
                  <span>Discount</span>
                  <span>− {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>

            <div className="track-detail-col">
              <h4>Details</h4>
              <p className="track-detail-line">
                👤 {order.customer_name}
                <br />
                🏙️ {order.city}
                <br />
                💳 {order.payment_method}
                <br />
                🗓️{" "}
                {new Date(order.created_at).toLocaleString("en-PK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <Link href="/" className="view-all">
            ← Continue Shopping
          </Link>
        </div>
      )}

      <p className="track-help">
        Agar order nahi mil raha to{" "}
        <Link href="/contact">Contact page</Link> se message karein.
      </p>
    </section>
  );
}