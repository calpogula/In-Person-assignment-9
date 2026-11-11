import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DrillRunner } from "../components/DrillRunner";
import { drillById } from "../data/drills";

export function SingleDrillPage() {
  const { id } = useParams();
  const [run, setRun] = useState(0);
  const drill = id ? drillById(id) : undefined;
  if (!drill) {
    return (
      <div>
        <h1>No such drill.</h1>
        <Link className="btn" to="/library">Library</Link>
      </div>
    );
  }
  return <DrillRunner key={`${drill.id}-${run}`} drill={drill} mode="single" onRestart={() => setRun((value) => value + 1)} />;
}
