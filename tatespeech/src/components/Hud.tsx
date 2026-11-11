import { formatClock } from "../lib/format";

export interface HudFiller {
  word: string;
  atMs: number;
  pending?: boolean;
}

interface Props {
  fillers: HudFiller[];
  fillerCount: number;
  manualCount: number;
  showTap: boolean;
  onTap: () => void;
  level: number;
  wpm: string;
  pause: string;
  clean: string;
  eye: string;
  eyeRecent: number | null;
  pitch: string;
  ending: string;
  hedges: string;
  transcript: string;
  interim: string;
}

export function Hud(props: Props) {
  const level = Math.max(0, Math.min(100, Math.round(props.level * 100)));
  return (
    <section className="hud slot-hud" aria-label="Live signals">
      <div className="hud-grid">
        <div className="hud-cell">
          <div className="hud-label">Fillers</div>
          <div className="hud-value num" aria-live="polite">{props.fillerCount}</div>
        </div>
        <div className="hud-cell">
          <div className="hud-label">Words / min</div>
          <div className="hud-value num">{props.wpm}</div>
        </div>
        <div className="hud-cell">
          <div className="hud-label">Level</div>
          <div className="meter">
            <div className="meter-track"><div className="meter-fill" style={{ width: `${level}%` }} /></div>
          </div>
        </div>
        <div className="hud-cell">
          <div className="hud-label">Eye contact</div>
          <div className="hud-value num">{props.eyeRecent == null ? "—" : `${props.eyeRecent}`}</div>
          <div className="meter-track" aria-hidden="true">
            <div className="meter-fill" style={{ width: `${props.eyeRecent ?? 0}%` }} />
          </div>
        </div>
        <div className="hud-cell">
          <div className="hud-label">Pitch</div>
          <div className="hud-value num">{props.pitch}</div>
        </div>
        <div className="hud-cell">
          <div className="hud-label">Last ending</div>
          <div className="hud-value num">{props.ending}</div>
        </div>
        <div className="hud-cell">
          <div className="hud-label">Avg pause</div>
          <div className="hud-value num">{props.pause}</div>
        </div>
        <div className="hud-cell">
          <div className="hud-label">Clean stretch</div>
          <div className="hud-value num">{props.clean}</div>
        </div>
      </div>
      <p className="footnote" style={{ margin: 0 }}>{props.eye} · Hedges {props.hedges}</p>
      <div>
        <div className="hud-label">Filler list</div>
        <div className="filler-list">
          {props.fillers.length === 0 && <span className="footnote">None yet.</span>}
          {props.fillers.map((filler, index) => (
            <div className={filler.pending ? "filler-item hearing" : "filler-item"} key={`${filler.word}-${filler.atMs}-${index}`}>
              <span>{filler.word}</span>
              <span>{filler.pending ? "hearing" : formatClock(filler.atMs)}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="hud-label">Transcript</div>
        <div className="transcript" aria-live="polite">
          {props.transcript || props.interim ? `${props.transcript} ${props.interim}`.trim() : "No transcript until this browser recognizes speech."}
        </div>
      </div>
      {props.showTap && (
        <button type="button" className="btn btn-gold" onClick={props.onTap}>
          Filler hit ({props.manualCount})
        </button>
      )}
    </section>
  );
}
