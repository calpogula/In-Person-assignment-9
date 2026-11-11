import type { DrillScore, ExtraStat, OmittedScore, Subscore, SubscoreKey, Take, TraitScore } from "../types";
import { countHedges } from "./fillers";
import { dbFromRms } from "./pitch";
import { clamp, mean, splitSentences, wordCount } from "./text";

export const SUBSCORE_LABELS: Record<SubscoreKey, string> = {
  fillers: "Fillers",
  clarity: "Clarity",
  conviction: "Conviction",
  pace: "Pace",
  authority: "Authority",
  structure: "Structure",
  projection: "Projection",
  eye: "Eye contact",
  downward: "Downward intonation",
  vocabulary: "Vocabulary",
  confidence: "Confidence",
  certainty: "Certainty",
  style: "Style",
  substance: "Substance",
  claim: "Claim discipline",
};

const CLAIM_NOTE =
  "Grades how the claim is made, not whether it is true. Concrete, checkable wording scores higher than vague, absolute, or hedged wording.";

const NO_SIGNAL = "Nothing to score. Open the mic and speak the rep.";

export interface ScoreDraft {
  overall: number | null;
  subscores: Subscore[];
  omitted: OmittedScore[];
  fillerCount: number;
  fillerRate: number | null;
  fillerSource: DrillScore["fillerSource"];
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
  extras: ExtraStat[];
}

