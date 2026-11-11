export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

export function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function wordCount(text: string): number {
  return tokenize(text).length;
}

export function splitSentences(text: string): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (!/[.!?]/.test(clean)) return [clean];
  return clean
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function countRestarts(text: string): number {
  const words = tokenize(text);
  let restarts = 0;
  for (let i = 1; i < words.length; i += 1) {
    if (words[i].length > 1 && words[i] === words[i - 1]) restarts += 1;
  }
  return restarts;
}

export function roundTo(n: number, places = 0): number {
  const factor = 10 ** places;
  return Math.round(n * factor) / factor;
}
