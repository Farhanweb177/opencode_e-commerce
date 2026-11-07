"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Mode = "signin" | "signup" | "forgot" | "recovery";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  // Password reset email ka link /login par #access_token + type=recovery
  // ke saath wapas aata hai — us waqt naya password set karne ka form dikhao.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setMessage({
        ok: false,
        text: "Supabase configured nahi hai. .env.local check karein.",
      });
      return;
    }
    setPending(true);
    setMessage(null);

    try {
      const supabase = createClient();

      if (mode === "recovery") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setMessage({ ok: false, text: error.message });
        } else {
          setMessage({
            ok: true,
            text: "Password update ho gaya! Ab naye password se sign in karein.",
          });
          await supabase.auth.signOut();
          setPassword("");
          setMode("signin");
        }
        return;
      }

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) {
          setMessage({ ok: false, text: error.message });
        } else {
          setMessage({
            ok: true,
            text: "Password reset link aapke email mein bhej diya gaya hai. Check karein!",
          });
        }
        return;
      }

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setMessage({
            ok: false,
            text: error.message.includes("Invalid login")
              ? "Email ya password ghalat hai."
              : error.message,
          });
        } else {
          router.push("/account");
          router.refresh();
        }
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMessage({ ok: false, text: error.message });
        } else {
          setMessage({
            ok: true,
            text: "Account ban gaya! Apne email mein confirmation check karein, phir login karein.",
          });
          setMode("signin");
        }
      }
    } catch (error) {
      console.error("[auth] request failed:", error);
      setMessage({
        ok: false,
        text: "Server se connect nahi ho paya. Internet/Supabase check karein.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="container section auth-page">
      <div className="auth-card">
        <span className="auth-logo">
          {mode === "forgot" || mode === "recovery" ? "🔑" : "👤"}
        </span>
        <h1>
          {mode === "signin"
            ? "Sign In"
            : mode === "signup"
              ? "Create Account"
              : mode === "recovery"
                ? "Set New Password"
                : "Reset Password"}
        </h1>
        <p className="auth-sub">
          {mode === "signin"
            ? "Apne orders track karne aur faster checkout ke liye login karein"
            : mode === "signup"
              ? "Orders history aur faster checkout ke liye account banayein"
              : mode === "recovery"
                ? "Apna naya password set karein"
                : "Apna email likhein — password reset link bhejenge"}
        </p>

        {!isSupabaseConfigured() ? (
          <div className="auth-note">
            <p>
              Supabase configured nahi hai — login available nahi.
              <code>.env.local</code> mein credentials daalein.
            </p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {mode !== "recovery" && (
              <div className="form-group">
                <label htmlFor="auth-email">Email *</label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aapka@email.com"
                  required
                />
              </div>
            )}
            {mode !== "forgot" && (
              <div className="form-group">
                <label htmlFor="auth-password">
                  {mode === "recovery" ? "New Password *" : "Password *"}
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  minLength={6}
                  required
                />
              </div>
            )}
            {message && (
              <p className={message.ok ? "review-msg ok" : "review-msg error"}>
                {message.text}
              </p>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={
                pending ||
                (mode !== "recovery" && !email) ||
                (mode !== "forgot" && !password)
              }
            >
              {pending
                ? "Processing..."
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : mode === "recovery"
                      ? "Update Password"
                      : "Reset Password Link Bhejein"}
            </button>
          </form>
        )}

        <div className="auth-switch">
          {mode === "signin" && (
            <>
              <p>
                Naye hain?{" "}
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </p>
              <p style={{ marginTop: "8px" }}>
                <button
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => setMode("forgot")}
                >
                  Forgot Password?
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p>
              Pehle se account hai?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              Password yaad hai?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </p>
          )}
          {mode === "recovery" && (
            <p>
              Password change nahi karna?{" "}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        <p className="auth-track-link">
          Order tracking ke liye login zaroori nahi —{" "}
          <Link href="/track" className="view-all">
            Track Order
          </Link>{" "}
          page use karein.
        </p>
      </div>
    </section>
  );
}