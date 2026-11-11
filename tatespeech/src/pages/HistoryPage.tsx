import type { DrillScore, SessionRecord } from "../types";
import { formatRate, formatScore } from "../lib/format";
import { formatWhen } from "../lib/dates";
import { bestSubscore, worstSubscore } from "../lib/scoring";
import { setDrillNotes, setSessionNotes, useStore } from "../lib/storage";

type Row =
  | { kind: "session"; at: string; session: SessionRecord; drills: DrillScore[] }
  | { kind: "drill"; at: string; drill: DrillScore };

export function HistoryPage() {
  const store = useStore();
  const nested = new Set(store.sessions.flatMap((session) => session.drillIds));
  const rows: Row[] = [
    ...store.sessions.map((session) => ({
      kind: "session" as const,
      at: session.at,
      session,
      drills: session.drillIds
        .map((id) => store.drills.find((drill) => drill.id === id))
        .filter((drill): drill is DrillScore => drill != null),
    })),
    ...store.drills
      .filter((drill) => !nested.has(drill.id))
      .map((drill) => ({ kind: "drill" as const, at: drill.at, drill })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <div>
      <p className="kicker">History</p>
      <h1>What you did.</h1>
      {rows.length === 0 ? (
        <p className="lede">No takes yet. Finish a drill.</p>
      ) : (
        <div className="history">
          {rows.map((row) => row.kind === "session" ? (
            <SessionRow key={row.session.id} session={row.session} drills={row.drills} />
          ) : (
            <DrillRow key={row.drill.id} drill={row.drill} />
          ))}
        </div>
      )}
    </div>
  );
}

function traits(drill: DrillScore): string {
  const best = bestSubscore(drill.subscores);
  const worst = worstSubscore(drill.subscores);
  if (!best && !worst) return "No trait scored.";
  return `Best ${best?.label ?? "—"} · Weakest ${worst?.label ?? "—"}`;
}

function SessionRow({ session, drills }: { session: SessionRecord; drills: DrillScore[] }) {
  return (
    <details className="history-item">
      <summary>
        <span>{formatWhen(session.at)} · Circuit</span>
        <span className="num">{formatScore(session.overall)} · {session.fillerCount} fillers</span>
      </summary>
      <p>{session.bestDrill ? `Best ${session.bestDrill}. Weakest ${session.weakestDrill ?? "—"}.` : "No drill scored."}</p>
      <p>{session.correction}</p>
      <p className="footnote">{formatRate(session.fillerRate)} · delivery {formatScore(session.deliveryMatch)} · {session.countsForStreak ? `streak ${session.streakAfter}` : "not counted"}</p>
      {drills.map((drill) => <DrillBody key={drill.id} drill={drill} />)}
      <label className="field">
        <span className="hud-label">Notes</span>
        <textarea key={session.notes} rows={2} defaultValue={session.notes} onBlur={(event) => setSessionNotes(session.id, event.target.value)} />
      </label>
    </details>
  );
}

function DrillRow({ drill }: { drill: DrillScore }) {
  return (
    <details className="history-item">
      <summary>
        <span>{formatWhen(drill.at)} · {drill.drillName}</span>
        <span className="num">{formatScore(drill.overall)} · {drill.fillerCount} fillers</span>
      </summary>
      <DrillBody drill={drill} />
    </details>
  );
}

function DrillBody({ drill }: { drill: DrillScore }) {
  return (
    <div style={{ marginTop: 8 }}>
      <p>{traits(drill)}</p>
      <p>{drill.correction}</p>
      {drill.transcript && <div className="transcript" style={{ maxHeight: "6rem" }}>{drill.transcript}</div>}
      <label className="field">
        <span className="hud-label">Notes</span>
        <textarea key={`${drill.id}-${drill.notes}`} rows={2} defaultValue={drill.notes} onBlur={(event) => setDrillNotes(drill.id, event.target.value)} />
      </label>
    </div>
  );
}
