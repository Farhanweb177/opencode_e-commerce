"use client";

import { useState } from "react";
import { useActionState } from "react";
import { signIn, type LoginState } from "../actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [show, setShow] = useState(false);

  return (
    <form className="admin-login-form" action={formAction}>
      <div className="form-group">
        <label htmlFor="password">Admin Password</label>
        <div className="admin-password-input">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            placeholder="Enter admin password"
            autoComplete="current-password"
            autoFocus
            required
          />
          <button
            type="button"
            className="admin-password-toggle"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="1"
                  y1="1"
                  x2="23"
                  y2="23"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {state.error && <p className="admin-alert admin-alert-error">{state.error}</p>}

      <button
        type="submit"
        className="btn btn-primary btn-lg btn-block admin-login-btn"
        disabled={pending}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5 -5 -5 -5M15 12H3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {pending ? "Logging in..." : "Login to Dashboard"}
      </button>
    </form>
  );
}