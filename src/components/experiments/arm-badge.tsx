import { cn } from "@/lib/utils";
import type { Arm } from "./types";

/** "A" or "B" in a circle. The letter carries the meaning, not just the color. */
export function ArmBadge({ arm, className }: { arm: Arm; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-grid size-8 shrink-0 place-items-center rounded-full text-base font-bold",
        arm === "A" ? "bg-secondary text-secondary-foreground" : "bg-xp text-xp-foreground",
        className,
      )}
    >
      {arm}
    </span>
  );
}
