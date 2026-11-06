import type { CSSProperties } from "react";

const COLORS = ["#34c56a", "#4a9eff", "#e6a23c", "#f472b6", "#a78bfa", "#facc15"];
const COUNT = 80;

/** Repeatable "random" numbers, so server and browser draw the same pieces. */
function rand(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const PIECES: CSSProperties[] = Array.from({ length: COUNT }, (_, i) => ({
  left: `${rand(i, 1) * 100}%`,
  background: COLORS[i % COLORS.length],
  width: 6 + rand(i, 2) * 6,
  height: 10 + rand(i, 3) * 8,
  borderRadius: i % 3 === 0 ? "50%" : 2,
  animationDelay: `${rand(i, 4) * 0.6}s`,
  animationDuration: `${2.2 + rand(i, 5) * 1.6}s`,
  ["--drift" as string]: `${(rand(i, 6) - 0.5) * 240}px`,
  ["--spin" as string]: `${(rand(i, 7) > 0.5 ? 1 : -1) * (360 + rand(i, 8) * 540)}deg`,
}));

/**
 * A one-time confetti burst from the top of the screen. Pieces fade out at the
 * end of their fall. Decorative only, and hidden for anyone who asked for less
 * motion (system setting or Relay's own).
 */
export function Confetti() {
  return (
    <div aria-hidden className="confetti pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {PIECES.map((style, i) => (
        <span key={i} className="confetti-piece absolute -top-5 block opacity-0" style={style} />
      ))}
    </div>
  );
}
