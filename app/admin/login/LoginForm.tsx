"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "../actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form className="admin-login-form" action={formAction}>
      <div className="form-group">
        <label htmlFor="password">Admin Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && <p className="admin-alert admin-alert-error">{state.error}</p>}
      <button
        type="submit"
        className="btn btn-primary btn-lg btn-block"
        disabled={pending}
      >
        {pending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
