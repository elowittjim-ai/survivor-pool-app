"use client";

import { useActionState, useState, useEffect } from "react";
import { submitPick } from "./actions";

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

const initialState = { error: null, success: false };

export default function PickView({ week, contestants, usedIds, clearedBoard, currentPickId, currentPickName }) {
  const [selectedId, setSelectedId] = useState(currentPickId || null);
  const [lockedId, setLockedId] = useState(currentPickId || null);
  const [lockedName, setLockedName] = useState(currentPickName || null);
  const [state, formAction, pending] = useActionState(submitPick, initialState);

  // useActionState hands back a fresh object on every dispatch, so this
  // fires once per successful submit — even a second success right after
  // the first (e.g. changing an already-locked pick again).
  useEffect(() => {
    if (state.success) {
      setLockedId(selectedId);
      setLockedName(contestants.find((c) => c.id === selectedId)?.name ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const usedSet = new Set(usedIds);
  const selectedContestant = contestants.find((c) => c.id === selectedId) || null;
  const hasUnsavedChange = selectedId !== lockedId;

  return (
    <div className="sp-card">
      <div className="sp-section-title">Week {week} pick</div>
      <p className="sp-section-sub">
        Who do you think survives this episode? Tap to select, then submit.
      </p>

      {lockedId && !hasUnsavedChange && (
        <div
          className="sp-banner"
          style={{ margin: "0 0 14px", background: "var(--sp-teal-soft)", color: "#9fcfc0" }}
        >
          🔒 Locked in: <strong>{lockedName}</strong>. You can change your pick anytime
          before the admin closes the week.
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
              <div className="sp-avatar">
                {c.photo_url ? <img src={c.photo_url} alt={c.name} /> : initials(c.name)}
              </div>
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
          className={
            "sp-btn sp-btn-block " + (hasUnsavedChange ? "sp-btn-primary" : "sp-btn-secondary")
          }
          disabled={!selectedContestant || pending || !hasUnsavedChange}
        >
          {pending
            ? "Submitting…"
            : !selectedContestant
              ? "Select a contestant to submit"
              : hasUnsavedChange
                ? `Submit pick: ${selectedContestant.name}`
                : `✓ Locked in: ${selectedContestant.name}`}
        </button>
      </form>
    </div>
  );
}
