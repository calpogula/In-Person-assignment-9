import type { EndingMark, EyeModelState, FillerHit, LevelSample, PauseMark, Take } from "../types";
import { findFillers } from "./fillers";
import { endingTrend } from "./pitch";
import { countRestarts, mean, wordCount } from "./text";

interface PitchSample {
  t: number;
  rms: number;
  pitch: number | null;
}

const SPEECH_HOLD_MS = 180;

export class SessionRecorder {
  t0 = 0;
  running = false;
  transcript = "";
  interim = "";
  speechSupported = false;
  speechRan = false;
  speechError: string | null = null;
  fillers: FillerHit[] = [];
  manualFillers = 0;
  speakingMs = 0;
  silenceMs = 0;
  pauses: PauseMark[] = [];
  endings: EndingMark[] = [];
  collapsedUtterances = 0;
  utterances = 0;
  speakingRmsSum = 0;
  speakingRmsCount = 0;
  noiseRms = 0.005;
  noiseReady = false;
  clipFrames = 0;
  audioFrames = 0;
  peakTimes: number[] = [];
  samples: LevelSample[] = [];
  eyeLooked = 0;
  eyeTotal = 0;
  eyeFace = 0;
  eyeModel: EyeModelState = "idle";
  recentEye: boolean[] = [];
  taskHits = 0;
  taskShown = 0;
  reps = 0;
  voicedPrompts = 0;
  promptsShown = 0;
  simileHits = 0;
  lastRepAt = -10_000;
  answeredPrompts = new Set<number>();
  currentVolume = 0;
  lastPitch: number | null = null;

  private inSpeech = false;
  private pauseStarted: number | null = null;
  private utterance: PitchSample[] = [];
  private lastRms = 0;
  private prevRms = 0;
  private lastPeakAt = -10_000;
  private lastSampleAt = 0;
  private lastFrameAt = 0;

  start(now: number, speechSupported: boolean): void {
    this.t0 = now;
    this.running = true;
    this.speechSupported = speechSupported;
    this.lastFrameAt = now;
  }

  elapsed(now: number): number {
    if (!this.running && this.t0 === 0) return 0;
    return Math.max(0, now - this.t0);
  }

  addFinal(chunk: string, now: number): string[] {
    const clean = chunk.trim();
    if (!clean) return [];
    if (this.transcript.endsWith(clean)) return [];
    this.speechRan = true;
    const hits = findFillers(clean);
    const at = this.elapsed(now);
    for (const word of hits) this.fillers.push({ word, atMs: at });
    this.transcript = `${this.transcript} ${clean}`.trim();
    return hits;
  }

  setInterim(text: string): void {
    this.interim = text.trim();
    if (this.interim) this.speechRan = true;
  }

  markSpeechError(message: string): void {
    this.speechError = message;
  }

  tapFiller(): void {
    this.manualFillers += 1;
  }

  notePromptShown(): void {
    this.promptsShown += 1;
    this.taskShown += 1;
  }

  noteVoiced(promptIndex: number): void {
    if (this.answeredPrompts.has(promptIndex)) return;
    this.answeredPrompts.add(promptIndex);
    this.voicedPrompts += 1;
  }

  noteHit(): void {
    this.taskHits += 1;
  }

  noteSimile(): void {
    this.simileHits += 1;
  }

  noteRep(now: number): boolean {
    if (now - this.lastRepAt < 1800) return false;
    this.lastRepAt = now;
    this.reps += 1;
    return true;
  }

  onAudio(now: number, rms: number, pitch: number | null, clipped: boolean): void {
    if (!this.running) return;
    const dt = this.lastFrameAt === 0 ? 16 : Math.min(200, Math.max(0, now - this.lastFrameAt));
    this.lastFrameAt = now;
    this.audioFrames += 1;
    if (clipped) this.clipFrames += 1;
    this.currentVolume = this.currentVolume * 0.65 + Math.min(1, rms / 0.12) * 0.35;
    if (pitch != null) this.lastPitch = pitch;

    const gate = Math.max(0.012, this.noiseRms * 3.2);
    const speech = rms > gate;
    if (!speech && rms < 0.04) {
      this.noiseRms = this.noiseReady ? this.noiseRms * 0.96 + rms * 0.04 : rms;
      this.noiseReady = true;
    }

    if (speech) {
      this.speakingMs += dt;
      this.speakingRmsSum += rms;
      this.speakingRmsCount += 1;
      if (this.inSpeech && this.pauseStarted != null) this.pauseStarted = null;
      if (!this.inSpeech) {
        if (this.pauseStarted != null) {
          const duration = now - this.pauseStarted;
          if (duration >= 400) {
            this.pauses.push({ durationMs: duration, kind: duration > 1000 ? "stall" : "controlled" });
          }
        }
        this.inSpeech = true;
        this.pauseStarted = null;
      }
      this.utterance.push({ t: now, rms, pitch });
      if (this.utterance.length > 400) this.utterance.shift();
      if (this.prevRms > this.lastRms && this.prevRms > rms && this.prevRms > gate * 1.3 && now - this.lastPeakAt > 140) {
        this.peakTimes.push(this.elapsed(now));
        this.lastPeakAt = now;
      }
    } else {
      this.silenceMs += dt;
      if (this.inSpeech) {
        if (this.pauseStarted == null) this.pauseStarted = now;
        if (now - this.pauseStarted > SPEECH_HOLD_MS) {
          this.inSpeech = false;
          this.closeUtterance();
        }
      }
    }

    this.prevRms = this.lastRms;
    this.lastRms = rms;
    if (now - this.lastSampleAt > 80) {
      this.samples.push({ t: this.elapsed(now), rms, speech });
      if (this.samples.length > 4000) this.samples.shift();
      this.lastSampleAt = now;
    }
  }

