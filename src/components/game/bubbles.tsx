"use client";

import type { CSSProperties } from "react";
import { create } from "zustand";

type Item = {
  id: number;
  kind: "heart" | "smile";
  style: CSSProperties;
  fill: string;
};

type Burst = { id: number; items: Item[] };

type BubbleState = {
  bursts: Burst[];
  /** Hearts and smiley faces rise from the bottom of the screen. */
  bubbleUp: (big?: boolean) => void;
};

const FILLS = ["var(--bubble-1)", "var(--bubble-2)", "var(--bubble-3)"];
let nextId = 1;

export const useBubbles = create<BubbleState>((set) => ({
  bursts: [],
  bubbleUp: (big = false) => {
    const count = big ? 34 : 14;
    const id = nextId++;
    const items: Item[] = Array.from({ length: count }, (_, i) => {
      const r = () => Math.random();
      // Small bursts rise from the middle of the screen; big ones from all across it.
      const x = big ? 4 + r() * 92 : 30 + r() * 40;
      return {
        id: i,
        kind: i % 2 === 0 ? "heart" : "smile",
        fill: FILLS[Math.floor(r() * FILLS.length)],
        style: {
          left: `${x}%`,
          width: 26 + r() * (big ? 26 : 18),
          ["--drift" as string]: `${(r() - 0.5) * 160}px`,
          ["--rise" as string]: `${(big ? 70 : 45) + r() * (big ? 30 : 25)}vh`,
          ["--scale" as string]: `${0.9 + r() * 0.5}`,
          ["--tilt" as string]: `${(r() - 0.5) * 50}deg`,
          ["--dur" as string]: `${1.8 + r() * 1.4}s`,
          ["--delay" as string]: `${r() * (big ? 0.8 : 0.35)}s`,
        },
      };
    });
    set((s) => ({ bursts: [...s.bursts, { id, items }] }));
    setTimeout(() => set((s) => ({ bursts: s.bursts.filter((b) => b.id !== id) })), 4000);
  },
}));

/** Fire a celebration from anywhere (e.g. after XP is earned). */
export function bubbleUp(big = false) {
  useBubbles.getState().bubbleUp(big);
}

function Heart({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 32 30" className="block w-full">
      <path
        d="M16 28.5C7 22.2 1.5 16.9 1.5 10.4 1.5 5.4 5.3 1.5 10 1.5c2.6 0 4.8 1.2 6 3.2 1.2-2 3.4-3.2 6-3.2 4.7 0 8.5 3.9 8.5 8.9 0 6.5-5.5 11.8-14.5 18.1Z"
        fill={fill}
        stroke="var(--bubble-face)"
        strokeOpacity="0.25"
      />
    </svg>
  );
}

function Smile({ fill }: { fill: string }) {
  // Navy fill gets light features; light fills get navy features.
  const face = fill === "var(--bubble-3)" ? "var(--mist)" : "var(--bubble-face)";
  return (
    <svg viewBox="0 0 32 32" className="block w-full">
      <circle cx="16" cy="16" r="14.5" fill={fill} stroke="var(--bubble-face)" strokeOpacity="0.25" />
      <circle cx="11" cy="13" r="2" fill={face} />
      <circle cx="21" cy="13" r="2" fill={face} />
      <path d="M9.5 19c1.6 2.8 4 4.2 6.5 4.2s4.9-1.4 6.5-4.2" fill="none" stroke={face} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Bubble-up layer. Put once near the top of the app. Decorative only
 * (the XP toast already announces the reward), and hidden when the viewer
 * asked for less motion.
 */
export function Bubbles() {
  const bursts = useBubbles((s) => s.bursts);
  if (bursts.length === 0) return null;
  return (
    <div aria-hidden className="bubbles pointer-events-none fixed inset-0 z-[65] overflow-hidden">
      {bursts.map((b) =>
        b.items.map((it) => (
          <span key={`${b.id}-${it.id}`} className="bubble absolute -bottom-12 block" style={it.style}>
            {it.kind === "heart" ? <Heart fill={it.fill} /> : <Smile fill={it.fill} />}
          </span>
        )),
      )}
    </div>
  );
}
