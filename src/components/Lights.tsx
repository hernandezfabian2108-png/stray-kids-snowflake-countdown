const COLORS = ["var(--bulb-red)", "var(--bulb-gold)", "var(--bulb-green)", "var(--bulb-blue)", "var(--bulb-pink)"];
const COUNT = 22;

/** A string of Christmas lights across the top that blinks forever. */
export function Lights() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-16">
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 16">
        <path
          d="M0 2 Q 4.5 9 9.09 2 T 18.18 2 T 27.27 2 T 36.36 2 T 45.45 2 T 54.54 2 T 63.63 2 T 72.72 2 T 81.81 2 T 90.9 2 T 100 2"
          className="lights-wire"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute inset-x-0 top-0 flex justify-between px-[1.5%]">
        {Array.from({ length: COUNT }, (_, i) => (
          <span
            key={i}
            className={`bulb ${i % 2 === 1 ? "mt-[20px]" : "mt-[6px]"}`}
            style={
              {
                "--c": COLORS[i % COLORS.length],
                animationDuration: `${0.7 + ((i * 37) % 10) / 10}s`,
                animationDelay: `${((i * 53) % 13) / 10}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}