  onEye(model: EyeModelState, face: boolean, looking: boolean | null): void {
    this.eyeModel = model;
    if (model !== "ready" || looking == null) return;
    this.eyeTotal += 1;
    if (face) this.eyeFace += 1;
    if (looking) this.eyeLooked += 1;
    this.recentEye.push(looking);
    if (this.recentEye.length > 30) this.recentEye.shift();
  }

  recentEyePct(): number | null {
    if (this.recentEye.length < 4) return null;
    const hits = this.recentEye.filter(Boolean).length;
    return Math.round((hits / this.recentEye.length) * 100);
  }

  sessionEyePct(): number | null {
    if (this.eyeModel !== "ready" || this.eyeTotal < 1) return null;
    return Math.round((this.eyeLooked / this.eyeTotal) * 100);
  }

  pendingFillers(): string[] {
    return findFillers(this.interim);
  }

  freeze(now: number): Take {
    if (this.inSpeech) this.closeUtterance();
    else if (this.pauseStarted != null) {
      const duration = now - this.pauseStarted;
      if (duration >= 400) this.pauses.push({ durationMs: duration, kind: duration > 1000 ? "stall" : "controlled" });
      this.pauseStarted = null;
    }
    this.running = false;
    const durationMs = this.elapsed(now);
    const passes = passChecks(this.samples, this.peakTimes, durationMs);
    return {
      durationMs,
      transcript: this.transcript.trim(),
      speechSupported: this.speechSupported,
      speechRan: this.speechRan,
      speechError: this.speechError,
      fillers: this.fillers.filter((hit) => hit.word !== "tap"),
      manualFillers: this.manualFillers,
      words: wordCount(this.transcript),
      restarts: countRestarts(this.transcript),
      speakingMs: this.speakingMs,
      silenceMs: this.silenceMs,
      pauses: this.pauses.slice(),
      endings: this.endings.slice(),
      collapsedUtterances: this.collapsedUtterances,
      utterances: this.utterances,
      speakingRms: this.speakingRmsCount > 0 ? this.speakingRmsSum / this.speakingRmsCount : null,
      noiseRms: this.noiseReady ? this.noiseRms : null,
      clipRatio: this.audioFrames > 0 ? this.clipFrames / this.audioFrames : 0,
      audioFrames: this.audioFrames,
      syllablePeaks: this.peakTimes.length,
      peakTimes: this.peakTimes.slice(),
      samples: this.samples.slice(),
      eyeLooked: this.eyeLooked,
      eyeTotal: this.eyeTotal,
      eyeFace: this.eyeFace,
      eyeModel: this.eyeModel,
      taskHits: this.taskHits,
      taskShown: this.taskShown,
      reps: this.reps,
      voicedPrompts: this.voicedPrompts,
      promptsShown: this.promptsShown,
      simileHits: this.simileHits,
      passLoudOk: passes.loud,
      passSlowOk: passes.slow,
    };
  }

  private closeUtterance(): void {
    const utterance = this.utterance;
    this.utterance = [];
    if (utterance.length < 3) return;
    const span = utterance[utterance.length - 1].t - utterance[0].t;
    if (span < 280) return;
    this.utterances += 1;
    const mid = Math.max(1, Math.floor(utterance.length * 0.7));
    const head = mean(utterance.slice(0, mid).map((sample) => sample.rms)) ?? 0;
    const tail = mean(utterance.slice(mid).map((sample) => sample.rms)) ?? 0;
    if (head > 0.012 && tail < head * 0.55) this.collapsedUtterances += 1;
    const trend = endingTrend(utterance);
    if (trend) this.endings.push({ trend });
  }
}

function meanRms(samples: LevelSample[], from: number, to: number, speechOnly: boolean): number | null {
  const slice = samples.filter((sample) => sample.t >= from && sample.t < to && (!speechOnly || sample.speech));
  return mean(slice.map((sample) => sample.rms));
}

function passChecks(samples: LevelSample[], peaks: number[], durationMs: number): { loud: boolean | null; slow: boolean | null } {
  if (durationMs < 20_000 || samples.length < 12) return { loud: null, slow: null };
  const third = durationMs / 3;
  const first = meanRms(samples, 0, third, true);
  const second = meanRms(samples, third, third * 2, true);
  const loud = first != null && second != null && first > 0.008 ? second > first * 1.12 : null;
  const rate = (from: number, to: number) => peaks.filter((peak) => peak >= from && peak < to).length / Math.max(1, (to - from) / 1000);
  const rate1 = rate(0, third);
  const rate3 = rate(third * 2, durationMs);
  const slow = rate1 >= 1.2 ? rate3 < rate1 * 0.85 : null;
  return { loud, slow };
}
