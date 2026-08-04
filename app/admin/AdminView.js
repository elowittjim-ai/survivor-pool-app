"use client";

import { useActionState, useState } from "react";
import {
  approvePlayer,
  addContestant,
  closeWeek,
  declareWinner,
  promoteToAdmin,
  revokeAccess,
  bulkApprove,
  toggleMute,
  fixPick,
  fixContestantStatus,
} from "./actions";

const initialState = { error: null, success: false };

function ApproveRow({ player }) {
  const [state, formAction, pending] = useActionState(approvePlayer, initialState);
  if (state.success) return null;
  return (
    <div className="sp-row">
      <span>{player.display_name}</span>
      <form action={formAction}>
        <input type="hidden" name="profileId" value={player.id} />
        <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending}>
          {pending ? "Approving…" : "Approve"}
        </button>
      </form>
    </div>
  );
}

function BulkApproveCard() {
  const [state, formAction, pending] = useActionState(bulkApprove, initialState);
  return (
    <div className="sp-card">
      <div className="sp-section-title">Bulk-approve by email</div>
      <p className="sp-section-sub">
        Paste the emails of everyone whose buy-in you&apos;ve confirmed (one per line, or
        comma-separated). Anyone who&apos;s already signed up with a matching email gets
        approved in one go — this doesn&apos;t create accounts for people who haven&apos;t
        signed up yet.
      </p>
      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 10px" }}>{state.error}</div>}
      {state?.summary && (
        <div className="sp-banner" style={{ margin: "0 0 10px", background: "var(--sp-teal-soft)", color: "#9fcfc0" }}>
          {state.summary}
        </div>
      )}
      <form action={formAction} className="sp-form">
        <textarea
          className="sp-input"
          name="emails"
          rows={3}
          placeholder={"jane@example.com\njohn@example.com"}
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
        <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending}>
          {pending ? "Approving…" : "Bulk-approve"}
        </button>
      </form>
    </div>
  );
}

function PlayerRow({ player, isSelf }) {
  const [promoteState, promoteAction, promotePending] = useActionState(promoteToAdmin, initialState);
  const [revokeState, revokeAction, revokePending] = useActionState(revokeAccess, initialState);
  const [muteState, muteAction, mutePending] = useActionState(toggleMute, initialState);
  if (revokeState.success) return null;

  const muted = player.chat_muted;

  return (
    <div className="sp-row" style={{ flexWrap: "wrap" }}>
      <span>
        {player.display_name}
        {player.is_admin && (
          <span className="sp-pill" style={{ marginLeft: 8, background: "var(--sp-gold-soft)", color: "var(--sp-gold)" }}>
            Admin
          </span>
        )}
        {muted && (
          <span className="sp-pill" style={{ marginLeft: 8, background: "var(--sp-danger-soft)", color: "#f0a99e" }}>
            Muted
          </span>
        )}
      </span>
      <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!player.is_admin && (
          <form action={promoteAction}>
            <input type="hidden" name="profileId" value={player.id} />
            <button type="submit" className="sp-btn sp-btn-secondary" disabled={promotePending || promoteState.success}>
              {promoteState.success ? "Co-admin" : promotePending ? "…" : "Make co-admin"}
            </button>
          </form>
        )}
        {!isSelf && (
          <form action={muteAction}>
            <input type="hidden" name="profileId" value={player.id} />
            <input type="hidden" name="mute" value={(!muted).toString()} />
            <button type="submit" className="sp-btn sp-btn-secondary" disabled={mutePending}>
              {mutePending ? "…" : muted ? "Unmute" : "Mute in chat"}
            </button>
          </form>
        )}
        {!isSelf && (
          <form action={revokeAction}>
            <input type="hidden" name="profileId" value={player.id} />
            <button type="submit" className="sp-btn sp-btn-secondary" disabled={revokePending}>
              {revokePending ? "…" : "Revoke access"}
            </button>
          </form>
        )}
      </span>
      {(promoteState.error || revokeState.error || muteState.error) && (
        <div className="sp-banner sp-banner-error" style={{ marginTop: 8, width: "100%" }}>
          {promoteState.error || revokeState.error || muteState.error}
        </div>
      )}
    </div>
  );
}

function PlayersCard({ approvedPlayers, currentUserId }) {
  return (
    <div className="sp-card">
      <div className="sp-section-title">Players</div>
      <p className="sp-section-sub">
        Everyone with access to this season. Co-admins have the exact same admin powers as
        you — there&apos;s no reduced role.
      </p>
      {approvedPlayers.length === 0 ? (
        <p className="sp-section-sub">Nobody&apos;s been approved yet.</p>
      ) : (
        approvedPlayers.map((p) => (
          <PlayerRow key={p.id} player={p} isSelf={p.id === currentUserId} />
        ))
      )}
    </div>
  );
}

