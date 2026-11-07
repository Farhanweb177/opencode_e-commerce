import Link from "next/link";
import { requireAdmin, isAdminConfigured } from "@/lib/admin-auth";
import { isAdminReady, isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "../actions";
import { AdminNav } from "./AdminNav";
import { AdminOrdersNotifier } from "./AdminOrdersNotifier";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="admin-shell">
      <AdminOrdersNotifier enabled={isSupabaseConfigured()} />

      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-badge">A</span>
          <span>
            All in One
            <small>Admin Panel</small>
          </span>
        </Link>

        <AdminNav />

        <div className="admin-sidebar-footer">
          <p className="admin-user-email" title={user.email ?? ""}>
            👤 {user.email}
          </p>
          <form action={signOut}>
            <button type="submit" className="admin-signout-btn">
              Logout
            </button>
          </form>
          <Link href="/" className="admin-store-link">
            🛍️ View Store
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        {!isAdminConfigured() && (
          <div className="admin-alert admin-alert-warn">
            Admin password setup nahi hai — changes save nahi honge.
            <code>.env.local</code> mein <code>ADMIN_PASSWORD</code> set karein.
          </div>
        )}
        {isSupabaseConfigured() && !isAdminReady() && (
          <div className="admin-alert admin-alert-warn">
            <code>SUPABASE_SERVICE_ROLE_KEY</code> set nahi hai — admin se
            products/orders save nahi honge. Settings → API se service role key
            add karein.
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
