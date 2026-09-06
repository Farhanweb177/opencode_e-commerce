import Link from "next/link";
import type { Metadata } from "next";
import { isAdminConfigured } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login – All in One",
};

export default function AdminLoginPage() {
  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-head">
          <span className="admin-login-logo">⚙️</span>
          <h1>Admin Panel</h1>
          <p>All in One Store — Management Console</p>
        </div>

        {!isAdminConfigured() ? (
          <div className="admin-alert admin-alert-warn">
            <strong>Admin setup baqi hai.</strong>
            <p>
              Pehle <code>.env.local</code> file mein <code>ADMIN_PASSWORD</code>{" "}
              add karein, phir dev server restart karein.
            </p>
          </div>
        ) : (
          <LoginForm />
        )}

        <Link href="/" className="admin-back-link">
          ← Store par wapas jayein
        </Link>
      </div>
    </div>
  );
}
