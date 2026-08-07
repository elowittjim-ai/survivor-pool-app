"use client";

import { useActionState } from "react";
import { updatePassword } from "./actions";

const initialState = { error: null };

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <div className="sp-auth">
      <h1 className="sp-display sp-auth-title">SURVIVOR POOL</h1>
      <p className="sp-auth-sub">Set a new password.</p>

      {state?.error && <div className="sp-banner sp-banner-error">{state.error}</div>}

      <form action={formAction} className="sp-form" style={{ marginTop: 14 }}>
        <div className="sp-field">
          <label className="sp-label" htmlFor="new-password">New password</label>
          <input
            className="sp-input"
            id="new-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="sp-btn sp-btn-primary sp-btn-block" disabled={pending}>
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
