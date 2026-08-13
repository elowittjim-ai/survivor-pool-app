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
  updateCommissionerMessage,
  lockPicks,
  updateContestantTribe,
  markQuestionAnswered,
  updateTotalPrizePool,
} from "./actions";

const initialState = { error: null, success: false };

function CommissionerMessageCard({ currentMessage }) {
  const [state, formAction, pending] = useActionState(updateCommissionerMessage, initialState);
  return (
    <div className="sp-card">
      <div className="sp-section-title">📣 Message from the Commissioner</div>
      <p className="sp-section-sub">
        Shown on everyone&apos;s Home screen. Leave it blank to hide the section entirely.
      </p>
      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 10px" }}>{state.error}</div>}
      {state?.success && (
        <div className="sp-banner" style={{ margin: "0 0 10px", background: "var(--sp-teal-soft)", color: "#9fcfc0" }}>
          Saved.
        </div>
      )}
      <form action={formAction} className="sp-form">
        <textarea
          className="sp-input"
          name="message"
          rows={3}
          defaultValue={currentMessage || ""}
          placeholder="e.g. Reminder: picks lock Sunday 8pm before the episode airs!"
          style={{ resize: "vertical", fontFamily: "inherit" }}
        />
        <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending}>
          {pending ? "Saving…" : "Save message"}
        </button>
      </form>
    </div>
  );
}

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

function QuestionRow({ question }) {
  const [state, formAction, pending] = useActionState(markQuestionAnswered, initialState);
  const isAnswered = question.answered || state.success;

  return (
    <div className="sp-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <strong>{question.profiles?.display_name || "Unknown player"}</strong>
        <span className="sp-c-sub">{new Date(question.created_at).toLocaleDateString()}</span>
      </div>
      <p className="sp-section-sub" style={{ margin: 0 }}>{question.question}</p>
      {isAnswered ? (
        <span className="sp-c-sub">✓ Answered</span>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="questionId" value={question.id} />
          <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending}>
            {pending ? "…" : "Mark answered"}
          </button>
        </form>
      )}
    </div>
  );
}

function QuestionsCard({ questions }) {
  const unansweredCount = questions.filter((q) => !q.answered).length;

  if (questions.length === 0) return null;

  return (
    <div className="sp-card">
      <div className="sp-section-title">✉️ Player questions</div>
      <p className="sp-section-sub">
        {unansweredCount === 0 ? "No open questions." : `${unansweredCount} waiting on a reply.`}
      </p>
      {questions.map((q) => (
        <QuestionRow key={q.id} question={q} />
      ))}
    </div>
  );
}