export function scoreTake(drillId: string, wanted: readonly SubscoreKey[], take: Take): ScoreDraft {
  const text = take.transcript.trim();
  const filler = fillerInfo(take);
  const pace = paceInfo(take);
  const projection = projectionInfo(take);
  const downward = downwardInfo(take);
  const eye = eyeInfo(take);
  const hedge = text ? hedgeInfo(text) : null;
  const steady = steadinessScore(take);
  const clarity = clarityScore(take);
  const style = styleScore(take, drillId);
  const structure = structureScore(take, drillId);
  const substance = substanceScore(take, drillId);
  const claim = claimInfo(text);
  const vocabulary = vocabularyScore(take, drillId);
  const short = text ? shortDeclarative(text) : null;
  const frame = text ? frameControl(text) : null;

  const conviction = average10([steady, downward.score, hedge?.score ?? null]);
  const confidence = average10([hedge?.score ?? null, steady]);
  const certainty = average10([hedge?.score ?? null, downward.score]);
  const authority = authorityScore(projection?.score ?? null, downward.score, frame, short);

  const available: Partial<Record<SubscoreKey, { score: number; detail: string; correction: string; priority: number }>> = {};

  if (filler.score != null) {
    available.fillers = {
      score: filler.score,
      detail: filler.detail,
      correction: "You reached for a filler. Own the pause.",
      priority: 1,
    };
  }
  if (downward.score != null) {
    const rose = downward.rises >= downward.falls;
    available.downward = {
      score: downward.score,
      detail: downward.detail,
      correction: rose
        ? "Your endings rose. Tomorrow, land the last word."
        : "Your endings went flat. Tomorrow, land the last word.",
      priority: 2,
    };
  }
  if (eye.score != null) {
    available.eye = {
      score: eye.score,
      detail: eye.note,
      correction: eye.outOfFrame
        ? "The camera lost your face. Sit in frame and hold it."
        : "You looked away when the sentence got hard. Eyes stay up.",
      priority: 3,
    };
  }
  if (hedge) {
    const line = "You hedged with maybe, very, and I think. Cut them.";
    available.confidence = { score: confidence ?? hedge.score, detail: hedge.detail, correction: line, priority: 4 };
    available.certainty = { score: certainty ?? hedge.score, detail: hedge.detail, correction: line, priority: 4 };
  } else if (confidence != null) {
    available.confidence = {
      score: confidence,
      detail: "Confidence from vocal steadiness. Not enough words to grade hedges.",
      correction: "You trailed off at the end. Hold the last word up.",
      priority: 4,
    };
  }
  if (certainty != null && !available.certainty) {
    available.certainty = {
      score: certainty,
      detail: downward.score != null ? downward.detail : "Certainty from the endings you actually landed.",
      correction: "Your endings rose. Tomorrow, land the last word.",
      priority: 4,
    };
  }
  if (pace) {
    available.pace = {
      score: pace.score,
      detail: pace.detail,
      correction: paceCorrection(pace.problem, projection),
      priority: 5,
    };
  }
  if (projection) {
    available.projection = {
      score: projection.score,
      detail: projection.detail,
      correction: projection.loud
        ? "Volume was there. Control was not. Slower, not louder."
        : "The voice died in the mouth. Aim it at the back of the room.",
      priority: 6,
    };
  }
  if (claim) {
    available.claim = {
      score: claim.score,
      detail: claim.detail,
      correction: "The claim was vague. Name the thing.",
      priority: 7,
    };
  }
  if (substance != null) {
    available.substance = {
      score: substance,
      detail: substanceDetail(drillId),
      correction: "The claim was vague. Name the thing.",
      priority: 8,
    };
  }
  if (style != null) {
    available.style = {
      score: style.score,
      detail: style.detail,
      correction: style.correction,
      priority: 9,
    };
  }
  if (structure != null) {
    available.structure = {
      score: structure.score,
      detail: structure.detail,
      correction: structure.correction,
      priority: 10,
    };
  }
  if (clarity != null) {
    available.clarity = {
      score: clarity.score,
      detail: clarity.detail,
      correction: "The line broke up. One clean sentence.",
      priority: 11,
    };
  }
  if (vocabulary != null) {
    available.vocabulary = {
      score: vocabulary.score,
      detail: vocabulary.detail,
      correction: "You kept the weak word. Say the precise one.",
      priority: 6,
    };
  }
  if (conviction != null) {
    const hedgeLed = hedge != null && (steady == null || hedge.score <= (steady ?? 10));
    available.conviction = {
      score: conviction,
      detail: convictionDetail(hedge?.score ?? null, steady, downward.score),
      correction: hedgeLed
        ? "You hedged with maybe, very, and I think. Cut them."
        : "You trailed off at the end. Hold the last word up.",
      priority: 4,
    };
  }
  if (authority != null) {
    available.authority = {
      score: authority,
      detail: "Authority mixes projection, falling endings, a short line, and whether the answer defended inside the charge.",
      correction: frame != null && frame < 50
        ? "That answer explained itself. One sentence."
        : "Volume was there. Control was not. Slower, not louder.",
      priority: 8,
    };
  }

  const subscores: Subscore[] = [];
  const omitted: OmittedScore[] = [];
  for (const key of wanted) {
    const row = available[key];
    if (!row) {
      omitted.push({ label: SUBSCORE_LABELS[key], reason: omitReason(key, take, filler, pace, eye, downward) });
      continue;
    }
    subscores.push({
      key,
      label: SUBSCORE_LABELS[key],
      score: row.score,
      detail: row.detail,
      correction: row.correction,
      priority: row.priority,
    });
  }

  const traits = deliveryTraits({
    take,
    fillerScore: filler.score,
    fillerReason: filler.omitReason,
    hedgeScore: hedge?.score ?? null,
    hedgeReason: hedge ? null : "Not enough transcript to grade hedges.",
    downward: downward.score,
    downwardReason: downward.score == null ? downward.detail : null,
    paceScore: pace?.score ?? null,
    paceReason: pace ? null : "Pace needs a transcript or enough voiced audio to estimate.",
    eyeScore: eye.score,
    eyeReason: eye.score == null ? eye.note : null,
    projectionScore: projection?.score ?? null,
    projectionReason: projection ? null : "Projection needs a few seconds of voice.",
    short,
    frame,
  });

  const traitNums = traits.map((trait) => trait.score).filter((score): score is number => score != null);
  const deliveryMatch = traitNums.length === 0 ? null : clamp(Math.round(mean(traitNums) ?? 0), 0, 100);
  const overall = subscores.length === 0 ? null : clamp(Math.round((mean(subscores.map((row) => row.score)) ?? 0) * 10), 0, 100);

  const correction = pickCorrection(subscores);

  return {
    overall,
    subscores,
    omitted,
    fillerCount: filler.count,
    fillerRate: filler.rate,
    fillerSource: filler.source,
    fillerWords: take.fillers.map((hit) => hit.word),
    wpm: pace?.wpm ?? null,
    wpmEstimated: pace?.estimated ?? false,
    avgPauseMs: averagePause(take),
    controlledPauses: take.pauses.filter((pause) => pause.kind === "controlled").length,
    stalls: take.pauses.filter((pause) => pause.kind === "stall").length,
    longestCleanMs: longestClean(take, filler.source),
    eyePct: eye.pct,
    eyeNote: eye.note,
    deliveryMatch,
    traits,
    correction,
    transcript: text ? text : null,
    extras: extrasFor(drillId, take),
  };
}

