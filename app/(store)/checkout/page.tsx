"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { formatPrice } from "@/lib/utils";
import { computeDiscount, formatDiscount } from "@/lib/coupons";
import type { ValidatedCoupon } from "@/lib/types";
import { placeOrder, validateCoupon } from "@/lib/place-order";
import {
  MANUAL_PAYMENT_METHODS,
  ONLINE_DISABLED_MSG,
  getManualPaymentMethod,
} from "@/lib/payment-methods";

// Payment options: COd + manual (JazzCash/Easypaisa/Bank). Card online disabled.
const PAYMENT_METHODS = [
  "Cash on Delivery",
  ...MANUAL_PAYMENT_METHODS.map((m) => m.label),
];

type CouponState = {
  code: string;
  coupon: ValidatedCoupon | null;
  discount: number;
  checking: boolean;
  error: string | null;
  applied: boolean;
};

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    payment: "Cash on Delivery",
  });
  const [couponState, setCouponState] = useState<CouponState>({
    code: "",
    coupon: null,
    discount: 0,
    checking: false,
    error: null,
    applied: false,
  });
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [error, setError] = useState("");

  if (placed) {
    return (
      <section className="container section order-success">
        <span className="order-success-emoji">✅</span>
        <h1>Order Placed Successfully!</h1>
        <p>
          Shukriya, <strong>{form.name}</strong>! Aapka order{" "}
          <strong>{orderId}</strong> confirm ho gaya hai.
        </p>
        <p>
          Hamari team 24 ghante mein confirm kar ke aapko call karegi. Delivery
          address: <strong>{form.address}, {form.city}</strong>.
        </p>
        <p>Payment method: <strong>{form.payment}</strong></p>
        {orderDiscount > 0 && (
          <p className="coupon-applied-total">
            🎉 Aapne Rs. {formatPrice(orderDiscount)} ki bachat ki!
          </p>
        )}
        <Link href="/track" className="btn btn-outline btn-lg">
          Track My Order
        </Link>
        <Link href="/" className="btn btn-primary btn-lg">
          Continue Shopping
        </Link>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="container section empty-cart">
        <span className="empty-cart-emoji">🛒</span>
        <h1>Your cart is empty</h1>
        <p>Checkout karne ke liye pehle products add karein.</p>
        <Link href="/" className="btn btn-primary btn-lg">
          Start Shopping
        </Link>
      </section>
    );
  }

  const shipping = subtotal >= 2000 ? 0 : 200;
  const total = subtotal + shipping - couponState.discount;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleApplyCoupon() {
    const code = couponState.code.trim();
    if (!code) return;
    setCouponState((s) => ({ ...s, checking: true, error: null }));
    const result = await validateCoupon(code, subtotal);
    if (result.ok && result.coupon) {
      setCouponState((s) => ({
        ...s,
        coupon: result.coupon!,
        discount: computeDiscount(result.coupon!, subtotal),
        applied: true,
        checking: false,
        error: null,
      }));
    } else {
      setCouponState((s) => ({
        ...s,
        coupon: null,
        discount: 0,
        applied: false,
        checking: false,
        error: result.error ?? "Coupon invalid hai.",
      }));
    }
  }

  function handleRemoveCoupon() {
    setCouponState({
      code: "",
      coupon: null,
      discount: 0,
      checking: false,
      error: null,
      applied: false,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlacing(true);
    setError("");

    const result = await placeOrder(
      {
        ...form,
        coupon: couponState.coupon?.code ?? "",
      },
      items
    );

    if (result.ok && result.orderNumber) {
      setOrderId(result.orderNumber);
      setOrderDiscount(result.discount ?? couponState.discount);
      clearCart();
      setPlaced(true);
    } else {
      setError(result.error ?? "Kuch ghalat ho gaya. Dobara koshish karein.");
    }
    setPlacing(false);
  }

  const isValid = form.name && form.phone && form.address && form.city;

  return (
    <section className="container section">
      <h1 className="page-title">Checkout</h1>

      <form className="checkout-layout" onSubmit={handleSubmit}>
        <div className="checkout-form">
          <h2>Delivery Details</h2>
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Apna naam likhein"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="03XX-XXXXXXX"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <input
              id="address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              placeholder="Complete address"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="city">City *</label>
            <input
              id="city"
              name="city"
              type="text"
              value={form.city}
              onChange={handleChange}
              placeholder="City"
              required
            />
          </div>

          <h2 className="form-section-title">Payment Method</h2>
          <div className="payment-options">
            {PAYMENT_METHODS.map((method) => (
              <label key={method} className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={form.payment === method}
                  onChange={handleChange}
                />
                <span>{method}</span>
              </label>
            ))}
          </div>

          {form.payment !== "Cash on Delivery" && (
            <ManualPaymentNotice method={form.payment} />
          )}
        </div>

        <aside className="order-summary">
          <h2>Your Order</h2>
          {items.map((item) => (
            <div key={item.productId} className="summary-item">
              <span className="summary-item-name">
                {item.name}
                <span className="summary-item-qty"> × {item.quantity}</span>
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="coupon-box">
            {couponState.applied && couponState.coupon ? (
              <div className="coupon-applied">
                <span className="coupon-chip">
                  🏷️ {couponState.coupon.code} ({formatDiscount(
                    couponState.coupon,
                    couponState.discount
                  )})
                </span>
                <button
                  type="button"
                  className="coupon-remove"
                  onClick={handleRemoveCoupon}
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="coupon">Coupon code (optional)</label>
                <div className="coupon-input-row">
                  <input
                    id="coupon"
                    type="text"
                    value={couponState.code}
                    onChange={(e) =>
                      setCouponState((s) => ({ ...s, code: e.target.value }))
                    }
                    placeholder="WELCOME10"
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleApplyCoupon}
                    disabled={couponState.checking || !couponState.code.trim()}
                  >
                    {couponState.checking ? "..." : "Apply"}
                  </button>
                </div>
                {couponState.error && (
                  <p className="coupon-error">{couponState.error}</p>
                )}
              </>
            )}
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
          </div>
          {couponState.discount > 0 && (
            <div className="summary-row discount-row">
              <span>Discount {couponState.coupon ? `(${couponState.coupon.code})` : ""}</span>
              <span>− {formatPrice(couponState.discount)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(Math.max(total, 0))}</span>
          </div>
          {error && <p className="checkout-error">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={!isValid || placing}
          >
            {placing
              ? "Placing Order..."
              : `Place Order — ${formatPrice(Math.max(total, 0))}`}
          </button>
          <p className="secure-note">🔒 Secure checkout. COD available.</p>
        </aside>
      </form>
    </section>
  );
}

function ManualPaymentNotice({ method }: { method: string }) {
  const config = getManualPaymentMethod(method);
  if (!config) {
    return <p className="online-pay-note">{ONLINE_DISABLED_MSG}</p>;
  }

  return (
    <div className="manual-payment-notice">
      <p className="online-pay-note">
        {config.label} ke account par transfer karke order confirm karein.
      </p>
      <div className="manual-payment-details">
        <div className="manual-payment-row">
          <span>Account Name</span>
          <strong>{config.accountTitle}</strong>
        </div>
        <div className="manual-payment-row">
          <span>Number</span>
          <strong className="mono">{config.display}</strong>
        </div>
      </div>
      <p className="manual-payment-instructions">{config.instructions}</p>
    </div>
  );
}
