import { cn } from "@/lib/utils";

type XPBarProps = {
  /** XP earned inside the current level. */
  current: number;
  /** XP needed to reach the next level. */
  goal: number;
  /** Text read by screen readers, e.g. "40 of 100 XP to level 4". */
  label: string;
  className?: string;
};

/** Progress to the next level. Only ever fills up; it never shows loss. */
export function XPBar({ current, goal, label, className }: XPBarProps) {
  const pct = goal > 0 ? Math.min(100, Math.max(0, (current / goal) * 100)) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={current}
      className={cn(
        "h-4 w-full overflow-hidden rounded-full bg-xp-track",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-xp transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
