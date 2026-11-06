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
        "inline-flex size-16 flex-col items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md",
        className,
      )}
    >
      <span className="text-[0.65rem] font-semibold uppercase tracking-wider opacity-90">
        {label}
      </span>
      <span className="font-heading text-2xl leading-none font-bold">
        {level}
      </span>
    </div>
  );
}
