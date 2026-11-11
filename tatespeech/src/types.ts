export type SubscoreKey =
  | "fillers"
  | "clarity"
  | "conviction"
  | "pace"
  | "authority"
  | "structure"
  | "projection"
  | "eye"
  | "downward"
  | "vocabulary"
  | "confidence"
  | "certainty"
  | "style"
  | "substance"
  | "claim";

export type DrillMode = "circuit" | "single" | "free";

export type FillerSource = "speech" | "manual" | "unavailable";

export type EyeModelState = "idle" | "loading" | "ready" | "unavailable";

export interface Subscore {
  key: SubscoreKey;
  label: string;
  score: number;
  detail: string;
  correction: string;
  priority: number;
}

export interface OmittedScore {
  label: string;
  reason: string;
}

export interface TraitScore {
  key: string;
  label: string;
  score: number | null;
  detail: string;
}

export interface ExtraStat {
  label: string;
  value: string;
}

export interface DrillScore {
  id: string;
  drillId: string;
  drillName: string;
  mode: DrillMode;
  at: string;
  date: string;
  durationMs: number;
  overall: number | null;
  subscores: Subscore[];
  omitted: OmittedScore[];
  fillerCount: number;
  fillerRate: number | null;
  fillerSource: FillerSource;
  fillerWords: string[];
  wpm: number | null;
  wpmEstimated: boolean;
  avgPauseMs: number | null;
  controlledPauses: number;
  stalls: number;
  longestCleanMs: number | null;
  eyePct: number | null;
  eyeNote: string;
  deliveryMatch: number | null;
  traits: TraitScore[];
  correction: string;
  transcript: string | null;
  notes: string;
  extras: ExtraStat[];
  sessionId?: string;
}

export interface SessionRecord {
  id: string;
  at: string;
  date: string;
  overall: number | null;
  drillIds: string[];
  bestDrill: string | null;
  weakestDrill: string | null;
  correction: string;
  deliveryMatch: number | null;
  fillerCount: number;
  fillerRate: number | null;
  eyePct: number | null;
  conviction: number | null;
  notes: string;
  countsForStreak: boolean;
  streakAfter: number;
  totalMs: number;
}

export interface PersonalRecords {
  bestOverall: number | null;
  bestDelivery: number | null;
  bestFillerRate: number | null;
  bestEye: number | null;
  longestCleanMs: number | null;
}

export interface Store {
  version: 1;
  streak: number;
  lastSessionDate: string | null;
  sessions: SessionRecord[];
  drills: DrillScore[];
  personalRecords: PersonalRecords;
  customLines: string[];
}

export interface PauseMark {
  durationMs: number;
  kind: "controlled" | "stall";
}

export interface EndingMark {
  trend: "fall" | "rise" | "flat";
}

export interface FillerHit {
  word: string;
  atMs: number;
}

export interface LevelSample {
  t: number;
  rms: number;
  speech: boolean;
}

export interface Take {
  durationMs: number;
  transcript: string;
  speechSupported: boolean;
  speechRan: boolean;
  speechError: string | null;
  fillers: FillerHit[];
  manualFillers: number;
  words: number;
  restarts: number;
  speakingMs: number;
  silenceMs: number;
  pauses: PauseMark[];
  endings: EndingMark[];
  collapsedUtterances: number;
  utterances: number;
  speakingRms: number | null;
  noiseRms: number | null;
  clipRatio: number;
  audioFrames: number;
  syllablePeaks: number;
  peakTimes: number[];
  samples: LevelSample[];
  eyeLooked: number;
  eyeTotal: number;
  eyeFace: number;
  eyeModel: EyeModelState;
  taskHits: number;
  taskShown: number;
  reps: number;
  voicedPrompts: number;
  promptsShown: number;
  simileHits: number;
  passLoudOk: boolean | null;
  passSlowOk: boolean | null;
}
