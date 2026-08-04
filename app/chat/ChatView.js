"use client";

import { useActionState } from "react";
import { postMessage, deleteMessage } from "./actions";

const initialState = { error: null, success: false };

function timeLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function MessageRow({ message, isAdmin }) {
  const [state, formAction, pending] = useActionState(deleteMessage, initialState);
  if (state.success) return null;

  const authorIsAdmin = !!message.profiles?.is_admin;

  return (
    <div
      className="sp-row"
      style={{
        flexDirection: "column",
        alignItems: "stretch",
        opacity: message.deleted ? 0.5 : 1,
        background: authorIsAdmin ? "var(--sp-gold-soft)" : undefined,
        borderRadius: authorIsAdmin ? 8 : undefined,
        padding: authorIsAdmin ? "8px 10px" : undefined,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span>
          <strong style={authorIsAdmin ? { color: "var(--sp-gold)" } : undefined}>
            {message.profiles?.display_name || "Unknown"}
          </strong>{" "}
          {authorIsAdmin && (
            <span className="sp-pill" style={{ background: "var(--sp-gold-soft)", color: "var(--sp-gold)" }}>
              Commissioner
            </span>
          )}{" "}
          <span className="sp-c-sub">{timeLabel(message.created_at)}</span>
          {message.flagged && isAdmin && (
            <span className="sp-pill" style={{ marginLeft: 8, background: "var(--sp-danger-soft)", color: "#f0a99e" }}>
              🚩 Flagged
            </span>
          )}
          {message.deleted && (
            <span className="sp-c-sub" style={{ marginLeft: 8 }}>(deleted)</span>
          )}
        </span>
        {isAdmin && !message.deleted && (
          <form action={formAction}>
            <input type="hidden" name="messageId" value={message.id} />
            <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending} style={{ padding: "4px 10px", fontSize: 11 }}>
              {pending ? "…" : "Delete"}
            </button>
          </form>
        )}
      </div>
      <p style={{ margin: "4px 0 0", fontSize: 14 }}>{message.content}</p>
    </div>
  );
}

export default function ChatView({ messages, currentUserId, isAdmin, isMuted }) {
  const [state, formAction, pending] = useActionState(postMessage, initialState);

  return (
    <div className="sp-card">
      <div className="sp-section-title">Season chat</div>
      <p className="sp-section-sub">
        Talk trash, celebrate, commiserate — everyone with access to this season sees this,
        eliminated or not.
      </p>

      {messages.length === 0 ? (
        <p className="sp-section-sub">No messages yet — be the first to say something.</p>
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto", marginBottom: 14 }}>
          {messages.map((m) => (
            <MessageRow key={m.id} message={m} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 10px" }}>{state.error}</div>}

      {isMuted ? (
        <p className="sp-notice">You&apos;ve been muted in this chat by the admin.</p>
      ) : (
        <form action={formAction} style={{ display: "flex", gap: 8 }}>
          <input
            className="sp-input"
            style={{ flex: 1 }}
            name="content"
            placeholder="Say something…"
            autoComplete="off"
            required
          />
          <button type="submit" className="sp-btn sp-btn-primary" disabled={pending}>
            {pending ? "…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