function average10(parts: (number | null)[]): number | null {
  const nums = parts.filter((part): part is number => part != null);
  if (nums.length === 0) return null;
  return clamp(Math.round(mean(nums) ?? 0), 0, 10);
}

function fillerRateScore(rate: number): number {
  if (rate <= 0) return 10;
  if (rate < 0.5) return 9;
  if (rate < 1) return 8;
  if (rate < 1.5) return 7;
  if (rate < 2) return 6;
  if (rate < 3) return 4;
  if (rate < 4) return 3;
  if (rate < 6) return 2;
  return 1;
}

function fillerInfo(take: Take): {
  count: number;
  source: DrillScore["fillerSource"];
  score: number | null;
  rate: number | null;
  detail: string;
  omitReason: string;
} {
  const minutes = take.durationMs / 60000;
  const recognitionMissed = take.speechRan && take.words === 0 && take.speakingMs > 4000;
  if (recognitionMissed) {
    return {
      count: 0,
      source: "unavailable",
      score: null,
      rate: null,
      detail: "",
      omitReason: "The mic heard a voice. Speech recognition returned no words, so fillers were not scored.",
    };
  }
  if (take.speechRan && (take.words > 0 || take.fillers.length > 0)) {
    const count = take.fillers.length;
    const rate = minutes > 0 ? count / minutes : null;
    const enough = take.words >= 4 || take.speakingMs >= 3000 || count > 0;
    const stopped = take.speechError ? " Recognition stopped early." : "";
    return {
      count,
      source: "speech",
      score: enough && rate != null ? fillerRateScore(rate) : null,
      rate: enough ? rate : null,
      detail: rate == null ? "No timed window." : `${count} filler${count === 1 ? "" : "s"} · ${rate.toFixed(1)} per minute, from the transcript.${stopped}`,
      omitReason: "Not enough recognized speech to score fillers.",
    };
  }
  if (!take.speechSupported || take.speechError || !take.speechRan) {
    const count = take.manualFillers;
    if (count > 0 && minutes > 0) {
      const rate = count / minutes;
      return {
        count,
        source: "manual",
        score: fillerRateScore(rate),
        rate,
        detail: `${count} tapped filler${count === 1 ? "" : "s"}. This is a lower bound, not a full transcript.`,
        omitReason: "",
      };
    }
    return {
      count,
      source: take.speechSupported ? "unavailable" : "manual",
      score: null,
      rate: null,
      detail: "",
      omitReason: take.speechSupported
        ? "Speech recognition did not run, and the manual tally was not used. A zero tap count is not scored as clean."
        : "Speech recognition is unavailable. The manual tally was 0, so fillers were not scored as clean.",
    };
  }
  return {
    count: 0,
    source: "unavailable",
    score: null,
    rate: null,
    detail: "",
    omitReason: "No filler signal.",
  };
}

function paceBand(wpm: number): { score: number; problem: "ok" | "rushed" | "slow" | "stalled" } {
  if (wpm < 70) return { score: 3, problem: "stalled" };
  if (wpm < 95) return { score: 6, problem: "slow" };
  if (wpm <= 155) return { score: 10, problem: "ok" };
  if (wpm <= 175) return { score: 7, problem: "rushed" };
  if (wpm <= 195) return { score: 4, problem: "rushed" };
  return { score: 2, problem: "rushed" };
}

