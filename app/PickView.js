"use client";

import { useActionState, useState } from "react";
import { submitPick } from "./actions";

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

const initialState = { error: null, success: false };

export default function PickView({ week, contestants, usedIds, clearedBoard, currentPickId, currentPickName }) {
  const [selectedId, setSelectedId] = useState(currentPickId || null);
  const [state, formAction, pending] = useActionState(submitPick, initialState);

  const usedSet = new Set(usedIds);
  const selectedContestant = contestants.find((c) => c.id === selectedId) || null;

  return (
    <div className="sp-card">
      <div className="sp-section-title">Week {week} pick</div>
      <p className="sp-section-sub">
        Who do you think survives this episode? Tap to select, then submit.
      </p>

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
          const isUsed = usedSet.has(c.id) && !clearedBoard && c.id !== selectedId;
          const selected = selectedId === c.id;
          return (
            <div
              key={c.id}
              className={
                "sp-contestant" +
                (selected ? " sp-contestant-selected" : "") +
                (isUsed ? " sp-contestant-disabled" : "")
              }
              onClick={() => {
                if (!isUsed) setSelectedId(c.id);
              }}
            >
              <div className="sp-avatar">{initials(c.name)}</div>
              <p className="sp-c-name" style={selected ? { color: "var(--sp-ember)" } : undefined}>
                {c.name}
              </p>
              <p className="sp-c-sub">{isUsed ? "Already picked" : (c.tribe || "—") + " tribe"}</p>
            </div>
          );
        })}
      </div>

      <form action={formAction} style={{ marginTop: 14 }}>
        <input type="hidden" name="contestantId" value={selectedId || ""} />
        <button
          type="submit"
          className="sp-btn sp-btn-primary sp-btn-block"
          disabled={!selectedContestant || pending}
        >
          {pending
            ? "Submitting…"
            : selectedContestant
              ? `Submit pick: ${selectedContestant.name}`
              : "Select a contestant to submit"}
        </button>
      </form>

      {(currentPickName || state?.success) && (
        <p className="sp-notice" style={{ marginTop: 14 }}>
          Locked in: <strong style={{ color: "var(--sp-text)" }}>
            {selectedContestant ? selectedContestant.name : currentPickName}
          </strong>
          . You can change your selection and submit again any time before the admin
          closes the week.
        </p>
      )}
    </div>
  );
}
