import { formatClock } from "../lib/format";

interface Props {
  setNode: (node: HTMLVideoElement | null) => void;
  live: boolean;
  blocked: string | null;
  elapsedMs: number;
  remainingMs: number | null;
  recording: boolean;
}

export function CameraStage({ setNode, live, blocked, elapsedMs, remainingMs, recording }: Props) {
  const shown = remainingMs == null ? elapsedMs : remainingMs;
  return (
    <div className="camera slot-cam">
      <video ref={setNode} autoPlay playsInline muted />
      {!live && <div className="camera-off">{blocked ?? "Camera starts when you record."}</div>}
      <div className="timer-overlay">
        <strong className="num">{formatClock(shown)}</strong>
        <span className={recording ? "live-pill" : "ready-pill"}>{recording ? "LIVE" : "READY"}</span>
      </div>
    </div>
  );
}
