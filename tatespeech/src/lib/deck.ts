export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class PromptDeck<T> {
  private pool: T[] = [];
  private shown = new Set<string>();
  private current: T | null = null;

  constructor(
    private readonly bank: readonly T[],
    private readonly keyOf: (item: T) => string,
    private readonly rng: () => number = Math.random,
  ) {
    if (bank.length === 0) throw new Error("Prompt bank is empty");
    this.pool = shuffle(bank, rng);
    this.draw();
  }

  now(): T {
    if (this.current == null) this.draw();
    return this.current as T;
  }

  next(): T {
    if (this.current != null) this.shown.add(this.keyOf(this.current));
    if (this.pool.length === 0) this.recycle();
    this.draw();
    return this.now();
  }

  refresh(): T {
    if (this.current != null) this.shown.add(this.keyOf(this.current));
    const unseen = this.bank.filter((item) => !this.shown.has(this.keyOf(item)));
    if (unseen.length === 0) this.recycle();
    else this.pool = shuffle(unseen, this.rng);
    this.draw();
    return this.now();
  }

  private draw(): void {
    const next = this.pool.shift();
    if (next) {
      this.current = next;
      return;
    }
    this.recycle();
    this.current = this.pool.shift() ?? this.bank[0];
  }

  private recycle(): void {
    const last = this.current == null ? null : this.keyOf(this.current);
    this.shown.clear();
    const nextPool = shuffle(this.bank, this.rng);
    if (last && nextPool.length > 1 && this.keyOf(nextPool[0]) === last) {
      const moved = nextPool.shift();
      if (moved) nextPool.push(moved);
    }
    this.pool = nextPool;
  }
}
