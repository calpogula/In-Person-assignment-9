import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { DrillMode, DrillScore } from "../types";
import type { DrillDef } from "../data/drills";
import { VOICE_LINE } from "../data/drills";
import { BUILT_IN_LINES, bankFor, rotateMs } from "../data/banks";
import { PromptDeck } from "../lib/deck";
import { containsWord, findFillers, lineOverlap } from "../lib/fillers";
import { formatClock } from "../lib/format";
import { mean } from "../lib/text";
import { toDrillScore } from "../lib/result";
import { SessionRecorder } from "../lib/recorder";
import { scoreTake } from "../lib/scoring";
import { addCustomLine, saveDrill, setDrillNotes, useStore } from "../lib/storage";
import { speechCtor, useAudio, useEyes, useMedia, useSpeech } from "../hooks/useSignals";
import { CameraStage } from "./CameraStage";
import { Hud } from "./Hud";
import { ScoreCard } from "./ScoreCard";

const VOICED = new Set(["rapid-link", "three-word", "metaphor"]);

export interface Advance {
  score: DrillScore | null;
  end: boolean;
  reason?: string;
}

interface Props {
  drill: DrillDef;
  mode: DrillMode;
  indexLabel?: string;
  continueLabel?: string;
  onAdvance?: (result: Advance) => void;
  onScored?: (score: DrillScore) => void;
  onRestart?: () => void;
}

