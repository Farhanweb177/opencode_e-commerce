import Link from "next/link";
import { getOrders } from "@/lib/admin-queries";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";
import { isAdminConfigured } from "@/lib/admin-auth";
import { DeleteButton } from "../DeleteButton";
import {
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
} from "./actions";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  "pending",
  "received",
  "failed",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment Pending",
  received: "Payment Received",
  failed: "Payment Failed",
};

export default async function AdminOrdersPage({
  searchParams,
}: PageProps<"/admin/orders">) {
  const { status } = await searchParams;
  const orders = await getOrders();

  const filter =
    (status as OrderStatus | undefined) &&
    STATUS_OPTIONS.includes(status as OrderStatus)
      ? (status as OrderStatus)
      : null;

  const filtered = filter
    ? orders.filter((o) => o.status === filter)
    : orders;

  const revenue = filtered
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>Orders</h1>
          <p>
            {filtered.length} orders · Revenue {formatPrice(revenue)}
          </p>
        </div>
      </header>

      {!isAdminConfigured() && (
        <p className="admin-alert admin-alert-warn">
          Database connected nahi — orders tab nazar aayenge jab setup ho jaye.
        </p>
      )}

      <div className="status-filter-bar">
        <Link
          href="/admin/orders"
          className={!filter ? "status-chip active" : "status-chip"}
        >
          All ({orders.length})
        </Link>
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={
              filter === s ? `status-chip active status-${s}` : `status-chip status-${s}`
            }
          >
            {STATUS_LABELS[s]} ({orders.filter((o) => o.status === s).length})
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <section className="admin-card">
          <p className="admin-empty-box">
            Koi order nahi mila. Customer checkout karega to order yahan aayega.
          </p>
        </section>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <details className="admin-card order-card">
      <summary>
        <span className="order-summary-main">
          <strong className="mono">{order.order_number}</strong>
          <span>{order.customer_name}</span>
          <small>{order.city}</small>
        </span>
        <span className="order-summary-side">
          <strong>{formatPrice(order.total)}</strong>
          <span className={`status-badge status-${order.status}`}>
            {STATUS_LABELS[order.status]}
          </span>
          <span
            className={`status-badge payment-${order.payment_status}`}
            title="Payment status"
          >
            {PAYMENT_STATUS_LABELS[order.payment_status]}
          </span>
          <small>
            {new Date(order.created_at).toLocaleString("en-PK", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
        </span>
      </summary>

      <div className="order-detail">
        <div className="order-detail-info">
          <h4>Customer</h4>
          <p>
            👤 {order.customer_name}
            <br />
            📞 {order.phone}
            <br />📍 {order.address}, {order.city}
            <br />
            💳 {order.payment_method}
          </p>
        </div>

        <div className="order-detail-items">
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
              <span>
                Discount
                {order.coupon_code ? ` (${order.coupon_code})` : ""}
              </span>
              <span>− {formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="order-detail-actions">
          <h4>Status Update</h4>
          <form action={updateOrderStatus} className="order-status-form">
            <input type="hidden" name="id" value={order.id} />
            <select name="status" defaultValue={order.status}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary btn-sm">
              Update
            </button>
          </form>

          <h4>Payment Status</h4>
          <form action={updatePaymentStatus} className="order-status-form">
            <input type="hidden" name="id" value={order.id} />
            <select name="paymentStatus" defaultValue={order.payment_status}>
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-outline btn-sm">
              Update Payment
            </button>
          </form>

          <DeleteButton
            id={order.id}
            serverAction={deleteOrder}
            confirmText={`Order ${order.order_number} delete karna hai?`}
          />
        </div>
      </div>
    </details>
  );
}