function CloseWeekCard({ currentWeek, activeContestants }) {
  const [staged, setStaged] = useState(new Set());
  const [state, formAction, pending] = useActionState(closeWeek, initialState);

  function toggle(id) {
    setStaged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="sp-card">
      <div className="sp-section-title">Record week {currentWeek} result</div>
      <p className="sp-section-sub">
        Check anyone voted out this episode, then close the week. Anyone who hasn&apos;t
        picked yet gets the alphabetical auto-pick automatically.
      </p>
      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 10px" }}>{state.error}</div>}
      {activeContestants.length === 0 && (
        <p className="sp-section-sub">No active contestants yet — add some in the Roster card below.</p>
      )}
      {activeContestants.map((c) => (
        <label key={c.id} className="sp-row" style={{ cursor: "pointer" }}>
          <span>
            {c.name} <span className="sp-c-sub">· {c.tribe || "—"}</span>
          </span>
          <input type="checkbox" checked={staged.has(c.id)} onChange={() => toggle(c.id)} />
        </label>
      ))}
      <form action={formAction} style={{ marginTop: 14 }}>
        {[...staged].map((id) => (
          <input key={id} type="hidden" name="eliminate" value={id} />
        ))}
        <button
          type="submit"
          className="sp-btn sp-btn-danger sp-btn-block"
          disabled={pending || activeContestants.length === 0}
        >
          {pending
            ? "Saving…"
            : staged.size === 0
              ? `Close week ${currentWeek}, no elimination`
              : `Save result & advance to week ${currentWeek + 1}`}
        </button>
      </form>
    </div>
  );
}

function RosterCard() {
  const [state, formAction, pending] = useActionState(addContestant, initialState);
  return (
    <div className="sp-card">
      <div className="sp-section-title">Roster</div>
      <p className="sp-section-sub">Add a contestant to this season&apos;s cast.</p>
      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 10px" }}>{state.error}</div>}
      <form action={formAction} className="sp-form" style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <input className="sp-input" style={{ flex: 2, minWidth: 140 }} name="name" placeholder="Contestant name" required />
        <input className="sp-input" style={{ flex: 1, minWidth: 100 }} name="tribe" placeholder="Tribe" />
        <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending}>
          {pending ? "Adding…" : "+ Add contestant"}
        </button>
      </form>
    </div>
  );
}

function FixPickCard({ approvedPlayers, allContestants, currentWeek }) {
  const [state, formAction, pending] = useActionState(fixPick, initialState);
  return (
    <div className="sp-card">
      <div className="sp-section-title">Fix a pick</div>
      <p className="sp-section-sub">
        Change what a player is on record as having picked for a given week — past or
        current. Overwrites whatever&apos;s there now.
      </p>
      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 10px" }}>{state.error}</div>}
      {state?.success && (
        <div className="sp-banner" style={{ margin: "0 0 10px", background: "var(--sp-teal-soft)", color: "#9fcfc0" }}>
          Saved.
        </div>
      )}
      <form action={formAction} className="sp-form" style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
        <div style={{ flex: 2, minWidth: 140 }}>
          <label className="sp-label" htmlFor="fix-pick-player">Player</label>
          <select id="fix-pick-player" name="playerId" className="sp-input" required defaultValue="">
            <option value="" disabled>Select a player</option>
            {approvedPlayers.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 80 }}>
          <label className="sp-label" htmlFor="fix-pick-week">Week</label>
          <input
            id="fix-pick-week"
            className="sp-input"
            name="week"
            type="number"
            min={1}
            max={currentWeek}
            defaultValue={currentWeek}
            required
          />
        </div>
        <div style={{ flex: 2, minWidth: 140 }}>
          <label className="sp-label" htmlFor="fix-pick-contestant">Contestant</label>
          <select id="fix-pick-contestant" name="contestantId" className="sp-input" required defaultValue="">
            <option value="" disabled>Select a contestant</option>
            {allContestants.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.status === "eliminated" ? " (out)" : ""}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending}>
          {pending ? "Saving…" : "Save correction"}
        </button>
      </form>
    </div>
  );
}

