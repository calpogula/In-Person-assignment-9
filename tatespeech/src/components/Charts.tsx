interface Point {
  x: string;
  y: number;
}

interface Props {
  title: string;
  points: Point[];
  min: number;
  max: number;
  color?: string;
  decimals?: number;
}

export function LineChart({ title, points, min, max, color = "#d6b15e", decimals = 0 }: Props) {
  const width = 320;
  const height = 120;
  const pad = 8;
  const span = Math.max(0.001, max - min);
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : pad + (index * (width - pad * 2)) / (points.length - 1);
    const y = height - pad - ((point.y - min) / span) * (height - pad * 2);
    return { x, y, point };
  });
  const path = coords.map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`).join(" ");
  return (
    <article className="chart-card">
      <h3>{title}</h3>
      {points.length === 0 ? (
        <p className="footnote">No scored takes yet.</p>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <path d={path} fill="none" stroke={color} strokeWidth="2" />
          {coords.map((coord) => (
            <circle key={`${coord.point.x}-${coord.point.y}`} cx={coord.x} cy={coord.y} r="3.5" fill={color}>
              <title>{`${coord.point.x}: ${coord.point.y.toFixed(decimals)}`}</title>
            </circle>
          ))}
        </svg>
      )}
    </article>
  );
}
