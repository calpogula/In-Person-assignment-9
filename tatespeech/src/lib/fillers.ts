import { tokenize } from "./text";

const PHRASES: string[][] = [
  ["to", "be", "honest"],
  ["you", "know"],
  ["kind", "of"],
  ["sort", "of"],
  ["i", "think"],
  ["i", "guess"],
];

const SINGLES = new Set([
  "um",
  "uh",
  "like",
  "basically",
  "actually",
  "literally",
  "maybe",
  "probably",
  "just",
  "honestly",
  "very",
]);

export const HEDGES = new Set([
  "i think",
  "maybe",
  "probably",
  "kind of",
  "sort of",
  "i guess",
  "just",
  "very",
]);

export function findFillers(text: string): string[] {
  const tokens = tokenize(text);
  const used = new Set<number>();
  const found: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    if (used.has(i)) continue;
    let matched = false;
    for (const phrase of PHRASES) {
      if (phrase.every((word, offset) => tokens[i + offset] === word)) {
        for (let offset = 0; offset < phrase.length; offset += 1) used.add(i + offset);
        found.push(phrase.join(" "));
        matched = true;
        break;
      }
    }
    if (matched) continue;
    if (SINGLES.has(tokens[i])) {
      used.add(i);
      found.push(tokens[i]);
    }
  }

  return found;
}

export function countHedges(text: string): number {
  return findFillers(text).filter((word) => HEDGES.has(word)).length;
}

export function containsWord(text: string, word: string): boolean {
  const target = tokenize(word);
  if (target.length === 0) return false;
  const tokens = tokenize(text);
  for (let i = 0; i <= tokens.length - target.length; i += 1) {
    if (target.every((part, offset) => tokens[i + offset] === part)) return true;
  }
  return false;
}

export function lineOverlap(spoken: string, line: string): boolean {
  const target = tokenize(line).filter((word) => word.length > 2);
  if (target.length === 0) return false;
  const said = new Set(tokenize(spoken));
  const hits = target.filter((word) => said.has(word)).length;
  return hits / target.length >= 0.7;
}
