import type { DrillScore, SessionRecord } from "../types";
import { formatClock, formatRate, formatScore, formatSeconds } from "../lib/format";
import { formatWhen } from "../lib/dates";

function Bar({ score, max }: { score: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  return (
    <div className={score / max < 0.5 ? "bar low" : "bar"}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ScoreCard({
  score,
  onNotes,
}: {
  score: DrillScore;
  onNotes?: (notes: string) => void;
}) {
  return (
    <article className="score-card">
      <div className="score-top">
        <div>
          <p className="kicker">{score.drillName}</p>
          <h2>Score</h2>
        </div>
        <div className="score-num">{formatScore(score.overall)}</div>
      </div>
      <p className="correction">{score.correction}</p>
      <div className="stats">
        <div className="stat">
          <div className="stat-label">Fillers</div>
          <div className="stat-value">{score.fillerCount}</div>
          <small>{score.fillerSource === "speech" ? formatRate(score.fillerRate) : score.fillerSource === "manual" ? "Manual tally" : "Not scored"}</small>
        </div>
        <div className="stat">
          <div className="stat-label">WPM</div>
          <div className="stat-value">{score.wpm == null ? "—" : Math.round(score.wpm)}</div>
          <small>{score.wpmEstimated ? "Energy estimate" : score.wpm == null ? "No transcript" : "From transcript"}</small>
        </div>
        <div className="stat">
          <div className="stat-label">Avg pause</div>
          <div className="stat-value">{formatSeconds(score.avgPauseMs)}</div>
          <small>{score.controlledPauses} controlled · {score.stalls} stalls</small>
        </div>
        <div className="stat">
          <div className="stat-label">Clean stretch</div>
          <div className="stat-value">{formatSeconds(score.longestCleanMs)}</div>
          <small>{score.longestCleanMs == null ? "Needs a transcript" : "Since last filler"}</small>
        </div>
        <div className="stat">
          <div className="stat-label">Eye contact</div>
          <div className="stat-value">{score.eyePct == null ? "—" : `${score.eyePct}%`}</div>
          <small>{score.eyeNote}</small>
        </div>
      </div>
      <section>
        <p className="kicker">Subscores</p>
        <div className="sub-list">
          {score.subscores.map((sub) => (
            <div className="sub-row" key={sub.key}>
              <strong>{sub.label}</strong>
              <Bar score={sub.score} max={10} />
              <span className="num">{sub.score}</span>
              <p>{sub.detail}</p>
            </div>
          ))}
          {score.omitted.map((item) => (
            <p className="omit" key={item.label}><strong>{item.label}.</strong> {item.reason}</p>
          ))}
        </div>
      </section>
      <section>
        <p className="kicker">Delivery match</p>
        <p className="lede">
          {score.deliveryMatch == null ? "Not scored. No trait had a signal." : `${score.deliveryMatch} / 100, averaged from the traits that had a signal.`}
          {" "}Short declarative lines, no filler, no hedge, downward endings, controlled pace, steady eye contact, projection without shouting, frame control. This is not a voice match and it is not an identity.
        </p>
        <div className="trait-list">
          {score.traits.map((trait) => (
            <div className="trait-row" key={trait.key}>
              <strong>{trait.label}</strong>
              {trait.score == null ? <span className="omit">No signal</span> : <Bar score={trait.score} max={100} />}
              <span className="num">{formatScore(trait.score)}</span>
              <p>{trait.detail}</p>
            </div>
          ))}
        </div>
      </section>
      {score.extras.length > 0 && (
        <ul className="rules">
          {score.extras.map((extra) => (
            <li key={extra.label}><strong>{extra.label}:</strong> {extra.value}</li>
          ))}
        </ul>
      )}
      {score.transcript && (
        <section>
          <p className="kicker">Transcript</p>
          <div className="transcript" style={{ maxHeight: "8rem" }}>{score.transcript}</div>
        </section>
      )}
      {onNotes && (
        <label className="field">
          <span className="hud-label">Notes</span>
          <textarea defaultValue={score.notes} rows={3} onBlur={(event) => onNotes(event.target.value)} />
        </label>
      )}
      <p className="footnote">{formatWhen(score.at)} · {formatClock(score.durationMs)} recorded. Scores use only the signals above.</p>
    </article>
  );
}

export function SessionBoard({ session, drills }: { session: SessionRecord; drills: DrillScore[] }) {
  return (
    <article className="score-card">
      <div className="score-top">
        <div>
          <p className="kicker">Session</p>
          <h2>{session.countsForStreak ? "Counted" : "Too short for the streak"}</h2>
        </div>
        <div className="score-num">{formatScore(session.overall)}</div>
      </div>
      <p className="correction">{session.correction}</p>
      <div className="stats">
        <div className="stat"><div className="stat-label">Best drill</div><div className="stat-value" style={{ fontSize: 28 }}>{session.bestDrill ?? "—"}</div></div>
        <div className="stat"><div className="stat-label">Weakest drill</div><div className="stat-value" style={{ fontSize: 28 }}>{session.weakestDrill ?? "—"}</div></div>
        <div className="stat"><div className="stat-label">Streak</div><div className="stat-value">{session.countsForStreak ? session.streakAfter : "—"}</div></div>
        <div className="stat"><div className="stat-label">Delivery</div><div className="stat-value">{formatScore(session.deliveryMatch)}</div></div>
        <div className="stat"><div className="stat-label">Fillers</div><div className="stat-value">{session.fillerCount}</div><small>{formatRate(session.fillerRate)}</small></div>
      </div>
      <p className="footnote">Tomorrow: {session.correction}</p>
      <div className="sub-list">
        {drills.map((drill) => (
          <div className="sub-row" key={drill.id}>
            <strong>{drill.drillName}</strong>
            <Bar score={drill.overall ?? 0} max={100} />
            <span className="num">{formatScore(drill.overall)}</span>
            <p>{drill.correction}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
