"use client";

import { useActionState } from "react";
import { askQuestion } from "./actions";

const initialState = { error: null, success: false };

export default function AskQuestionForm() {
  const [state, formAction, pending] = useActionState(askQuestion, initialState);

  return (
    <div className="sp-card">
      <div className="sp-section-title">✉️ Ask a question</div>
      <p className="sp-section-sub">Send a question straight to the commissioner.</p>
      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 10px" }}>{state.error}</div>}
      {state?.success && (
        <div className="sp-banner" style={{ margin: "0 0 10px", background: "var(--sp-teal-soft)", color: "#9fcfc0" }}>
          Sent! The commissioner will get back to you.
        </div>
      )}
      <form action={formAction} className="sp-form">
        <textarea
          className="sp-input"
          name="question"
          rows={3}
          placeholder="What's your question?"
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
        <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending}>
          {pending ? "Sending…" : "Send question"}
        </button>
      </form>
    </div>
  );
}
