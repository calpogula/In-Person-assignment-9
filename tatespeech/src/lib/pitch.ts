import { median } from "./text";

export function rmsOf(buf: Float32Array): { rms: number; clipped: boolean } {
  let sum = 0;
  let clipped = false;
  for (let i = 0; i < buf.length; i += 1) {
    const sample = buf[i];
    sum += sample * sample;
    if (sample > 0.98 || sample < -0.98) clipped = true;
  }
  return { rms: Math.sqrt(sum / Math.max(1, buf.length)), clipped };
}

export function detectPitch(buf: Float32Array, sampleRate: number): number | null {
  if (buf.length < 64 || sampleRate <= 0) return null;
  let energy = 0;
  for (let i = 0; i < buf.length; i += 1) energy += buf[i] * buf[i];
  const rms = Math.sqrt(energy / buf.length);
  if (rms < 0.015) return null;

  const minLag = Math.max(2, Math.floor(sampleRate / 420));
  const maxLag = Math.min(buf.length - 2, Math.floor(sampleRate / 70));
  if (maxLag <= minLag) return null;

  let best = -Infinity;
  const corr = new Float64Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    const limit = buf.length - lag;
    for (let i = 0; i < limit; i += 1) sum += buf[i] * buf[i + lag];
    corr[lag] = sum;
    if (sum > best) best = sum;
  }
  let bestLag = -1;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    if (corr[lag] >= best * 0.9) {
      bestLag = lag;
      break;
    }
  }
  if (bestLag < 0 || best <= 0) return null;

  let dot = 0;
  let left = 0;
  let right = 0;
  const limit = buf.length - bestLag;
  for (let i = 0; i < limit; i += 1) {
    dot += buf[i] * buf[i + bestLag];
    left += buf[i] * buf[i];
    right += buf[i + bestLag] * buf[i + bestLag];
  }
  const norm = dot / Math.sqrt(left * right || 1);
  if (norm < 0.42) return null;
  return sampleRate / bestLag;
}

export function endingTrend(
  samples: { t: number; pitch: number | null }[],
): "fall" | "rise" | "flat" | null {
  const pitched = samples.filter(
    (sample): sample is { t: number; pitch: number } =>
      sample.pitch != null && sample.pitch >= 70 && sample.pitch <= 420,
  );
  if (pitched.length < 5) return null;
  const start = pitched[0].t;
  const end = pitched[pitched.length - 1].t;
  const span = end - start;
  if (span < 320) return null;
  const mid = pitched.filter((sample) => sample.t >= start + span * 0.2 && sample.t <= start + span * 0.65);
  const tail = pitched.filter((sample) => sample.t >= end - Math.min(300, span * 0.35));
  if (mid.length < 2 || tail.length < 2) return null;
  const midHz = median(mid.map((sample) => sample.pitch));
  const endHz = median(tail.map((sample) => sample.pitch));
  if (midHz == null || endHz == null || midHz < 70) return null;
  const delta = (endHz - midHz) / midHz;
  if (delta <= -0.055) return "fall";
  if (delta >= 0.055) return "rise";
  return "flat";
}

export function dbFromRms(rms: number): number {
  return 20 * Math.log10(Math.max(rms, 1e-8));
}
