export function Cassette({ playing, className = "" }: { playing: boolean; className?: string }) {
  return (
    <span className={`cassette ${className}`} data-playing={playing}>
      <span className="cassette-label" />
      <span className="cassette-window">
        <span className="cassette-reel" />
        <span className="cassette-tape" />
        <span className="cassette-reel" />
      </span>
    </span>
  );
}
