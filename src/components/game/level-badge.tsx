import { cn } from "@/lib/utils";

type LevelBadgeProps = {
  level: number;
  /** Translated word for "Level", e.g. "Level" or "Nivel". */
  label: string;
  className?: string;
};

export function LevelBadge({ level, label, className }: LevelBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex size-16 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <span className="text-[0.65rem] font-semibold uppercase tracking-wider opacity-90">
        {label}
      </span>
      <span className="text-2xl leading-none font-bold">
        {level}
      </span>
    </div>
  );
}
