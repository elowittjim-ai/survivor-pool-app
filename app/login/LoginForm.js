"use client";

import { useActionState, useState } from "react";
import { login, signup, requestPasswordReset } from "./actions";

const initialState = { error: null, success: null };

export default function LoginForm() {
  const [tab, setTab] = useState("login");
  const [showForgot, setShowForgot] = useState(false);
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signup, initialState);
  const [forgotState, forgotAction, forgotPending] = useActionState(requestPasswordReset, initialState);

  const state = showForgot ? forgotState : tab === "login" ? loginState : signupState;

  return (
    <div className="sp-auth">
      <h1 className="sp-display sp-auth-title">SURVIVOR POOL</h1>
      <p className="sp-auth-sub">
        {showForgot
          ? "Reset your password."
          : tab === "login"
            ? "Welcome back."
            : "Set up your account to join the pool."}
      </p>

      {!showForgot && (
        <div className="sp-auth-tabs">
          <button
            type="button"
            className={"sp-auth-tab" + (tab === "login" ? " sp-auth-tab-active" : "")}
            onClick={() => setTab("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className={"sp-auth-tab" + (tab === "signup" ? " sp-auth-tab-active" : "")}
            onClick={() => setTab("signup")}
          >
            Sign up
          </button>
        </div>
      )}

      {state?.error && <div className="sp-banner sp-banner-error">{state.error}</div>}
      {state?.success && (
        <div className="sp-banner" style={{ background: "var(--sp-teal-soft)", color: "#9fcfc0" }}>
          {state.success}
        </div>
      )}

      {showForgot ? (
        <form action={forgotAction} className="sp-form" style={{ marginTop: 14 }}>
          <div className="sp-field">
            <label className="sp-label" htmlFor="forgot-email">Email</label>
            <input className="sp-input" id="forgot-email" name="email" type="email" required autoComplete="email" />
          </div>
          <button type="submit" className="sp-btn sp-btn-primary sp-btn-block" disabled={forgotPending}>
            {forgotPending ? "Sending…" : "Send reset link"}
          </button>
          <button
            type="button"
            className="sp-btn sp-btn-secondary sp-btn-block"
            onClick={() => setShowForgot(false)}
          >
            Back to log in
          </button>
        </form>
      ) : tab === "login" ? (
        <form action={loginAction} className="sp-form" style={{ marginTop: 14 }}>
          <div className="sp-field">
            <label className="sp-label" htmlFor="login-email">Email</label>
            <input className="sp-input" id="login-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="sp-field">
            <label className="sp-label" htmlFor="login-password">Password</label>
            <input className="sp-input" id="login-password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <button type="submit" className="sp-btn sp-btn-primary sp-btn-block" disabled={loginPending}>
            {loginPending ? "Logging in…" : "Log in"}
          </button>
          <button
            type="button"
            className="sp-btn sp-btn-secondary sp-btn-block"
            onClick={() => setShowForgot(true)}
          >
            Forgot password?
          </button>
        </form>
      ) : (
        <form action={signupAction} className="sp-form" style={{ marginTop: 14 }}>
          <div className="sp-field">
            <label className="sp-label" htmlFor="signup-name">Your name</label>
            <input className="sp-input" id="signup-name" name="displayName" type="text" required autoComplete="name" placeholder="What the group calls you" />
          </div>
          <div className="sp-field">
            <label className="sp-label" htmlFor="signup-email">Email</label>
            <input className="sp-input" id="signup-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="sp-field">
            <label className="sp-label" htmlFor="signup-password">Password</label>
            <input className="sp-input" id="signup-password" name="password" type="password" required autoComplete="new-password" minLength={8} />
          </div>
          <button type="submit" className="sp-btn sp-btn-primary sp-btn-block" disabled={signupPending}>
            {signupPending ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      <p className="sp-notice">
        Creating an account doesn&apos;t get you into the pool yet — the commissioner
        approves everyone by hand after your $25 Venmo buy-in.
      </p>
    </div>
  );
}
