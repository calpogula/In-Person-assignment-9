import { useState } from "react";
import { DrillRunner } from "../components/DrillRunner";
import { FREE_DRILL } from "../data/drills";

export function FreePage() {
  const [run, setRun] = useState(0);
  return <DrillRunner key={run} drill={FREE_DRILL} mode="free" onRestart={() => setRun((value) => value + 1)} />;
}
