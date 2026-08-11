// Shared by the Season Grid and (once the season's complete) the Results
// screen — same player-rows/contestant-columns layout as the legacy
// spreadsheet in both places, not two copies that can drift apart.

import { tribeColor } from "./tribeColor";

export function buildGridData(players, allContestants, picks) {
  const activeContestants = (allContestants || [])
    .filter((c) => c.status === "active")
    .sort((a, b) => a.name.localeCompare(b.name));
  const eliminatedContestants = (allContestants || [])
    .filter((c) => c.status === "eliminated")
    .sort((a, b) => (a.eliminated_week ?? 0) - (b.eliminated_week ?? 0) || a.name.localeCompare(b.name));
  const contestantColumns = [...activeContestants, ...eliminatedContestants];

  const weekByPlayerContestant = new Map();
  const pickCountByContestant = new Map();
  const picksByPlayer = new Map();
  for (const pick of picks || []) {
    weekByPlayerContestant.set(`${pick.player_id}:${pick.contestant_id}`, pick.week);
    pickCountByContestant.set(pick.contestant_id, (pickCountByContestant.get(pick.contestant_id) || 0) + 1);
    if (!picksByPlayer.has(pick.player_id)) picksByPlayer.set(pick.player_id, []);
    picksByPlayer.get(pick.player_id).push(pick);
  }

  function outWeekFor(playerPicks) {
    for (const pick of playerPicks) {
      const c = pick.contestants;
      if (c && c.status === "eliminated" && c.eliminated_week === pick.week) {
        return pick.week;
      }
    }
    return null;
  }

  const rows = (players || [])
    .map((p) => ({ ...p, outWeek: outWeekFor(picksByPlayer.get(p.id) || []) }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));

  return {
    contestantColumns,
    weekByPlayerContestant,
    pickCountByContestant,
    aliveRows: rows.filter((p) => p.outWeek === null),
    outRows: rows.filter((p) => p.outWeek !== null),
  };
}

export default function SeasonGridTable({
  contestantColumns,
  weekByPlayerContestant,
  pickCountByContestant,
  aliveRows,
  outRows,
  emptyContestantsMessage = "No contestants yet.",
  emptyPlayersMessage = "No approved players yet.",
}) {
  // contestantColumns is ordered active-then-eliminated (see buildGridData),
  // so this is the one index boundary where the two groups meet.
  function columnDivider(i) {
    return contestantColumns[i].status === "eliminated" &&
      contestantColumns[i - 1]?.status !== "eliminated"
      ? { borderLeft: "2px solid var(--sp-border)" }
      : undefined;
  }

  function renderPlayerRow(p) {
    return (
      <tr key={p.id}>
        <td className="sp-sticky-name" style={p.outWeek !== null ? { color: "var(--sp-text-muted)" } : undefined}>
          {p.display_name}
        </td>
        {contestantColumns.map((c, i) => {
          const week = weekByPlayerContestant.get(`${p.id}:${c.id}`);
          if (week === undefined) {
            return <td key={c.id} className="sp-cell-empty" style={columnDivider(i)}>—</td>;
          }
          const isOutHere = p.outWeek === week;
          return (
            <td key={c.id} className={isOutHere ? "sp-cell-out" : "sp-cell-survived"} style={columnDivider(i)}>
              W{week}
            </td>
          );
        })}
      </tr>
    );
  }

  function renderHeader() {
    return (
      <thead>
        <tr>
          <th>Player</th>
          {contestantColumns.map((c, i) => (
            <th
              key={c.id}
              style={{
                ...(c.status === "eliminated"
                  ? { color: "var(--sp-text-muted)", background: "var(--sp-danger-soft)" }
                  : undefined),
                ...columnDivider(i),
              }}
            >
              {c.name}
              <div
                className="sp-c-sub"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: c.status === "eliminated" ? undefined : tribeColor(c.tribe),
                }}
              >
                {c.tribe || "—"}
                {c.status === "eliminated" ? " · out" : ""}
              </div>
              <div className="sp-c-sub" style={{ fontWeight: 400 }}>
                picked {pickCountByContestant.get(c.id) || 0}
              </div>
            </th>
          ))}
        </tr>
      </thead>
    );
  }

  function renderGrid(rows, emptyMessage) {
    if (rows.length === 0) {
      return <p className="sp-section-sub">{emptyMessage}</p>;
    }
    return (
      <div className="sp-table-wrap">
        <table className="sp-grid-table">
          {renderHeader()}
          <tbody>{rows.map(renderPlayerRow)}</tbody>
        </table>
      </div>
    );
  }

  if (contestantColumns.length === 0) {
    return <p className="sp-section-sub">{emptyContestantsMessage}</p>;
  }

  if (aliveRows.length === 0 && outRows.length === 0) {
    return <p className="sp-section-sub">{emptyPlayersMessage}</p>;
  }

  return (
    <>
      <div className="sp-c-sub" style={{ fontWeight: 600, color: "var(--sp-text)", marginBottom: 6 }}>
        Still in it ({aliveRows.length})
      </div>
      {renderGrid(aliveRows, "Nobody left — everyone's been eliminated.")}

      <div className="sp-c-sub" style={{ fontWeight: 600, color: "var(--sp-text)", margin: "20px 0 6px" }}>
        Eliminated ({outRows.length})
      </div>
      {renderGrid(outRows, "Nobody eliminated yet.")}
    </>
  );
}