function FixContestantRow({ contestant }) {
  const [state, formAction, pending] = useActionState(fixContestantStatus, initialState);
  const [week, setWeek] = useState(contestant.eliminated_week || "");

  return (
    <div className="sp-row" style={{ flexWrap: "wrap" }}>
      <span>
        {contestant.name}{" "}
        <span className="sp-c-sub">
          {contestant.status === "eliminated" ? `· out week ${contestant.eliminated_week}` : "· active"}
        </span>
      </span>
      <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <form action={formAction} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="hidden" name="contestantId" value={contestant.id} />
          <input type="hidden" name="statusAction" value="eliminate" />
          <input
            className="sp-input"
            style={{ width: 64, padding: "6px 8px" }}
            type="number"
            name="week"
            min={1}
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            placeholder="wk"
          />
          <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending || !week}>
            {pending ? "…" : "Set eliminated"}
          </button>
        </form>
        {contestant.status === "eliminated" && (
          <form action={formAction}>
            <input type="hidden" name="contestantId" value={contestant.id} />
            <input type="hidden" name="statusAction" value="revert" />
            <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending}>
              {pending ? "…" : "Revert to active"}
            </button>
          </form>
        )}
      </span>
      {state?.error && (
        <div className="sp-banner sp-banner-error" style={{ marginTop: 8, width: "100%" }}>{state.error}</div>
      )}
    </div>
  );
}

function CorrectionsCard({ approvedPlayers, allContestants, recentCorrections, currentWeek }) {
  return (
    <div className="sp-card">
      <div className="sp-section-title">Corrections</div>
      <p className="sp-section-sub">
        Fix a mistake at any point in the season — nothing else needs recalculating by hand,
        every screen reads live from this data.
      </p>
      <FixPickCard approvedPlayers={approvedPlayers} allContestants={allContestants} currentWeek={currentWeek} />
      <div style={{ marginTop: 14 }}>
        <div className="sp-c-sub" style={{ marginBottom: 6 }}>Contestant status</div>
        {allContestants.map((c) => (
          <FixContestantRow key={c.id} contestant={c} />
        ))}
      </div>
      {recentCorrections.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="sp-c-sub" style={{ marginBottom: 6 }}>Recent corrections</div>
          {recentCorrections.map((c) => (
            <p key={c.id} className="sp-notice" style={{ textAlign: "left", margin: "4px 0" }}>
              {c.description}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function FinaleCard({ activeContestants, isComplete }) {
  const [state, formAction, pending] = useActionState(declareWinner, initialState);
  return (
    <div className="sp-card">
      <div className="sp-section-title">🏆 Finale: declare the winner</div>
      <p className="sp-section-sub">
        Whoever&apos;s still alive and picked this contestant at any point splits the pot.
      </p>
      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 10px" }}>{state.error}</div>}
      {isComplete && (
        <div className="sp-banner" style={{ margin: "0 0 14px", background: "var(--sp-teal-soft)", color: "#9fcfc0" }}>
          Season winner is already locked in.
        </div>
      )}
      <div className="sp-grid-2">
        {activeContestants.map((c) => (
          <form action={formAction} key={c.id}>
            <input type="hidden" name="contestantId" value={c.id} />
            <button
              type="submit"
              className="sp-contestant"
              style={{ width: "100%", border: "1px solid var(--sp-border)" }}
              disabled={pending}
            >
              <div className="sp-avatar">{c.name.slice(0, 2).toUpperCase()}</div>
              <p className="sp-c-name">{c.name}</p>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}

export default function AdminView({
  pendingPlayers,
  approvedPlayers,
  currentUserId,
  activeContestants,
  allContestants,
  recentCorrections,
  currentWeek,
  isComplete,
}) {
  return (
    <div>
      {pendingPlayers.length > 0 && (
        <div className="sp-card">
          <div className="sp-section-title">Pending approvals</div>
          <p className="sp-section-sub">Confirm their $25 Venmo buy-in, then approve.</p>
          {pendingPlayers.map((p) => (
            <ApproveRow key={p.id} player={p} />
          ))}
        </div>
      )}
      <BulkApproveCard />
      <PlayersCard approvedPlayers={approvedPlayers} currentUserId={currentUserId} />
      <CloseWeekCard currentWeek={currentWeek} activeContestants={activeContestants} />
      <RosterCard />
      <CorrectionsCard
        approvedPlayers={approvedPlayers}
        allContestants={allContestants}
        recentCorrections={recentCorrections}
        currentWeek={currentWeek}
      />
      <FinaleCard activeContestants={activeContestants} isComplete={isComplete} />
    </div>
  );
}
