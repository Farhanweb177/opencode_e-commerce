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
      <div className="admin-login-glow admin-login-glow-a" aria-hidden="true" />
      <div className="admin-login-glow admin-login-glow-b" aria-hidden="true" />

      <div className="admin-login-card">
        <span className="admin-login-badge">Restricted Area</span>

        <div className="admin-login-head">
          <span className="admin-login-logo" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="11"
                width="18"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M7 11V7a5 5 0 0 1 10 0v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
            </svg>
          </span>
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

        <p className="admin-login-secure-note">
          🔒 HMAC-signed session · 15-min lockout
        </p>
      </div>
    </div>
  );
}