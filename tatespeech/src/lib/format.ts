export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDrillLength(seconds: number): string {
  if (seconds % 60 === 0) return `${seconds / 60} min`;
  return `${(seconds / 60).toFixed(1)} min`;
}

export function formatSeconds(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatRate(rate: number | null): string {
  if (rate == null) return "—";
  return `${rate.toFixed(1)} / min`;
}

export function formatScore(score: number | null): string {
  if (score == null) return "—";
  return String(Math.round(score));
}
