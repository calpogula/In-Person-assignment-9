import { describe, expect, it } from "vitest";
import { PromptDeck } from "./deck";
import { addIsoDays, displayStreak, nextStreak } from "./dates";
import { containsWord, findFillers, lineOverlap } from "./fillers";
import { isLookingAtCamera, poseFromMatrix } from "./gaze";
import { detectPitch, endingTrend } from "./pitch";
import { SessionRecorder } from "./recorder";
import { scoreTake } from "./scoring";
import type { Take } from "../types";

describe("fillers", () => {
  it("counts phrases once and ignores lookalikes", () => {
    const hits = findFillers("Um, I think you know this is very good, and the umbrella is just fine.");
    expect(hits).toEqual(["um", "i think", "you know", "very", "just"]);
    expect(findFillers("likelihood huh thinking")).toEqual([]);
    expect(containsWord("that was unmistakable work", "unmistakable")).toBe(true);
    expect(lineOverlap("I do not fill silence. I use silence.", "I do not fill silence. I use silence.")).toBe(true);
  });
});

describe("prompts", () => {
  it("does not repeat until the bank is exhausted", () => {
    let seed = 3;
    const rng = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const bank = ["a", "b", "c", "d"];
    const deck = new PromptDeck(bank, (item) => item, rng);
    const first: string[] = [deck.now()];
    for (let i = 0; i < 3; i += 1) first.push(deck.next());
    expect(new Set(first).size).toBe(4);
    const refreshed = deck.refresh();
    expect(bank).toContain(refreshed);
  });
});

describe("streak", () => {
  it("holds the same day, increments the next, and resets after a gap", () => {
    expect(nextStreak(0, null, "2026-11-11")).toBe(1);
    expect(nextStreak(3, "2026-11-11", "2026-11-11")).toBe(3);
    expect(nextStreak(3, "2026-11-10", "2026-11-11")).toBe(4);
    expect(nextStreak(3, "2026-11-08", "2026-11-11")).toBe(1);
    expect(displayStreak(4, "2026-11-09", "2026-11-11")).toBe(0);
    expect(displayStreak(4, addIsoDays("2026-11-11", -1), "2026-11-11")).toBe(4);
  });
});

describe("pitch and gaze", () => {
  it("reads a sine and a level head", () => {
    const sampleRate = 16000;
    const buffer = new Float32Array(2048);
    for (let i = 0; i < buffer.length; i += 1) buffer[i] = Math.sin((2 * Math.PI * 180 * i) / sampleRate) * 0.2;
    const hz = detectPitch(buffer, sampleRate);
    expect(hz).not.toBeNull();
    expect(hz as number).toBeGreaterThan(165);
    expect(hz as number).toBeLessThan(195);
    const identity = new Array(16).fill(0);
    identity[0] = 1;
    identity[5] = 1;
    identity[10] = 1;
    identity[15] = 1;
    const pose = poseFromMatrix(identity);
    expect(pose?.yaw).toBeCloseTo(0);
    expect(pose?.pitch).toBeCloseTo(0);
    expect(isLookingAtCamera({ yaw: 0, pitch: 0, irisH: 0.5, irisV: 0.5, lookAway: 0.1 })).toBe(true);
    expect(isLookingAtCamera({ yaw: 40, pitch: 0, irisH: 0.5, irisV: 0.5, lookAway: 0 })).toBe(false);
    const trend = endingTrend([
      { t: 0, pitch: 180 },
      { t: 80, pitch: 178 },
      { t: 160, pitch: 176 },
      { t: 240, pitch: 174 },
      { t: 320, pitch: 150 },
      { t: 400, pitch: 140 },
    ]);
    expect(trend).toBe("fall");
  });
});

describe("recorder", () => {
  it("marks a controlled pause between two voiced stretches", () => {
    const recorder = new SessionRecorder();
    recorder.start(0, true);
    for (let t = 0; t <= 600; t += 50) recorder.onAudio(t, 0.08, 140, false);
    for (let t = 650; t <= 1500; t += 50) recorder.onAudio(t, 0.001, null, false);
    recorder.onAudio(1550, 0.08, 130, false);
    const take = recorder.freeze(1600);
    expect(take.pauses.some((pause) => pause.kind === "controlled" && pause.durationMs >= 400)).toBe(true);
  });
});

