"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatPrice } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

type AccountOrderItem = {
  name: string;
  emoji: string;
  price: number;
  quantity: number;
};

type AccountOrder = {
  order_number: string;
  status: string;
  total: number;
  discount: number;
  payment_method: string;
  items: AccountOrderItem[];
  created_at: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        if (!isSupabaseConfigured()) return;
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) return;
        setEmail(session.user.email ?? null);
        const { data } = await supabase.rpc("get_my_orders");
        setOrders((Array.isArray(data) ? data : []) as AccountOrder[]);
      } catch (error) {
        console.error("[account] load failed:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("[account] sign out failed:", error);
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <section className="container section auth-page">
        <div className="auth-card">
          <span className="auth-logo">⏳</span>
          <h1>Loading...</h1>
        </div>
      </section>
    );
  }

  if (!isSupabaseConfigured() || !email) {
    return (
      <section className="container section auth-page">
        <div className="auth-card">
          <span className="auth-logo">🔒</span>
          <h1>Login required</h1>
          <p className="auth-sub">
            Apne account aur orders dekhyne ke liye sign in karein.
          </p>
          {!isSupabaseConfigured() && (
            <p className="auth-note">
              Supabase configured nahi hai — <code>.env.local</code> check
              karein.
            </p>
          )}
          <Link href="/login" className="btn btn-primary btn-lg btn-block">
            Go to Login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container section account-page">
      <div className="section-head">
        <h1 className="section-title">My Account</h1>
        <button type="button" className="clear-btn" onClick={handleSignOut}>
          {signingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>

      <div className="account-profile">
        <span className="account-avatar">
          {email.charAt(0).toUpperCase()}
        </span>
        <div>
          <strong>{email}</strong>
          <p>Logged in customer</p>
        </div>
      </div>

      <h2 className="account-orders-title">My Orders</h2>
      {orders.length === 0 ? (
        <div className="account-empty">
          <p>Abhi tak koi order nahi kiya.</p>
          <Link href="/" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="account-orders">
          {orders.map((order) => (
            <div key={order.order_number} className="admin-card order-card">
              <div className="order-detail">
                <div className="order-detail-info">
                  <h4>Order {order.order_number}</h4>
                  <p>
                    🗓️{" "}
                    {new Date(order.created_at).toLocaleString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    <br />
                    💳 {order.payment_method}
                    <br />
                    <span className={`status-badge status-${order.status}`}>
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </p>
                </div>
                <div className="order-detail-items">
                  <h4>Items</h4>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="summary-item">
                      <span className="summary-item-name">
                        {item.emoji} {item.name}
                        <span className="summary-item-qty">
                          {" "}
                          × {item.quantity}
                        </span>
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}