export function DrillRunner({ drill, mode, indexLabel, continueLabel = "Next drill", onAdvance, onScored, onRestart }: Props) {
  const store = useStore();
  const media = useMedia();
  const recorderRef = useRef(new SessionRecorder());
  const deckRef = useRef<PromptDeck<string> | null>(null);
  const startedAt = useRef<number | null>(null);
  const promptStarted = useRef(0);
  const shownKey = useRef<string | null>(null);
  const hitPrompt = useRef(false);
  const similePrompt = useRef(false);
  const selfReport = useRef(0);
  const endAfter = useRef(false);
  const arming = useRef(false);
  const closed = useRef(false);
  const promptIndexRef = useRef(0);
  const promptRef = useRef("");
  const lineRef = useRef(BUILT_IN_LINES[0]);
  const advanceRef = useRef<() => void>(() => {});
  const finishRef = useRef<(kind: "score" | "skip" | "end") => void>(() => {});
  const toggleRef = useRef<() => void>(() => {});
  const phaseRef = useRef<"live" | "card">("live");

  const [phase, setPhase] = useState<"live" | "card">("live");
  const [recording, setRecording] = useState(false);
  const [now, setNow] = useState(() => performance.now());
  const [prompt, setPrompt] = useState(drill.id === "voice-lock" ? VOICE_LINE : "");
  const [promptIndex, setPromptIndex] = useState(0);
  const [line, setLine] = useState(BUILT_IN_LINES[0]);
  const [custom, setCustom] = useState("");
  const [reps, setReps] = useState(0);
  const [score, setScore] = useState<DrillScore | null>(null);
  const [flash, setFlash] = useState(0);
  const [reported, setReported] = useState(0);

  phaseRef.current = phase;
  promptRef.current = prompt;
  promptIndexRef.current = promptIndex;
  lineRef.current = line;

  useEffect(() => {
    const bank = bankFor(drill.id);
    if (!bank || drill.id === "final-line" || drill.id === "voice-lock") return;
    const deck = new PromptDeck(bank, (item) => item);
    deckRef.current = deck;
    setPrompt(deck.now());
  }, [drill.id]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(performance.now()), 100);
    return () => window.clearInterval(id);
  }, []);

  const goNextPrompt = useCallback(() => {
    const deck = deckRef.current;
    if (!deck) return;
    hitPrompt.current = false;
    similePrompt.current = false;
    promptStarted.current = performance.now();
    setPrompt(deck.next());
    setPromptIndex((index) => index + 1);
  }, []);
  advanceRef.current = goNextPrompt;

  const onFinal = useCallback((chunk: string) => {
    const recorder = recorderRef.current;
    const hits = recorder.addFinal(chunk, performance.now());
    if (hits.length > 0) setFlash((count) => count + 1);
    if (drill.id === "kill-very") {
      const strong = promptRef.current.split("\n")[1] ?? "";
      if (strong && containsWord(chunk, strong) && !hitPrompt.current) {
        hitPrompt.current = true;
        recorder.noteHit();
        window.setTimeout(() => advanceRef.current(), 700);
      }
    }
    if (drill.id === "metaphor" && !similePrompt.current && /\b(it is like|it's like|like a|like an|resembles|picture a)\b/i.test(chunk)) {
      similePrompt.current = true;
      recorder.noteSimile();
    }
    if (drill.id === "final-line" && lineOverlap(chunk, lineRef.current)) {
      if (recorder.noteRep(performance.now())) setReps(recorder.reps);
    }
    if (VOICED.has(drill.id)) recorder.noteVoiced(promptIndexRef.current);
  }, [drill.id]);

  useAudio(media.stream, media.audioContext, recording && media.audioOn, (frame) => {
    recorderRef.current.onAudio(frame.now, frame.rms, frame.pitch, frame.clipped);
  });
  const speech = useSpeech(recording && media.audioOn, onFinal);
  const eyes = useEyes(media.videoRef, recording && media.videoOn, (model, face, looking) => {
    recorderRef.current.onEye(model, face, looking);
  });

  useEffect(() => {
    if (speech.error) recorderRef.current.markSpeechError(speech.error);
  }, [speech.error]);

  useEffect(() => {
    recorderRef.current.setInterim(speech.interim);
  }, [speech.interim]);

  useEffect(() => {
    if (!recording) return;
    const key = `${promptIndex}:${prompt}`;
    if (shownKey.current === key) return;
    shownKey.current = key;
    recorderRef.current.notePromptShown();
    promptStarted.current = performance.now();
    hitPrompt.current = false;
    similePrompt.current = false;
  }, [recording, prompt, promptIndex]);

  useEffect(() => {
    const every = rotateMs(drill.id);
    if (!recording || every == null) return undefined;
    const id = window.setTimeout(() => advanceRef.current(), every);
    return () => window.clearTimeout(id);
  }, [recording, prompt, drill.id]);

  useEffect(() => {
    if (!recording || !VOICED.has(drill.id)) return undefined;
    const mark = recorderRef.current.speakingMs;
    const index = promptIndex;
    const id = window.setInterval(() => {
      if (recorderRef.current.speakingMs > mark + 400) recorderRef.current.noteVoiced(index);
    }, 250);
    return () => window.clearInterval(id);
  }, [recording, promptIndex, drill.id]);

  const finish = useCallback((kind: "score" | "skip" | "end") => {
    if (closed.current || phaseRef.current === "card") return;
    if (kind === "skip") {
      closed.current = true;
      setRecording(false);
      onAdvance?.({ score: null, end: false, reason: "Skipped." });
      return;
    }
    const take = recorderRef.current.freeze(performance.now());
    setRecording(false);
    if (take.durationMs < 8000) {
      closed.current = true;
      onAdvance?.({ score: null, end: kind === "end", reason: "Short take. Not scored." });
      return;
    }
    const draft = scoreTake(drill.id, drill.subscores, take);
    const next = toDrillScore(drill, mode, take.durationMs, draft);
    if (selfReport.current > 0) {
      next.extras = [...next.extras, { label: "Self-reported (not scored)", value: String(selfReport.current) }];
    }
    const saved = saveDrill(next);
    onScored?.(saved);
    closed.current = true;
    setScore(saved);
    setPhase("card");
    endAfter.current = kind === "end";
  }, [drill, mode, onAdvance, onScored]);
  finishRef.current = finish;

  const toggle = useCallback(async () => {
    if (closed.current || phaseRef.current !== "live") return;
    if (recording) {
      finishRef.current("score");
      return;
    }
    if (arming.current) return;
    arming.current = true;
    try {
      if (!media.opened) await media.open();
      startedAt.current = performance.now();
      recorderRef.current.start(performance.now(), speechCtor() != null);
      setRecording(true);
    } finally {
      arming.current = false;
    }
  }, [media, recording]);
  toggleRef.current = () => { void toggle(); };

  useEffect(() => {
    if (!recording || startedAt.current == null) return;
    const limit = mode === "free" ? drill.seconds * 1000 : drill.seconds * 1000;
    if (now - startedAt.current >= limit) finishRef.current("score");
  }, [now, recording, drill.seconds, mode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      event.preventDefault();
      toggleRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const elapsed = recording && startedAt.current != null ? Math.max(0, now - startedAt.current) : 0;
  const remaining = mode === "free" ? null : Math.max(0, drill.seconds * 1000 - elapsed);
  const recorder = recorderRef.current;
  const pending = findFillers(speech.interim);
  const fillerCount = recorder.fillers.length + pending.length;
  const minutes = elapsed / 60000;
  const words = recorder.transcript.trim() ? recorder.transcript.trim().split(/\s+/).length : 0;
  const wpm = words > 0 && minutes > 0.05 ? String(Math.round(words / minutes)) : "—";
  const pauses = recorder.pauses;
  const pauseLabel = pauses.length === 0 ? "—" : `${((mean(pauses.map((pause) => pause.durationMs)) ?? 0) / 1000).toFixed(1)}s`;
  const lastFillerAt = pending.length > 0 ? elapsed : (recorder.fillers[recorder.fillers.length - 1]?.atMs ?? 0);
  const clean = speech.status === "listening" || words > 0 ? formatClock(Math.max(0, elapsed - lastFillerAt)) : "—";
  const eyeRecent = recorder.recentEyePct();
  const eyeText = eyes.model === "ready"
    ? "Eye model live"
    : eyes.model === "loading"
      ? "Eye model loading. No percentage yet."
      : eyes.model === "unavailable"
        ? `Eye-contact model unavailable.${eyes.fallbackFace == null ? "" : eyes.fallbackFace ? " Face in frame." : " No face."}`
        : "Eye model idle";
  const hedges = findFillers(`${recorder.transcript} ${speech.interim}`).filter((word) =>
    ["i think", "maybe", "probably", "kind of", "sort of", "i guess", "just", "very"].includes(word),
  ).length;
  const pass = drill.id !== "voice-lock"
    ? null
    : elapsed < 20000 ? "Pass 1 · Normal" : elapsed < 40000 ? "Pass 2 · Louder" : "Pass 3 · Slow and downward";
  const rotate = rotateMs(drill.id);
  const promptLeft = rotate == null || !recording ? null : Math.max(0, rotate - (now - promptStarted.current));
  const swap = drill.id === "kill-very" ? prompt.split("\n") : null;
  const showTap = recording && (speech.status === "unsupported" || speech.status === "error");
  const blocked = !media.videoOn && media.opened ? media.videoError ?? "Camera blocked." : null;
  const banners = [media.videoError, media.audioError, speech.error, eyes.error].filter((item): item is string => Boolean(item));

  if (phase === "card" && score) {
    return (
      <div>
        {flash > 0 && <div className="flash" key={flash} />}
        <ScoreCard score={score} onNotes={(notes) => setDrillNotes(score.id, notes)} />
        <div className="actions" style={{ marginTop: 12 }}>
          {mode === "circuit" ? (
            <>
              <button type="button" className="btn btn-primary" onClick={() => onAdvance?.({ score, end: endAfter.current })}>
                {endAfter.current ? "Session score" : continueLabel}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => onAdvance?.({ score, end: true })}>End session</button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-primary" onClick={() => onRestart?.()}>Run again</button>
              <Link className="btn btn-ghost" to={mode === "free" ? "/" : "/library"}>{mode === "free" ? "Home" : "Library"}</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {flash > 0 && <div className="flash" key={flash} />}
      <div className="run">
        <CameraStage
          setNode={media.setVideoNode}
          live={media.videoOn}
          blocked={blocked}
          elapsedMs={elapsed}
          remainingMs={remaining}
          recording={recording}
        />
        <section className="panel slot-brief">
          <p className="kicker">{indexLabel ?? drill.name}</p>
          <div className="timer-big num">{formatClock(remaining ?? elapsed)}</div>
          <h2>{drill.name}</h2>
          <p className="lede">{drill.goal}</p>
          {pass && <p className="meta">{pass}</p>}
          {swap ? (
            <>
              <p className="prompt-text">{swap[0]}</p>
              <p className="tactical">Say: {swap[1]}</p>
            </>
          ) : drill.id === "final-line" ? (
            <>
              <p className="prompt-text">{line}</p>
              <p className="meta">Reps heard {reps} / 5{reported > 0 ? ` · self-reported ${reported} (not scored)` : ""}</p>
            </>
          ) : (
            <p className="prompt-text">{drill.id === "free" ? "No script." : prompt || "Prompt loading."}</p>
          )}
          {promptLeft != null && <p className="meta">Next prompt {formatClock(promptLeft)}</p>}
          <div className="actions">
            <button type="button" className={recording ? "rec live" : "rec"} aria-pressed={recording} onClick={() => { void toggle(); }}>
              {recording ? "STOP" : "REC"}
            </button>
            {deckRef.current && drill.id !== "final-line" && (
              <button type="button" className="btn" onClick={() => {
                const deck = deckRef.current;
                if (!deck) return;
                hitPrompt.current = false;
                similePrompt.current = false;
                promptStarted.current = performance.now();
                setPrompt(deck.refresh());
                setPromptIndex((index) => index + 1);
              }}>Skip prompt</button>
            )}
            {mode === "circuit" && onAdvance && (
              <>
                <button type="button" className="btn" onClick={() => finish("score")}>Next drill</button>
                <button type="button" className="btn btn-ghost" onClick={() => finish("skip")}>Skip drill</button>
                <button type="button" className="btn btn-ghost" onClick={() => finish("end")}>End session</button>
              </>
            )}
            {media.opened && (!media.audioOn || !media.videoOn) && (
              <button type="button" className="btn" onClick={() => { void media.open(); }}>Try devices again</button>
            )}
          </div>
          <p className="kicker">Framework</p>
          <p style={{ margin: 0 }}>{drill.framework}</p>
          <ul className="rules">{drill.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
          <p className="tactical">{drill.line}</p>
          {drill.id === "final-line" && (
            <div className="line-pick">
              {[...BUILT_IN_LINES, ...store.customLines].map((item) => (
                <button type="button" key={item} className="btn" aria-pressed={item === line} onClick={() => setLine(item)}>{item}</button>
              ))}
              <form className="inline" onSubmit={(event) => {
                event.preventDefault();
                const next = custom.trim();
                if (!next) return;
                addCustomLine(next);
                setLine(next);
                setCustom("");
              }}>
                <input value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Your line" aria-label="Custom line" />
                <button type="submit" className="btn">Save line</button>
              </form>
            </div>
          )}
          {(speech.status === "unsupported" || speech.status === "error") && drill.id === "kill-very" && recording && (
            <button type="button" className="btn" onClick={() => { selfReport.current += 1; setReported(selfReport.current); }}>I said the word (not scored)</button>
          )}
          {(speech.status === "unsupported" || speech.status === "error") && drill.id === "final-line" && recording && (
            <button type="button" className="btn" onClick={() => { selfReport.current += 1; setReported(selfReport.current); }}>Rep landed (not scored)</button>
          )}
          <div className="pills">
            <span className={media.audioOn ? "pill on" : media.opened ? "pill off" : "pill"}>Mic {media.audioOn ? "live" : media.opened ? "blocked" : "off"}</span>
            <span className={media.videoOn ? "pill on" : media.opened ? "pill off" : "pill"}>Camera {media.videoOn ? "live" : media.opened ? "blocked" : "off"}</span>
            <span className={speech.status === "listening" ? "pill on" : speech.status === "unsupported" || speech.status === "error" ? "pill off" : "pill warn"}>
              {speech.status === "listening" ? "Speech" : speech.status === "unsupported" ? "No speech API" : speech.status === "error" ? "Speech error" : "Speech idle"}
            </span>
            <span className={eyes.model === "ready" ? "pill on" : eyes.model === "unavailable" ? "pill off" : "pill warn"}>
              {eyes.model === "ready" ? "Eyes" : eyes.model === "loading" ? "Eyes loading" : eyes.model === "unavailable" ? "Eyes unavailable" : "Eyes idle"}
            </span>
          </div>
          {banners.map((banner) => <p className="banner banner-bad" key={banner}>{banner}</p>)}
          {media.opened && !media.audioOn && !media.videoOn && (
            <p className="banner">Timer only. Camera and mic are blocked, so this take will not invent scores.</p>
          )}
          <p className="footnote">Space records. Transcript stays in this browser.</p>
        </section>
        <Hud
          fillers={[
            ...recorder.fillers.map((filler) => ({ word: filler.word, atMs: filler.atMs })),
            ...pending.map((word) => ({ word, atMs: elapsed, pending: true })),
          ]}
          fillerCount={fillerCount}
          manualCount={recorder.manualFillers}
          showTap={showTap}
          onTap={() => {
            recorder.tapFiller();
            setFlash((count) => count + 1);
            setNow(performance.now());
          }}
          level={recorder.currentVolume}
          wpm={wpm}
          pause={pauseLabel}
          clean={clean}
          eye={eyeText}
          eyeRecent={eyes.model === "ready" ? eyeRecent : null}
          pitch={recorder.lastPitch == null ? "—" : `${Math.round(recorder.lastPitch)} Hz`}
          ending={recorder.endings[recorder.endings.length - 1]?.trend ?? "—"}
          hedges={String(hedges)}
          transcript={recorder.transcript}
          interim={speech.interim}
        />
      </div>
    </div>
  );
}
