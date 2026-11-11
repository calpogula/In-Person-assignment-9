import { LineChart } from "../components/Charts";
import { formatRate, formatScore, formatSeconds } from "../lib/format";
import { formatWhen } from "../lib/dates";
import { clearStore, useStore } from "../lib/storage";
import type { DrillScore, SessionRecord } from "../types";

export function ProgressPage() {
  const store = useStore();
  const sessions = [...store.sessions].reverse().filter((session) => session.overall != null || session.deliveryMatch != null);
  const drills = [...store.drills].reverse().filter((drill) => drill.overall != null);
  const useSessions = sessions.length > 0;
  const records = store.personalRecords;
  return (
    <div>
      <p className="kicker">Progress</p>
      <h1>Earned numbers.</h1>
      <p className="lede">{useSessions ? "Circuits, oldest to newest." : "No circuit yet. These points are single drills and free speak."}</p>
      <section className="stats">
        <div className="stat"><div className="stat-label">Best score</div><div className="stat-value">{formatScore(records.bestOverall)}</div></div>
        <div className="stat"><div className="stat-label">Best match</div><div className="stat-value">{formatScore(records.bestDelivery)}</div></div>
        <div className="stat"><div className="stat-label">Filler PR</div><div className="stat-value" style={{ fontSize: 32 }}>{records.bestFillerRate == null ? "—" : records.bestFillerRate.toFixed(1)}</div><small>{formatRate(records.bestFillerRate)}</small></div>
        <div className="stat"><div className="stat-label">Best eyes</div><div className="stat-value">{records.bestEye == null ? "—" : `${Math.round(records.bestEye)}%`}</div></div>
        <div className="stat"><div className="stat-label">Clean stretch</div><div className="stat-value" style={{ fontSize: 32 }}>{formatSeconds(records.longestCleanMs)}</div></div>
      </section>
      {useSessions ? <SessionCharts sessions={sessions} /> : <DrillCharts drills={drills} />}
      <button type="button" className="btn btn-ghost" style={{ marginTop: 18 }} onClick={() => {
        if (window.confirm("Erase all TateSpeech history on this browser?")) clearStore();
      }}>Clear history</button>
    </div>
  );
}

function SessionCharts({ sessions }: { sessions: SessionRecord[] }) {
  const label = (session: SessionRecord) => formatWhen(session.at);
  return (
    <div className="charts">
      <LineChart title="Total score" points={num(sessions, label, (session) => session.overall)} min={0} max={100} />
      <LineChart title="Fillers / min" color="#e23b2f" decimals={1} points={num(sessions, label, (session) => session.fillerRate)} min={0} max={Math.max(4, ...sessions.map((session) => session.fillerRate ?? 0))} />
      <LineChart title="Delivery match" points={num(sessions, label, (session) => session.deliveryMatch)} min={0} max={100} />
      <LineChart title="Eye contact" points={num(sessions, label, (session) => session.eyePct)} min={0} max={100} />
      <LineChart title="Conviction" points={num(sessions, label, (session) => session.conviction)} min={0} max={10} decimals={1} />
    </div>
  );
}

function DrillCharts({ drills }: { drills: DrillScore[] }) {
  const label = (drill: DrillScore) => formatWhen(drill.at);
  return (
    <div className="charts">
      <LineChart title="Total score" points={num(drills, label, (drill) => drill.overall)} min={0} max={100} />
      <LineChart title="Fillers / min" color="#e23b2f" decimals={1} points={num(drills, label, (drill) => drill.fillerRate)} min={0} max={Math.max(4, ...drills.map((drill) => drill.fillerRate ?? 0))} />
      <LineChart title="Delivery match" points={num(drills, label, (drill) => drill.deliveryMatch)} min={0} max={100} />
      <LineChart title="Eye contact" points={num(drills, label, (drill) => drill.eyePct)} min={0} max={100} />
      <LineChart title="Conviction" points={num(drills, label, (drill) => drill.subscores.find((sub) => sub.key === "conviction")?.score ?? null)} min={0} max={10} />
    </div>
  );
}

function num<T>(items: T[], label: (item: T) => string, read: (item: T) => number | null): { x: string; y: number }[] {
  return items.flatMap((item) => {
    const value = read(item);
    return value == null ? [] : [{ x: label(item), y: value }];
  });
}