function baseTake(patch: Partial<Take> = {}): Take {
  return {
    durationMs: 60_000,
    transcript: "",
    speechSupported: true,
    speechRan: false,
    speechError: null,
    fillers: [],
    manualFillers: 0,
    words: 0,
    restarts: 0,
    speakingMs: 0,
    silenceMs: 0,
    pauses: [],
    endings: [],
    collapsedUtterances: 0,
    utterances: 0,
    speakingRms: null,
    noiseRms: null,
    clipRatio: 0,
    audioFrames: 0,
    syllablePeaks: 0,
    peakTimes: [],
    samples: [],
    eyeLooked: 0,
    eyeTotal: 0,
    eyeFace: 0,
    eyeModel: "idle",
    taskHits: 0,
    taskShown: 0,
    reps: 0,
    voicedPrompts: 0,
    promptsShown: 0,
    simileHits: 0,
    passLoudOk: null,
    passSlowOk: null,
    ...patch,
  };
}

describe("scoring", () => {
  it("does not randomize and leaves a silent take blank", () => {
    const silent = scoreTake("voice-lock", ["projection", "pace", "clarity", "downward", "eye"], baseTake());
    expect(silent.overall).toBeNull();
    expect(silent.deliveryMatch).toBeNull();
    expect(silent.eyePct).toBeNull();
    expect(silent.wpm).toBeNull();
    const again = scoreTake("voice-lock", ["projection", "pace", "clarity", "downward", "eye"], baseTake());
    expect(again).toEqual(silent);
  });

  it("scores a real transcript and punishes fillers", () => {
    const sentence = "The standard is the work. ";
    const transcript = sentence.repeat(24).trim();
    const clean = scoreTake("filler-tax", ["fillers", "pace", "conviction", "style"], baseTake({
      transcript,
      speechRan: true,
      words: transcript.split(/\s+/).length,
      speakingMs: 40_000,
      audioFrames: 80,
      speakingRms: 0.05,
      noiseRms: 0.005,
      endings: [{ trend: "fall" }, { trend: "fall" }, { trend: "fall" }],
      utterances: 4,
      eyeModel: "ready",
      eyeLooked: 90,
      eyeTotal: 100,
      eyeFace: 100,
    }));
    const dirtyText = `${transcript} um um I think maybe this is very late.`;
    const dirty = scoreTake("filler-tax", ["fillers", "pace", "conviction", "style"], baseTake({
      transcript: dirtyText,
      speechRan: true,
      words: dirtyText.split(/\s+/).length,
      fillers: [
        { word: "um", atMs: 1000 },
        { word: "um", atMs: 2000 },
        { word: "i think", atMs: 3000 },
        { word: "maybe", atMs: 4000 },
        { word: "very", atMs: 5000 },
      ],
      speakingMs: 40_000,
      audioFrames: 80,
      speakingRms: 0.05,
      noiseRms: 0.005,
    }));
    expect(clean.fillerCount).toBe(0);
    expect(clean.subscores.find((sub) => sub.key === "fillers")?.score).toBe(10);
    expect(clean.wpm).not.toBeNull();
    expect(clean.wpmEstimated).toBe(false);
    expect(clean.deliveryMatch).not.toBeNull();
    expect(dirty.fillerCount).toBe(5);
    const dirtyFiller = dirty.subscores.find((sub) => sub.key === "fillers")?.score ?? 10;
    expect(dirtyFiller).toBeLessThan(8);
    expect(scoreTake("filler-tax", ["fillers"], baseTake({
      speechSupported: false,
      manualFillers: 0,
      durationMs: 60_000,
    })).subscores).toHaveLength(0);
  });

  it("grades claim discipline without pretending to fact-check", () => {
    const concrete = scoreTake("frame-answer", ["claim"], baseTake({
      transcript: "We cut the budget 12 percent on Tuesday because the standard slipped.",
      speechRan: true,
      words: 12,
    }));
    const vague = scoreTake("frame-answer", ["claim"], baseTake({
      transcript: "Something always somehow happens and everyone kind of knows.",
      speechRan: true,
      words: 9,
    }));
    const concreteScore = concrete.subscores.find((sub) => sub.key === "claim")?.score ?? 0;
    const vagueScore = vague.subscores.find((sub) => sub.key === "claim")?.score ?? 10;
    expect(concreteScore).toBeGreaterThan(vagueScore);
    expect(concrete.subscores.find((sub) => sub.key === "claim")?.detail).toMatch(/not whether it is true/i);
  });
});
