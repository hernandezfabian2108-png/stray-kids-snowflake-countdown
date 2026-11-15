import { memo, useMemo } from "react";

/** Draws a pixel-art sprite (rows of palette letters, "." = empty) as a crisp SVG. */
export const PixelSprite = memo(function PixelSprite({
  rows,
  palette,
  className,
  style,
  onAnimationEnd,
}: {
  rows: string[];
  palette: Record<string, string>;
  className?: string;
  style?: React.CSSProperties;
  onAnimationEnd?: () => void;
}) {
  const width = rows[0]?.length ?? 0;
  const rects = useMemo(() => {
    const out: { x: number; y: number; w: number; fill: string }[] = [];
    rows.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const c = row[x]!;
        if (c === ".") {
          x++;
          continue;
        }
        let end = x + 1;
        while (end < row.length && row[end] === c) end++;
        out.push({ x, y, w: end - x, fill: palette[c] ?? "transparent" });
        x = end;
      }
    });
    return out;
  }, [rows, palette]);

  return (
    <svg
      viewBox={`0 0 ${width} ${rows.length}`}
      className={className}
      style={style}
      onAnimationEnd={onAnimationEnd}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
});