function BulkApproveCard() {
  const [state, formAction, pending] = useActionState(bulkApprove, initialState);
  return (
    <div className="sp-card">
      <div className="sp-section-title">Approve by email</div>
      <p className="sp-section-sub">
        Paste the emails of everyone whose buy-in you&apos;ve confirmed (one per line, or
        comma-separated) — works whether they&apos;ve already signed up or not. Already
        signed up? Approved instantly. Haven&apos;t signed up yet? They&apos;re cleared in
        advance and get approved automatically the moment they do.
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

function CurrentPicksCard({ approvedPlayers, currentWeekPicks, currentWeek }) {
  const pickByPlayer = new Map(currentWeekPicks.map((p) => [p.player_id, p.contestants?.name]));
  const pickedCount = approvedPlayers.filter((p) => pickByPlayer.has(p.id)).length;

  return (
    <div className="sp-card">
      <div className="sp-section-title">Week {currentWeek} picks so far</div>
      <p className="sp-section-sub">
        {pickedCount} of {approvedPlayers.length} players have picked.
      </p>
      {approvedPlayers.length === 0 ? (
        <p className="sp-section-sub">No approved players yet.</p>
      ) : (
        approvedPlayers.map((p) => {
          const pick = pickByPlayer.get(p.id);
          return (
            <div key={p.id} className="sp-row">
              <span>{p.display_name}</span>
              {pick ? (
                <span>{pick}</span>
              ) : (
                <span
                  className="sp-pill"
                  style={{ background: "var(--sp-surface-2)", color: "var(--sp-text-muted)" }}
                >
                  Not picked yet
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function LockPicksCard({ currentWeek, picksLocked }) {
  const [state, formAction, pending] = useActionState(lockPicks, initialState);
  const [skipAutoPick, setSkipAutoPick] = useState(false);

  return (
    <div className="sp-card">
      <div className="sp-section-title">Step 1: Lock week {currentWeek} picks</div>
      <p className="sp-section-sub">
        {picksLocked
          ? "Locked — nobody can submit or change a pick until you record this week's result and move to the next week."
          : "Players can still change their pick. Lock it once the deadline passes (e.g. Monday morning) so nobody can sneak in a late change — anyone who hasn't picked yet gets the alphabetical auto-pick at the same time."}
      </p>
      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 10px" }}>{state.error}</div>}
      {picksLocked ? (
        <div className="sp-banner" style={{ margin: 0, background: "var(--sp-teal-soft)", color: "#9fcfc0" }}>
          🔒 Picks are locked
        </div>
      ) : (
        <form action={formAction}>
          <label className="sp-row" style={{ cursor: "pointer", border: "none", padding: "0 0 10px" }}>
            <span className="sp-c-sub">No picks this week (e.g. week 1) — skip auto-pick</span>
            <input
              type="checkbox"
              name="skipAutoPick"
              value="true"
              checked={skipAutoPick}
              onChange={(e) => setSkipAutoPick(e.target.checked)}
            />
          </label>
          <button type="submit" className="sp-btn sp-btn-primary sp-btn-block" disabled={pending}>
            {pending ? "Locking…" : `🔒 Lock week ${currentWeek} picks`}
          </button>
        </form>
      )}
    </div>
  );
}

function CloseWeekCard({ currentWeek, activeContestants }) {
  const [staged, setStaged] = useState(new Set());
  const [skipAutoPick, setSkipAutoPick] = useState(false);
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
      <div className="sp-section-title">Step 2: Record week {currentWeek} result</div>
      <p className="sp-section-sub">
        After the episode airs — check anyone voted out, then close the week to open up
        next week&apos;s picks. (Anyone who somehow still hasn&apos;t picked gets the
        alphabetical auto-pick here too, as a backup.)
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
      <label className="sp-row" style={{ cursor: "pointer", border: "none", padding: "9px 0 0" }}>
        <span className="sp-c-sub">No picks this week (e.g. week 1) — skip auto-pick</span>
        <input
          type="checkbox"
          checked={skipAutoPick}
          onChange={(e) => setSkipAutoPick(e.target.checked)}
        />
      </label>
      <form action={formAction} style={{ marginTop: 14 }}>
        {[...staged].map((id) => (
          <input key={id} type="hidden" name="eliminate" value={id} />
        ))}
        {skipAutoPick && <input type="hidden" name="skipAutoPick" value="true" />}
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
  const [statusState, statusAction, statusPending] = useActionState(fixContestantStatus, initialState);
  const [tribeState, tribeAction, tribePending] = useActionState(updateContestantTribe, initialState);
  const [week, setWeek] = useState(contestant.eliminated_week || "");
  const [tribe, setTribe] = useState(contestant.tribe || "");

  return (
    <div className="sp-row" style={{ flexWrap: "wrap" }}>
      <span>
        {contestant.name}{" "}
        <span className="sp-c-sub">
          {contestant.status === "eliminated" ? `· out week ${contestant.eliminated_week}` : "· active"}
        </span>
      </span>
      <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <form action={tribeAction} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="hidden" name="contestantId" value={contestant.id} />
          <input
            className="sp-input"
            style={{ width: 90, padding: "6px 8px" }}
            type="text"
            name="tribe"
            value={tribe}
            onChange={(e) => setTribe(e.target.value)}
            placeholder="Tribe"
          />
          <button
            type="submit"
            className="sp-btn sp-btn-secondary"
            disabled={tribePending || tribe === (contestant.tribe || "")}
          >
            {tribePending ? "…" : "Save tribe"}
          </button>
        </form>
        <form action={statusAction} style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
          <button type="submit" className="sp-btn sp-btn-secondary" disabled={statusPending || !week}>
            {statusPending ? "…" : "Set eliminated"}
          </button>
        </form>
        {contestant.status === "eliminated" && (
          <form action={statusAction}>
            <input type="hidden" name="contestantId" value={contestant.id} />
            <input type="hidden" name="statusAction" value="revert" />
            <button type="submit" className="sp-btn sp-btn-secondary" disabled={statusPending}>
              {statusPending ? "…" : "Revert to active"}
            </button>
          </form>
        )}
      </span>
      {(statusState?.error || tribeState?.error) && (
        <div className="sp-banner sp-banner-error" style={{ marginTop: 8, width: "100%" }}>
          {statusState?.error || tribeState?.error}
        </div>
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

function PrizePoolCard({ currentAmount, buyInAmount, approvedCount }) {
  const [state, formAction, pending] = useActionState(updateTotalPrizePool, initialState);
  const autoAmount = Number(buyInAmount || 0) * approvedCount;

  return (
    <div className="sp-card">
      <div className="sp-section-title">💰 Total prize pool</div>
      <p className="sp-section-sub">
        Leave blank to auto-calculate as ${buyInAmount} × {approvedCount} approved players (${autoAmount.toLocaleString()}).
        Set an exact amount here if the real total you collected ends up different.
      </p>
      {state?.error && <div className="sp-banner sp-banner-error" style={{ margin: "0 0 10px" }}>{state.error}</div>}
      {state?.success && (
        <div className="sp-banner" style={{ margin: "0 0 10px", background: "var(--sp-teal-soft)", color: "#9fcfc0" }}>
          Saved.
        </div>
      )}
      <form action={formAction} className="sp-form" style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <input
          className="sp-input"
          style={{ flex: 1, minWidth: 140 }}
          name="amount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={currentAmount ?? ""}
          placeholder={`e.g. ${autoAmount}`}
        />
        <button type="submit" className="sp-btn sp-btn-secondary" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
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
              <div className="sp-avatar">
                {c.photo_url ? <img src={c.photo_url} alt={c.name} /> : c.name.slice(0, 2).toUpperCase()}
              </div>
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
  commissionerMessage,
  currentWeekPicks,
  picksLocked,
  questions,
  totalPrizePool,
  buyInAmount,
}) {
  return (
    <div>
      <CommissionerMessageCard currentMessage={commissionerMessage} />
      <QuestionsCard questions={questions} />
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
      <CurrentPicksCard
        approvedPlayers={approvedPlayers}
        currentWeekPicks={currentWeekPicks}
        currentWeek={currentWeek}
      />
      <LockPicksCard currentWeek={currentWeek} picksLocked={picksLocked} />
      <CloseWeekCard currentWeek={currentWeek} activeContestants={activeContestants} />
      <RosterCard />
      <CorrectionsCard
        approvedPlayers={approvedPlayers}
        allContestants={allContestants}
        recentCorrections={recentCorrections}
        currentWeek={currentWeek}
      />
      <PrizePoolCard
        currentAmount={totalPrizePool}
        buyInAmount={buyInAmount}
        approvedCount={approvedPlayers.length}
      />
      <FinaleCard activeContestants={activeContestants} isComplete={isComplete} />
    </div>
  );
}
