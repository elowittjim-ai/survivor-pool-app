"use client";

import { useActionState, useState, useEffect } from "react";
import { submitPick } from "./actions";
import { tribeColor } from "./tribeColor";

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

const initialState = { error: null, success: false };

export default function PickView({
  week,
  contestants,
  usedIds,
  clearedBoard,
  currentPickId,
  currentPickName,
  picksLocked,
}) {
  const [state, formAction, pending] = useActionState(submitPick, initialState);
  const [pendingId, setPendingId] = useState(null);

  // formAction's async work has settled (success or error) once pending
  // drops back to false — either way the tap-in-progress is over.
  useEffect(() => {
    if (!pending) setPendingId(null);
  }, [pending]);

  function pick(contestantId) {
    setPendingId(contestantId);
    const formData = new FormData();
    formData.append("contestantId", contestantId);
    formAction(formData);
  }

  if (week === 1) {
    return (
      <div className="sp-card">
        <div className="sp-section-title">Week 1</div>
        <div
          className="sp-banner"
          style={{ margin: 0, background: "var(--sp-gold-soft)", color: "#e9c77a" }}
        >
          No picks in week 1 — it&apos;s just to get a feel for the new season. Picks start
          week 2!
        </div>
      </div>
    );
  }

  if (picksLocked) {
    return (
      <div className="sp-card">
        <div className="sp-section-title">Week {week} pick</div>
        {currentPickId ? (
          <div
            className="sp-banner"
            style={{ margin: 0, background: "var(--sp-teal-soft)", color: "#9fcfc0" }}
          >
            🔒 Picks are locked for this week. Your pick: <strong>{currentPickName}</strong>.
          </div>
        ) : (
          <div className="sp-banner sp-banner-error" style={{ margin: 0 }}>
            🔒 Picks are locked and you didn&apos;t submit one in time — you&apos;ll get an
            automatic pick when the admin records this week&apos;s result.
          </div>
        )}
      </div>
    );
  }

  const usedSet = new Set(usedIds);

  return (
    <div className="sp-card">
      <div className="sp-section-title">Week {week} pick</div>
      <p className="sp-section-sub">
        Who do you think survives this episode? Tap a contestant to lock in your pick.
      </p>

      {currentPickId && (
        <div
          className="sp-banner"
          style={{ margin: "0 0 14px", background: "var(--sp-teal-soft)", color: "#9fcfc0" }}
        >
          🔒 Locked in: <strong>{currentPickName}</strong>. Tap another contestant anytime
          before the admin closes the week to change it.
        </div>
      )}

      {clearedBoard && (
        <div
          className="sp-banner"
          style={{ margin: "0 0 14px", background: "var(--sp-gold-soft)", color: "#e9c77a" }}
        >
          You&apos;ve used every contestant at least once — the board is cleared, so
          everyone&apos;s eligible again, including ones you&apos;ve already picked before.
        </div>
      )}

      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 14px" }}>{state.error}</div>}

      <div className="sp-grid-2">
        {contestants.map((c) => {
          const isCurrent = currentPickId === c.id;
          const isUsed = usedSet.has(c.id) && !clearedBoard && !isCurrent;
          const isPending = pendingId === c.id;
          const isClickable = !isUsed && !isCurrent && !pending;
          return (
            <div
              key={c.id}
              className={
                "sp-contestant" +
                (isCurrent ? " sp-contestant-selected" : "") +
                (isUsed || (pending && !isPending) ? " sp-contestant-disabled" : "")
              }
              onClick={() => {
                if (isClickable) pick(c.id);
              }}
            >
              <div className="sp-avatar">
                {c.photo_url ? <img src={c.photo_url} alt={c.name} /> : initials(c.name)}
              </div>
              <p className="sp-c-name" style={isCurrent ? { color: "var(--sp-ember)" } : undefined}>
                {c.name}
              </p>
              <p
                className="sp-c-sub"
                style={isUsed ? undefined : { fontSize: 13, fontWeight: 700, color: tribeColor(c.tribe) }}
              >
                {isPending ? "Submitting…" : isCurrent ? "Your pick" : isUsed ? "Already picked" : (c.tribe || "—") + " tribe"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