function paceInfo(take: Take): { score: number; wpm: number; estimated: boolean; problem: "ok" | "rushed" | "slow" | "stalled" | "estimate"; detail: string } | null {
  const minutes = take.durationMs / 60000;
  if (minutes <= 0) return null;
  if (take.words >= 8) {
    const wpm = take.words / minutes;
    const band = paceBand(wpm);
    let score = band.score;
    let problem: "ok" | "rushed" | "slow" | "stalled" | "estimate" = band.problem;
    const stalls = take.pauses.filter((pause) => pause.kind === "stall").length;
    if (stalls >= 3 && problem === "ok") {
      score = Math.min(score, 6);
      problem = "stalled";
    }
    let detail = `${Math.round(wpm)} words per minute across the whole take, pauses included.`;
    if (take.passSlowOk === false) {
      score = Math.min(score, 7);
      detail += " The slow pass was not slower.";
    }
    return { score, wpm, estimated: false, problem, detail };
  }
  if (take.speakingMs > 4000 && take.syllablePeaks >= 6) {
    const wpm = take.syllablePeaks / 1.5 / minutes;
    const band = paceBand(wpm);
    return {
      score: Math.min(band.score, 8),
      wpm,
      estimated: true,
      problem: "estimate",
      detail: `About ${Math.round(wpm)} words per minute, estimated from audio energy. No transcript, so this is not a word count.`,
    };
  }
  return null;
}

function projectionInfo(take: Take): { score: number; detail: string; loud: boolean; quiet: boolean } | null {
  if (take.audioFrames < 8 || take.speakingMs < 1500 || take.speakingRms == null) return null;
  const db = dbFromRms(take.speakingRms);
  const noise = take.noiseRms ?? 0.004;
  const snr = 20 * Math.log10(take.speakingRms / Math.max(noise, 1e-6));
  let score = 5;
  let quiet = false;
  let loud = false;
  if (snr < 6) {
    score = 2;
    quiet = true;
  } else if (snr < 10) {
    score = 5;
    quiet = true;
  } else if (snr < 14) score = 7;
  else if (snr <= 32) score = 10;
  else {
    score = 8;
    loud = true;
  }
  if (db > -8 || take.clipRatio > 0.02) {
    score = Math.min(score, 4);
    loud = true;
    quiet = false;
  }
  let detail = `Voice sat about ${Math.round(snr)} dB above the room.`;
  if (take.clipRatio > 0.02 || db > -8) detail += " The mic clipped or ran hot. That is shouting, not projection.";
  else if (quiet) detail += " Too quiet for the room.";
  else if (loud) detail += " Hot signal. Back it off.";
  else detail += " Projected, not shouted.";
  if (take.passLoudOk === false) {
    score = Math.min(score, 6);
    detail += " The louder pass did not rise above the first.";
  }
  return { score: clamp(score, 0, 10), detail, loud, quiet };
}

function downwardInfo(take: Take): { score: number | null; detail: string; falls: number; rises: number; flats: number } {
  const falls = take.endings.filter((ending) => ending.trend === "fall").length;
  const rises = take.endings.filter((ending) => ending.trend === "rise").length;
  const flats = take.endings.filter((ending) => ending.trend === "flat").length;
  const total = falls + rises + flats;
  if (total < 2) {
    return {
      score: null,
      detail: total === 0 ? "No phrase ending had a stable pitch." : "Only one phrase ending. Intonation needs two.",
      falls,
      rises,
      flats,
    };
  }
  const score = clamp(Math.round((falls * 10 + flats * 5 + rises * 1) / total), 0, 10);
  return {
    score,
    detail: `${falls} falling, ${flats} flat, ${rises} rising. Downward endings score. Rising endings do not.`,
    falls,
    rises,
    flats,
  };
}

function eyeInfo(take: Take): { pct: number | null; score: number | null; note: string; outOfFrame: boolean } {
  if (take.eyeModel !== "ready") {
    const note = take.eyeModel === "loading"
      ? "The eye-contact model was still loading. No percentage."
      : "Eye-contact model unavailable. No percentage.";
    return { pct: null, score: null, note, outOfFrame: false };
  }
  if (take.eyeTotal < 8) {
    return { pct: null, score: null, note: "Not enough camera frames to score eye contact.", outOfFrame: false };
  }
  const pct = Math.round((take.eyeLooked / take.eyeTotal) * 100);
  const faceRate = take.eyeFace / take.eyeTotal;
  let score = pct >= 85 ? 10 : pct >= 75 ? 8 : pct >= 60 ? 6 : pct >= 45 ? 4 : pct >= 30 ? 2 : 1;
  let note = `${pct}% of scored frames were looking at the camera. Head within 18° yaw and 15° pitch, gaze near center.`;
  const outOfFrame = faceRate < 0.35;
  if (outOfFrame) {
    score = Math.min(score, 3);
    note = "Your face left the frame for most of the take.";
  }
  return { pct, score, note, outOfFrame };
}

