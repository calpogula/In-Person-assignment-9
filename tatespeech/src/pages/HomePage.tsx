import { Link } from "react-router-dom";
import { formatRate, formatScore } from "../lib/format";
import { completedToday, useStore, visibleStreak } from "../lib/storage";

export function HomePage() {
  const store = useStore();
  const streak = visibleStreak();
  const sessions = store.sessions.filter((session) => session.countsForStreak);
  const last = store.sessions.find((session) => session.overall != null) ?? store.drills.find((drill) => drill.overall != null);
  const today = completedToday();
  const filler = store.personalRecords.bestFillerRate;
  return (
    <div>
      <p className="kicker">Today</p>
      <h1>Fifteen minutes.</h1>
      <p className="lede">Eleven drills. Fast thought. Slow mouth. Silence instead of filler.</p>
      <section className="hero" style={{ marginTop: 18 }}>
        <div>
          <p className="kicker">Daily circuit</p>
          <h2>15:00</h2>
          <p className="lede">{today ? `Done today. ${formatScore(today.overall)}.` : "Not done today."}</p>
          <div className="hero-actions" style={{ marginTop: 16 }}>
            <Link className="btn btn-primary" to="/circuit" data-testid="start-training">Start training</Link>
            <Link className="btn btn-gold" to="/free">Free speak</Link>
          </div>
        </div>
        <div>
          <p className="kicker">Rule</p>
          <p className="correction">End the sentence like a statement.</p>
          <p className="footnote">Scores come from the mic, the camera, and the transcript. A missing signal stays blank.</p>
        </div>
      </section>
      <section className="stats">
        <div className="stat"><div className="stat-label">Streak</div><div className="stat-value">{streak}</div></div>
        <div className="stat"><div className="stat-label">Sessions</div><div className="stat-value">{sessions.length}</div></div>
        <div className="stat"><div className="stat-label">Last score</div><div className="stat-value">{formatScore(last?.overall ?? null)}</div></div>
        <div className="stat"><div className="stat-label">Best match</div><div className="stat-value">{formatScore(store.personalRecords.bestDelivery)}</div></div>
        <div className="stat">
          <div className="stat-label">Filler PR</div>
          <div className="stat-value" style={{ fontSize: 32 }}>{filler == null ? "—" : filler.toFixed(1)}</div>
          <small>{filler == null ? "No clean minute yet" : formatRate(filler)}</small>
        </div>
      </section>
    </div>
  );
}
