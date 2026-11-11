import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DrillRunner, type Advance } from "../components/DrillRunner";
import { SessionBoard } from "../components/ScoreCard";
import { DRILLS } from "../data/drills";
import type { DrillScore, SessionRecord } from "../types";
import {
  clearCircuitProgress,
  commitSession,
  loadCircuitProgress,
  saveCircuitProgress,
  setSessionNotes,
  useStore,
} from "../lib/storage";

export function CircuitPage() {
  const saved = useRef(loadCircuitProgress());
  const initialIndex = Math.min(saved.current?.nextIndex ?? 0, DRILLS.length);
  const [index, setIndex] = useState(initialIndex >= DRILLS.length ? DRILLS.length - 1 : initialIndex);
  const [phase, setPhase] = useState<"drill" | "breath" | "done">(initialIndex >= DRILLS.length ? "done" : "drill");
  const [results, setResults] = useState<DrillScore[]>(saved.current?.drills ?? []);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [breath, setBreath] = useState(3);
  const [note, setNote] = useState<string | null>(null);
  const resultsRef = useRef(results);
  resultsRef.current = results;
  const store = useStore();

  const finalize = useCallback((drills: DrillScore[]) => {
    clearCircuitProgress();
    if (drills.length === 0) {
      setSession(null);
      setPhase("done");
      return;
    }
    setSession(commitSession(drills));
    setPhase("done");
  }, []);

  useEffect(() => {
    if ((saved.current?.nextIndex ?? 0) < DRILLS.length) return;
    finalize(saved.current?.drills ?? []);
  }, [finalize]);

  const onScored = useCallback((score: DrillScore) => {
    const next = resultsRef.current.some((drill) => drill.id === score.id)
      ? resultsRef.current
      : [...resultsRef.current, score];
    resultsRef.current = next;
    setResults(next);
    saveCircuitProgress(Math.min(DRILLS.length, index + 1), next.map((drill) => drill.id));
  }, [index]);

  const onAdvance = useCallback((result: Advance) => {
    let next = resultsRef.current;
    if (result.score && !next.some((drill) => drill.id === result.score?.id)) {
      next = [...next, result.score];
      resultsRef.current = next;
      setResults(next);
    }
    setNote(result.reason ?? null);
    if (result.end || index >= DRILLS.length - 1) {
      finalize(next);
      return;
    }
    const upcoming = index + 1;
    saveCircuitProgress(upcoming, next.map((drill) => drill.id));
    setIndex(upcoming);
    setBreath(3);
    setPhase("breath");
  }, [finalize, index]);

  useEffect(() => {
    if (phase !== "breath") return undefined;
    const id = window.setInterval(() => {
      setBreath((value) => {
        if (value <= 1) {
          window.clearInterval(id);
          setPhase("drill");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, index]);

  const drill = DRILLS[Math.min(index, DRILLS.length - 1)];
  const sessionDrills = session
    ? session.drillIds.map((id) => store.drills.find((item) => item.id === id)).filter((item): item is DrillScore => item != null)
    : results;

  return (
    <div>
      <div className="circuit-head">
        <div>
          <p className="kicker">Daily circuit</p>
          <h1 style={{ fontSize: 48 }}>Drill {Math.min(index + 1, DRILLS.length)} / {DRILLS.length}</h1>
        </div>
        <Link className="btn btn-ghost" to="/">Leave</Link>
      </div>
      <div className="meter" style={{ marginBottom: 14 }}>
        <div className="meter-track">
          <div className="meter-fill" style={{ width: `${(Math.min(index, DRILLS.length) / DRILLS.length) * 100}%` }} />
        </div>
      </div>
      {phase === "breath" && (
        <div className="breath">
          <div>
            <p className="kicker">Breath</p>
            <p className="breath-num">{breath}</p>
            {note && <p className="lede">{note}</p>}
          </div>
        </div>
      )}
      {phase === "drill" && (
        <DrillRunner
          key={drill.id}
          drill={drill}
          mode="circuit"
          indexLabel={`${String(index + 1).padStart(2, "0")} / ${DRILLS.length}`}
          continueLabel={index >= DRILLS.length - 1 ? "Session score" : "Next drill"}
          onAdvance={onAdvance}
          onScored={onScored}
        />
      )}
      {phase === "done" && (
        <div>
          {session ? (
            <>
              <SessionBoard session={session} drills={sessionDrills} />
              <label className="field" style={{ marginTop: 12 }}>
                <span className="hud-label">Session notes</span>
                <textarea rows={3} defaultValue={session.notes} onBlur={(event) => setSessionNotes(session.id, event.target.value)} />
              </label>
            </>
          ) : (
            <article className="score-card">
              <h2>No scored drills.</h2>
              <p className="lede">The circuit ended before a take was long enough to score. The streak did not move.</p>
            </article>
          )}
          <div className="actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn" onClick={() => {
              clearCircuitProgress();
              saved.current = null;
              resultsRef.current = [];
              setResults([]);
              setSession(null);
              setIndex(0);
              setPhase("drill");
            }}>Start over</button>
            <Link className="btn btn-primary" to="/">Home</Link>
            <Link className="btn" to="/history">History</Link>
          </div>
        </div>
      )}
    </div>
  );
}