function hedgeInfo(text: string): { score: number; count: number; detail: string } | null {
  const words = wordCount(text);
  if (words < 8) return null;
  const count = countHedges(text);
  const rate = count / words;
  let score = 10;
  if (rate === 0) score = 10;
  else if (rate < 0.02) score = 8;
  else if (rate < 0.04) score = 6;
  else if (rate < 0.07) score = 4;
  else if (rate < 0.1) score = 2;
  else score = 1;
  return {
    score,
    count,
    detail: count === 0 ? "No hedge words in the transcript." : `${count} hedge${count === 1 ? "" : "s"} in ${words} words.`,
  };
}

function steadinessScore(take: Take): number | null {
  if (take.utterances < 2) return null;
  const ratio = take.collapsedUtterances / take.utterances;
  if (ratio === 0) return 10;
  if (ratio < 0.2) return 8;
  if (ratio < 0.4) return 6;
  if (ratio < 0.6) return 4;
  return 2;
}

function clarityScore(take: Take): { score: number; detail: string } | null {
  const audio = take.audioFrames > 8 && take.speakingMs > 1000;
  const text = take.words >= 6;
  if (!audio && !text) return null;
  let score = 7;
  if (audio && take.clipRatio > 0.02) score -= 3;
  if (text && take.restarts > 1) score -= Math.min(3, take.restarts);
  if (text && take.restarts === 0 && (!audio || take.clipRatio < 0.01)) score += 2;
  if (!text && audio) score = take.clipRatio > 0.02 ? 4 : 6;
  return {
    score: clamp(Math.round(score), 0, 10),
    detail: text
      ? "Clarity from a clean transcript and a mic that did not clip."
      : "Clarity from audio only. No transcript.",
  };
}

function styleScore(take: Take, drillId: string): { score: number; detail: string; correction: string } | null {
  const text = take.transcript.trim();
  if (!text || take.words < 4) return null;
  const sentences = splitSentences(text);
  const avg = mean(sentences.map((sentence) => wordCount(sentence))) ?? take.words;
  let score = 8;
  let correction = "That answer explained itself. One sentence.";
  if (avg > 18) score -= 3;
  if (avg > 28) score -= 2;
  if (take.restarts > 0) {
    score -= Math.min(4, take.restarts);
    correction = "You restarted the line. Finish the sentence you started.";
  }
  if (take.utterances >= 2 && take.collapsedUtterances / take.utterances > 0.5) {
    score -= 2;
    if (take.restarts === 0 && avg <= 18) correction = "You trailed off at the end. Hold the last word up.";
  }
  if (drillId === "comeback") {
    if (sentences.length === 1 && take.words <= 18) score = 10;
    else score -= 4;
    correction = "That answer explained itself. One sentence.";
  }
  if (avg >= 5 && avg <= 14 && take.restarts === 0) score = Math.max(score, 8);
  const boundary = /[.!?]/.test(text) ? "Sentence boundaries came from speech recognition." : "Speech recognition did not mark sentences. The whole transcript was treated as one line.";
  return {
    score: clamp(Math.round(score), 0, 10),
    detail: `About ${Math.round(avg)} words a sentence. ${take.restarts} restart${take.restarts === 1 ? "" : "s"}. ${boundary}`,
    correction,
  };
}

