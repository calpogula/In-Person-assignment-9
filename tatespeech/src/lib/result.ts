import type { DrillMode, DrillScore } from "../types";
import { formatIsoDate } from "./dates";
import type { ScoreDraft } from "./scoring";

export function toDrillScore(
  drill: { id: string; name: string },
  mode: DrillMode,
  durationMs: number,
  draft: ScoreDraft,
): DrillScore {
  return {
    id: crypto.randomUUID(),
    drillId: drill.id,
    drillName: drill.name,
    mode,
    at: new Date().toISOString(),
    date: formatIsoDate(new Date()),
    durationMs,
    notes: "",
    sessionId: undefined,
    ...draft,
  };
}
