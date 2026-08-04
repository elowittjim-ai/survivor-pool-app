// Shared by the Season Grid and (once the season's complete) the Results
// screen — same player-rows/contestant-columns layout as the legacy
// spreadsheet in both places, not two copies that can drift apart.

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
  function renderPlayerRow(p) {
    return (
      <tr key={p.id}>
        <td className="sp-sticky-name" style={p.outWeek !== null ? { color: "var(--sp-text-muted)" } : undefined}>
          {p.display_name}
        </td>
        {contestantColumns.map((c) => {
          const week = weekByPlayerContestant.get(`${p.id}:${c.id}`);
          if (week === undefined) {
            return <td key={c.id} className="sp-cell-empty">—</td>;
          }
          const isOutHere = p.outWeek === week;
          return (
            <td key={c.id} className={isOutHere ? "sp-cell-out" : "sp-cell-survived"}>
              W{week}
            </td>
          );
        })}
      </tr>
    );
  }

  if (contestantColumns.length === 0) {
    return <p className="sp-section-sub">{emptyContestantsMessage}</p>;
  }

  return (
    <>
      <div className="sp-table-wrap">
        <table className="sp-grid-table">
          <thead>
            <tr>
              <th>Player</th>
              {contestantColumns.map((c) => (
                <th key={c.id} style={c.status === "eliminated" ? { color: "var(--sp-text-muted)" } : undefined}>
                  {c.name}
                  <div className="sp-c-sub" style={{ fontWeight: 400 }}>
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
          <tbody>
            {aliveRows.map(renderPlayerRow)}
            {outRows.length > 0 && (
              <tr>
                <td
                  className="sp-sticky-name"
                  colSpan={contestantColumns.length + 1}
                  style={{ color: "var(--sp-text-muted)", fontSize: 11, background: "var(--sp-bg)" }}
                >
                  Eliminated
                </td>
              </tr>
            )}
            {outRows.map(renderPlayerRow)}
          </tbody>
        </table>
      </div>
      {aliveRows.length === 0 && outRows.length === 0 && (
        <p className="sp-section-sub" style={{ marginTop: 10 }}>
          {emptyPlayersMessage}
        </p>
      )}
    </>
  );
}
