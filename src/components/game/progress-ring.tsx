import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ProgressRingProps = {
  /** 0 to 1 */
  value: number;
  /** Text read by screen readers, e.g. "Day 7 of 14". */
  label: string;
  size?: number;
  /** Shown in the middle of the ring. */
  children?: ReactNode;
  className?: string;
};

/** A circular progress ring, e.g. for how far along an experiment is. */
export function ProgressRing({
  value,
  label,
  size = 96,
  children,
  className,
}: ProgressRingProps) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-xp-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className="stroke-primary transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
