export interface GazeInput {
  yaw: number | null;
  pitch: number | null;
  irisH: number | null;
  irisV: number | null;
  lookAway: number | null;
}

export function poseFromMatrix(matrix: ArrayLike<number>): { yaw: number; pitch: number } | null {
  if (matrix.length < 11) return null;
  const r20 = matrix[2];
  const r21 = matrix[6];
  const r22 = matrix[10];
  const pitch = (Math.asin(Math.max(-1, Math.min(1, r21))) * 180) / Math.PI;
  const yaw = (Math.atan2(-r20, r22) * 180) / Math.PI;
  if (!Number.isFinite(yaw) || !Number.isFinite(pitch)) return null;
  return { yaw, pitch };
}

export function irisPlacement(
  landmarks: { x: number; y: number }[],
  cornerA: number,
  cornerB: number,
  top: number,
  bottom: number,
  iris: number,
): { h: number; v: number } | null {
  const a = landmarks[cornerA];
  const b = landmarks[cornerB];
  const t = landmarks[top];
  const bot = landmarks[bottom];
  const c = landmarks[iris];
  if (!a || !b || !t || !bot || !c) return null;
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(t.y, bot.y);
  const maxY = Math.max(t.y, bot.y);
  const width = maxX - minX;
  const height = maxY - minY;
  if (width < 0.004 || height < 0.002) return null;
  return { h: (c.x - minX) / width, v: (c.y - minY) / height };
}

export function averageIris(
  landmarks: { x: number; y: number }[],
): { h: number; v: number } | null {
  if (landmarks.length < 478) return null;
  const left = irisPlacement(landmarks, 33, 133, 159, 145, 468);
  const right = irisPlacement(landmarks, 263, 362, 386, 374, 473);
  const eyes = [left, right].filter((eye): eye is { h: number; v: number } => eye != null);
  if (eyes.length === 0) return null;
  return {
    h: eyes.reduce((sum, eye) => sum + eye.h, 0) / eyes.length,
    v: eyes.reduce((sum, eye) => sum + eye.v, 0) / eyes.length,
  };
}

export function isLookingAtCamera(input: GazeInput): boolean | null {
  if (input.lookAway != null && input.lookAway > 0.55) return false;
  const poseKnown = input.yaw != null && input.pitch != null;
  const irisKnown = input.irisH != null && input.irisV != null;
  if (!poseKnown && !irisKnown && input.lookAway == null) return null;
  const poseOk = poseKnown
    ? Math.abs(input.yaw as number) <= 18 && Math.abs(input.pitch as number) <= 15
    : true;
  const irisOk = irisKnown
    ? Math.abs((input.irisH as number) - 0.5) <= 0.18 && Math.abs((input.irisV as number) - 0.5) <= 0.22
    : true;
  if (!poseKnown && !irisKnown) return input.lookAway != null ? input.lookAway <= 0.35 : null;
  return poseOk && irisOk;
}

export function lookAwayScore(
  categories: { categoryName: string; score: number }[] | undefined,
): number | null {
  if (!categories || categories.length === 0) return null;
  const names = [
    "eyeLookInLeft",
    "eyeLookOutLeft",
    "eyeLookUpLeft",
    "eyeLookDownLeft",
    "eyeLookInRight",
    "eyeLookOutRight",
    "eyeLookUpRight",
    "eyeLookDownRight",
  ];
  const scores = names
    .map((name) => categories.find((category) => category.categoryName === name)?.score)
    .filter((score): score is number => score != null);
  if (scores.length === 0) return null;
  return Math.max(...scores);
}
