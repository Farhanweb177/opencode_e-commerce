import Link from "next/link";
import {
  getOrders,
  getOrderCountsByStatus,
  getProductCount,
} from "@/lib/admin-queries";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { SeedButton } from "./SeedButton";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default async function AdminDashboardPage() {
  const [orders, statusCounts, productCount] = await Promise.all([
    getOrders(),
    getOrderCountsByStatus(),
    getProductCount(),
  ]);

  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Store ki overall performance ek nazar mein</p>
        </div>
        <SeedButton />
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">🧾</span>
          <strong>{orders.length}</strong>
          <span>Total Orders</span>
        </div>
        <div className="stat-card stat-accent">
          <span className="stat-icon">⏳</span>
          <strong>{statusCounts.pending}</strong>
          <span>Pending Orders</span>
        </div>
        <div className="stat-card stat-success">
          <span className="stat-icon">💰</span>
          <strong>{formatPrice(revenue)}</strong>
          <span>Total Revenue</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📦</span>
          <strong>{productCount}</strong>
          <span>Products</span>
        </div>
      </div>

      <div className="status-breakdown">
        {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
          <span key={status} className={`status-chip status-${status}`}>
            {STATUS_LABELS[status]}: {statusCounts[status]}
          </span>
        ))}
      </div>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Recent Orders</h2>
          <Link href="/admin/orders" className="view-all">
            View All →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="admin-empty">
            Abhi tak koi order nahi aya. Jab customer order karega, wo yahan
            nazar aayega.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>City</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="mono">{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.city}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td>
                    {new Date(order.created_at).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
