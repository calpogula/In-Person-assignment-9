import { Link } from "react-router-dom";
import { DRILLS } from "../data/drills";
import { formatDrillLength } from "../lib/format";

export function LibraryPage() {
  return (
    <div>
      <p className="kicker">Library</p>
      <h1>One drill.</h1>
      <p className="lede">Run any drill alone. It scores the same signals as the circuit. It does not move the streak.</p>
      <div className="library">
        {DRILLS.map((drill) => (
          <article className="drill-card" key={drill.id}>
            <div className="meta">{formatDrillLength(drill.seconds)}</div>
            <h2>{drill.name}</h2>
            <p>{drill.goal}</p>
            <Link className="btn btn-primary" to={`/drill/${drill.id}`}>Run</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