function structureScore(take: Take, drillId: string): { score: number; detail: string; correction: string } | null {
  if (drillId === "metaphor") {
    if (take.simileHits > 0) {
      return { score: 9, detail: "Heard a simile pattern (it is like / like a / resembles).", correction: "Name the move. Claim, reason, then stop." };
    }
    if (take.words < 4) return null;
    return { score: 3, detail: "No simile pattern in the transcript.", correction: "Name the image. It is like a thing, then the point." };
  }
  if (take.words < 5) return null;
  const text = take.transcript.trim();
  const sentences = splitSentences(text);
  if (drillId === "frame-answer") {
    const denial = /^(no\b|i'm not|i am not|i don't|i do not|that's not|that is not)/i.test(text);
    let score = 5;
    if (sentences.length === 1 || sentences.length === 2) score += 2;
    if (sentences.length > 3) score -= 3;
    if (denial) score -= 4;
    if (/\b(because|so|the standard|what matters|the issue is|the point)\b/i.test(text)) score += 2;
    return {
      score: clamp(score, 0, 10),
      detail: denial
        ? "Opened inside the accusation. Reframe first."
        : "Checked sentence count and whether the answer opened with a denial. This does not judge the argument.",
      correction: denial ? "You answered inside their wording. Reframe, then stop." : "Name the move. Claim, reason, then stop.",
    };
  }
  if (drillId === "three-word") {
    let score = 4;
    if (take.words >= 6) score += 3;
    if (sentences.length > 2) score -= 2;
    return {
      score: clamp(score, 0, 10),
      detail: "One complete sentence scores. A second draft does not.",
      correction: "Keep the first sentence.",
    };
  }
  if (drillId === "weight") {
    let score = 4;
    if (sentences.length >= 2 && sentences.length <= 3) score += 3;
    if (sentences.length > 3) score -= 3;
    const last = sentences[sentences.length - 1] ?? text;
    if (/\b(will|start|stop|call|set|book|write|move|send|decide|cut|ship|do|by)\b/i.test(last)) score += 2;
    return {
      score: clamp(score, 0, 10),
      detail: "Diagnosis, decision, direction: two or three sentences, last one a named action.",
      correction: "Three sentences. End with the action and a name.",
    };
  }
  let score = 4;
  if (/\b(because|so|for example|which means|the point)\b/i.test(text)) score += 3;
  if (sentences.length >= 2) score += 1;
  return {
    score: clamp(score, 0, 10),
    detail: "Looked for a claim plus a reason or an example. It does not check the facts.",
    correction: "Name the move. Claim, reason, then stop.",
  };
}

function substanceScore(take: Take, drillId: string): number | null {
  if (drillId === "metaphor" && take.simileHits > 0 && take.words < 6) return 7;
  if (take.words < 6) return null;
  const text = take.transcript;
  let score = 4;
  if (/\b(because|so that|so we|which means|for example|the point|that means)\b/i.test(text)) score += 2;
  if (/\b\d+/.test(text)) score += 2;
  if (/\b(something|stuff|things|whatever|somehow)\b/i.test(text)) score -= 2;
  const sentences = splitSentences(text);
  if (drillId === "weight") {
    if (sentences.length >= 1 && sentences.length <= 3) score += 2;
    if (sentences.length > 3) score -= 2;
  } else if (drillId === "frame-answer") {
    if (sentences.length >= 1 && sentences.length <= 2) score += 2;
    if (sentences.length > 3) score -= 3;
  } else if (sentences.length >= 2) score += 1;
  return clamp(Math.round(score), 0, 10);
}

function substanceDetail(drillId: string): string {
  if (drillId === "metaphor") return "A physical image plus a point. Vague nouns get cut.";
  if (drillId === "weight") return "Specifics and a next action. Vague nouns get cut.";
  return "Specifics, a reason, or a number. Vague nouns get cut. Truth is not checked.";
}

function claimInfo(text: string): { score: number; detail: string } | null {
  const words = wordCount(text);
  if (words < 6) return null;
  let score = 6;
  const vague = text.match(/\b(something|stuff|things|whatever|somehow|someone|a bit|kind of|sort of)\b/gi)?.length ?? 0;
  const absolute = text.match(/\b(always|never|everyone|nobody|nothing|no one)\b/gi)?.length ?? 0;
  const concrete = text.match(/\b\d+(\.\d+)?\b|\b(percent|dollars|hours|days|weeks|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi)?.length ?? 0;
  score += Math.min(3, concrete * 1.5);
  score -= Math.min(4, vague * 1.2);
  score -= Math.min(3, absolute);
  score -= Math.min(3, countHedges(text));
  return { score: clamp(Math.round(score), 0, 10), detail: CLAIM_NOTE };
}

function vocabularyScore(take: Take, drillId: string): { score: number; detail: string } | null {
  if (drillId !== "kill-very") return null;
  if (!take.speechRan || take.speechError) return null;
  if (take.taskShown <= 0) return null;
  if (take.words === 0 && take.speakingMs > 2000) return null;
  const score = clamp(Math.round((take.taskHits / take.taskShown) * 10), 0, 10);
  return {
    score,
    detail: `${take.taskHits} of ${take.taskShown} precise replacements showed up in the transcript.`,
  };
}

function shortDeclarative(text: string): number | null {
  const sentences = splitSentences(text);
  if (sentences.length === 0 || wordCount(text) < 4) return null;
  const avg = mean(sentences.map((sentence) => wordCount(sentence))) ?? wordCount(text);
  const questions = (text.match(/\?/g) || []).length / sentences.length;
  let score = 100;
  if (avg < 4) score -= 25;
  if (avg > 16) score -= Math.min(50, (avg - 16) * 4);
  if (avg > 26) score -= 15;
  score -= questions * 40;
  return clamp(Math.round(score), 0, 100);
}

function frameControl(text: string): number | null {
  if (wordCount(text) < 6) return null;
  let score = 78;
  if (/^(no\b|nope\b)/i.test(text.trim())) score -= 25;
  if (/\b(i'm not|i am not|i don't|i do not|that's not|that is not|you misunderstood|that's not what i)\b/i.test(text)) score -= 35;
  const words = wordCount(text);
  if (words > 45) score -= 20;
  if (words <= 28) score += 12;
  return clamp(Math.round(score), 0, 100);
}

function authorityScore(
  projection: number | null,
  downward: number | null,
  frame: number | null,
  short: number | null,
): number | null {
  const parts: number[] = [];
  if (projection != null) parts.push(projection);
  if (downward != null) parts.push(downward);
  if (frame != null) parts.push(frame / 10);
  if (short != null) parts.push(short / 10);
  if (parts.length < 2) return null;
  return clamp(Math.round(mean(parts) ?? 0), 0, 10);
}

function paceCorrection(
  problem: "ok" | "rushed" | "slow" | "stalled" | "estimate",
  projection: { loud: boolean; score: number } | null,
): string {
  if (problem === "stalled" || problem === "slow") return "That pause was a stall. Cut it to one beat, then land the word.";
  if (problem === "rushed" && projection && (projection.loud || projection.score >= 8)) {
    return "Volume was there. Control was not. Slower, not louder.";
  }
  if (problem === "rushed" || problem === "estimate") return "You rushed the line. Slower, not louder.";
  return "Volume was there. Control was not. Slower, not louder.";
}

function convictionDetail(hedge: number | null, steady: number | null, downward: number | null): string {
  const bits = [
    hedge == null ? null : `hedges ${hedge}/10`,
    steady == null ? null : `steadiness ${steady}/10`,
    downward == null ? null : `endings ${downward}/10`,
  ].filter((bit): bit is string => Boolean(bit));
  return bits.length === 0 ? "No steadiness, hedge, or ending signal." : bits.join(" · ");
}

function averagePause(take: Take): number | null {
  if (take.pauses.length === 0) return null;
  return Math.round(mean(take.pauses.map((pause) => pause.durationMs)) ?? 0);
}

function longestClean(take: Take, source: DrillScore["fillerSource"]): number | null {
  if (source !== "speech") return null;
  if (take.durationMs < 1000) return null;
  const marks = [0, ...take.fillers.map((hit) => hit.atMs), take.durationMs].sort((a, b) => a - b);
  let best = 0;
  for (let i = 1; i < marks.length; i += 1) best = Math.max(best, marks[i] - marks[i - 1]);
  return best;
}

function omitReason(
  key: SubscoreKey,
  take: Take,
  filler: { omitReason: string },
  pace: unknown,
  eye: { note: string },
  downward: { detail: string },
): string {
  if (key === "fillers" || key === "vocabulary") return filler.omitReason || "No filler signal.";
  if (key === "pace") return pace ? "Pace was not requested." : "Pace needs a transcript or enough voiced audio.";
  if (key === "eye") return eye.note;
  if (key === "downward" || key === "certainty") return downward.detail;
  if (key === "projection") return "Not enough voiced audio to score projection.";
  if (key === "claim" || key === "substance" || key === "style" || key === "structure" || key === "confidence") {
    if (!take.speechRan) return "This needs a transcript. Speech recognition did not run.";
    if (take.words === 0) return "Speech recognition returned no words.";
    return "Not enough transcript to score this.";
  }
  if (key === "clarity") return "No audio and no transcript.";
  if (key === "authority" || key === "conviction") return "Not enough of the underlying signals.";
  return "Signal missing.";
}

function deliveryTraits(input: {
  take: Take;
  fillerScore: number | null;
  fillerReason: string;
  hedgeScore: number | null;
  hedgeReason: string | null;
  downward: number | null;
  downwardReason: string | null;
  paceScore: number | null;
  paceReason: string | null;
  eyeScore: number | null;
  eyeReason: string | null;
  projectionScore: number | null;
  projectionReason: string | null;
  short: number | null;
  frame: number | null;
}): TraitScore[] {
  const words = input.take.words;
  return [
    {
      key: "short",
      label: "Short declarative lines",
      score: input.short,
      detail: input.short == null ? "Needs a transcript of at least a few words." : "Short lines score. Questions and long explanations do not.",
    },
    {
      key: "filler",
      label: "No filler",
      score: input.fillerScore == null ? null : input.fillerScore * 10,
      detail: input.fillerScore == null ? input.fillerReason : "From the filler rate on this take.",
    },
    {
      key: "hedge",
      label: "No hedge",
      score: input.hedgeScore == null ? null : input.hedgeScore * 10,
      detail: input.hedgeReason ?? "Hedge words in the transcript: maybe, very, I think, and the rest of that list.",
    },
    {
      key: "down",
      label: "Downward endings",
      score: input.downward == null ? null : input.downward * 10,
      detail: input.downwardReason ?? "Pitch at the end of each phrase compared with the middle of that phrase.",
    },
    {
      key: "pace",
      label: "Controlled pace",
      score: input.paceScore == null ? null : input.paceScore * 10,
      detail: input.paceScore == null ? input.paceReason ?? "Pace was not scored." : "Target is about 95–155 words per minute, not a sprint.",
    },
    {
      key: "eye",
      label: "Steady eye contact",
      score: input.eyeScore == null ? null : input.eyeScore * 10,
      detail: input.eyeReason ?? "Share of frames looking at the camera.",
    },
    {
      key: "projection",
      label: "Projection without shouting",
      score: input.projectionScore == null ? null : input.projectionScore * 10,
      detail: input.projectionScore == null ? input.projectionReason ?? "Projection was not scored." : "Level above the room, with clipping counted as shouting.",
    },
    {
      key: "frame",
      label: "Frame control",
      score: input.frame,
      detail: words < 6
        ? "Needs a transcript. Checked only for a denial inside the charge and a long defense, not for who is right."
        : "Checked for a denial inside the charge and a long defense. It does not judge the content.",
    },
  ];
}

function extrasFor(drillId: string, take: Take): ExtraStat[] {
  const extras: ExtraStat[] = [];
  if (drillId === "kill-very") {
    extras.push({ label: "Replacements heard", value: `${take.taskHits} / ${take.taskShown}` });
  }
  if (drillId === "final-line") {
    extras.push({ label: "Reps matched to the line", value: `${take.reps} / 5` });
  }
  if (drillId === "rapid-link" || drillId === "three-word" || drillId === "metaphor") {
    extras.push({ label: "Prompts you voiced", value: `${take.voicedPrompts} / ${take.promptsShown}` });
  }
  if (drillId === "metaphor") {
    extras.push({ label: "Similes heard", value: String(take.simileHits) });
  }
  if (drillId === "voice-lock") {
    extras.push({
      label: "Louder pass",
      value: take.passLoudOk == null ? "Not enough audio" : take.passLoudOk ? "Rose" : "Did not rise",
    });
    extras.push({
      label: "Slow pass",
      value: take.passSlowOk == null ? "Not enough audio" : take.passSlowOk ? "Slower" : "Not slower",
    });
  }
  if (take.manualFillers > 0) {
    extras.push({ label: "Manual filler taps", value: String(take.manualFillers) });
  }
  return extras;
}

export function correctionLine(sub: Subscore | null): string {
  if (!sub) return NO_SIGNAL;
  if (sub.score >= 8) return "Hold this. Do not decorate the next sentence.";
  return sub.correction;
}

function pickCorrection(subscores: Subscore[]): string {
  return correctionLine(worstSubscore(subscores));
}

export function worstSubscore(subscores: Subscore[]): Subscore | null {
  if (subscores.length === 0) return null;
  return [...subscores].sort((a, b) => a.score - b.score || a.priority - b.priority)[0];
}

export function bestSubscore(subscores: Subscore[]): Subscore | null {
  if (subscores.length === 0) return null;
  return [...subscores].sort((a, b) => b.score - a.score || a.priority - b.priority)[0];
}
