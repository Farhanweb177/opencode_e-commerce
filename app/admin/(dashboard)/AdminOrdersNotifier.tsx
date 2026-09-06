"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getRecentOrders, type PolledOrder } from "./orders/poll-actions";
import { formatPrice } from "@/lib/utils";

const POLL_INTERVAL_MS = 12000;

export function AdminOrdersNotifier({ enabled }: { enabled: boolean }) {
  const [toast, setToast] = useState<PolledOrder | null>(null);
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  // Toast auto-dismiss — 10 second ke baad khud chala jata hai
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 10000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    // Web Audio API se chhota beep (bina audio file ke)
    if (!audioCtxRef.current) {
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AC) audioCtxRef.current = new AC();
      } catch {
        // audio supported nahi — beep skip
      }
    }

    return () => {
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, []);

  const playBeep = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || muted) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // ignore
    }
  }, [muted]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function check() {
      const orders = await getRecentOrders();
      if (cancelled || orders.length === 0) return;

      const top = orders[0];
      if (lastSeenIdRef.current === null) {
        // Pehli check par seedha sync karo, notification na dikhao
        lastSeenIdRef.current = top.id;
        return;
      }

      if (top.id !== lastSeenIdRef.current) {
        lastSeenIdRef.current = top.id;
        setToast(top);
        playBeep();
      }
    }

    void check();
    const timer = window.setInterval(check, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [enabled, playBeep]);

  if (!toast) return null;

  return (
    <div className="order-notifier">
      <div className="order-notifier-card">
        <button
          type="button"
          className="order-notifier-close"
          onClick={() => setToast(null)}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
        <span className="order-notifier-emoji">🛎️</span>
        <div className="order-notifier-body">
          <span className="order-notifier-title">New Order Received!</span>
          <strong className="order-notifier-order">{toast.order_number}</strong>
          <p className="order-notifier-customer">
            👤 {toast.customer_name} · 📍 {toast.city}
          </p>
          <p className="order-notifier-meta">
            📞 {toast.phone} · 💳 {toast.payment_method}
          </p>
          <p className="order-notifier-total">
            Total: <strong>{formatPrice(toast.total)}</strong>
          </p>
          <div className="order-notifier-actions">
            <Link
              href="/admin/orders"
              className="btn btn-primary btn-sm"
              onClick={() => setToast(null)}
            >
              View Orders
            </Link>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setMuted((m) => !m)}
            >
              {muted ? "🔕 Muted" : "🔔 Sound On"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}