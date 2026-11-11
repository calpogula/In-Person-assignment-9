import { useSyncExternalStore } from "react";
import type { DrillScore, PersonalRecords, SessionRecord, Store, Subscore } from "../types";
import { displayStreak, formatIsoDate, nextStreak } from "./dates";
import { mean } from "./text";
import { correctionLine, worstSubscore } from "./scoring";

const KEY = "tatespeech.v1";

function emptyRecords(): PersonalRecords {
  return {
    bestOverall: null,
    bestDelivery: null,
    bestFillerRate: null,
    bestEye: null,
    longestCleanMs: null,
  };
}

export function emptyStore(): Store {
  return {
    version: 1,
    streak: 0,
    lastSessionDate: null,
    sessions: [],
    drills: [],
    personalRecords: emptyRecords(),
    customLines: [],
  };
}

let state: Store = load();
const listeners = new Set<() => void>();

function load(): Store {
  if (typeof localStorage === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<Store>;
    if (!parsed || parsed.version !== 1) return emptyStore();
    return {
      ...emptyStore(),
      ...parsed,
      personalRecords: { ...emptyRecords(), ...parsed.personalRecords },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      drills: Array.isArray(parsed.drills) ? parsed.drills : [],
      customLines: Array.isArray(parsed.customLines) ? parsed.customLines : [],
    };
  } catch {
    return emptyStore();
  }
}

function emit(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((listener) => listener());
}

function update(next: Store): void {
  state = next;
  emit();
}

export function getStore(): Store {
  return state;
}

export function subscribeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStore(): Store {
  return useSyncExternalStore(subscribeStore, getStore, getStore);
}

export function visibleStreak(today = formatIsoDate(new Date())): number {
  return displayStreak(state.streak, state.lastSessionDate, today);
}

function considerRecords(score: DrillScore, records: PersonalRecords): PersonalRecords {
  const next = { ...records };
  if (score.overall != null) next.bestOverall = Math.max(next.bestOverall ?? 0, score.overall);
  if (score.deliveryMatch != null) next.bestDelivery = Math.max(next.bestDelivery ?? 0, score.deliveryMatch);
  if (score.eyePct != null) next.bestEye = Math.max(next.bestEye ?? 0, score.eyePct);
  if (score.longestCleanMs != null) next.longestCleanMs = Math.max(next.longestCleanMs ?? 0, score.longestCleanMs);
  if (
    score.fillerSource === "speech" &&
    score.fillerRate != null &&
    score.durationMs >= 45_000 &&
    score.wpm != null &&
    !score.wpmEstimated
  ) {
    next.bestFillerRate = Math.min(next.bestFillerRate ?? Number.POSITIVE_INFINITY, score.fillerRate);
  }
  return next;
}

export function saveDrill(score: DrillScore): DrillScore {
  const drills = [score, ...state.drills].slice(0, 200);
  update({
    ...state,
    drills,
    personalRecords: considerRecords(score, state.personalRecords),
  });
  return score;
}

export function setDrillNotes(id: string, notes: string): void {
  update({
    ...state,
    drills: state.drills.map((drill) => (drill.id === id ? { ...drill, notes } : drill)),
  });
}

export function setSessionNotes(id: string, notes: string): void {
  update({
    ...state,
    sessions: state.sessions.map((session) => (session.id === id ? { ...session, notes } : session)),
  });
}

export function addCustomLine(line: string): void {
  const clean = line.trim();
  if (!clean || state.customLines.includes(clean)) return;
  update({ ...state, customLines: [clean, ...state.customLines].slice(0, 24) });
}

export function commitSession(drills: DrillScore[], today = formatIsoDate(new Date())): SessionRecord {
  const signature = drills.map((drill) => drill.id).join("|");
  const existing = state.sessions.find((session) => session.drillIds.join("|") === signature);
  if (existing && signature) return existing;
  const totalMs = drills.reduce((sum, drill) => sum + drill.durationMs, 0);
  const countsForStreak = totalMs >= 8 * 60 * 1000;
  const overalls = drills.map((drill) => drill.overall).filter((score): score is number => score != null);
  const deliveries = drills.map((drill) => drill.deliveryMatch).filter((score): score is number => score != null);
  const eyes = drills.map((drill) => drill.eyePct).filter((score): score is number => score != null);
  const convictions = drills.flatMap((drill) =>
    drill.subscores.filter((sub) => sub.key === "conviction").map((sub) => sub.score),
  );
  const fillerCount = drills.reduce((sum, drill) => sum + (drill.fillerSource === "unavailable" ? 0 : drill.fillerCount), 0);
  const minutes = totalMs / 60000;
  const ranked = drills.filter((drill) => drill.overall != null);
  const best = ranked.reduce<DrillScore | null>((top, drill) => (top == null || (drill.overall ?? 0) > (top.overall ?? 0) ? drill : top), null);
  const weakest = ranked.reduce<DrillScore | null>((low, drill) => (low == null || (drill.overall ?? 0) < (low.overall ?? 0) ? drill : low), null);
  const pool: Subscore[] = drills.flatMap((drill) => drill.subscores);
  const worst = worstSubscore(pool);
  const streakAfter = countsForStreak ? nextStreak(state.streak, state.lastSessionDate, today) : state.streak;
  const session: SessionRecord = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    date: today,
    overall: overalls.length ? Math.round(mean(overalls) ?? 0) : null,
    drillIds: drills.map((drill) => drill.id),
    bestDrill: best?.drillName ?? null,
    weakestDrill: weakest?.drillName ?? null,
    correction: correctionLine(worst),
    deliveryMatch: deliveries.length ? Math.round(mean(deliveries) ?? 0) : null,
    fillerCount,
    fillerRate: minutes > 0 ? fillerCount / minutes : null,
    eyePct: eyes.length ? Math.round(mean(eyes) ?? 0) : null,
    conviction: convictions.length ? Math.round((mean(convictions) ?? 0) * 10) / 10 : null,
    notes: "",
    countsForStreak,
    streakAfter,
    totalMs,
  };
  const tagged = new Set(drills.map((drill) => drill.id));
  update({
    ...state,
    streak: countsForStreak ? streakAfter : state.streak,
    lastSessionDate: countsForStreak ? today : state.lastSessionDate,
    sessions: [session, ...state.sessions].slice(0, 100),
    drills: state.drills.map((drill) => (tagged.has(drill.id) ? { ...drill, sessionId: session.id } : drill)),
  });
  return session;
}

export function clearStore(): void {
  update(emptyStore());
}

export function completedToday(today = formatIsoDate(new Date())): SessionRecord | null {
  return state.sessions.find((session) => session.date === today && session.countsForStreak) ?? null;
}

const PROGRESS_KEY = "tatespeech.circuit.progress";

interface CircuitProgressFile {
  day: string;
  nextIndex: number;
  ids: string[];
}

export function saveCircuitProgress(nextIndex: number, ids: string[]): void {
  if (typeof sessionStorage === "undefined") return;
  const payload: CircuitProgressFile = { day: formatIsoDate(new Date()), nextIndex, ids };
  sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(payload));
}

export function loadCircuitProgress(): { nextIndex: number; drills: DrillScore[] } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CircuitProgressFile;
    if (!parsed || parsed.day !== formatIsoDate(new Date())) return null;
    const drills = parsed.ids
      .map((id) => state.drills.find((drill) => drill.id === id))
      .filter((drill): drill is DrillScore => drill != null);
    return { nextIndex: parsed.nextIndex, drills };
  } catch {
    return null;
  }
}

export function clearCircuitProgress(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(PROGRESS_KEY);
}
