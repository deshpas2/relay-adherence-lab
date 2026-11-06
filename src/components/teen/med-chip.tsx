import { cn } from "@/lib/utils";
import type { MedSummary } from "./types";

/** A small colored pill shape plus the medicine's catalog name. */
export function MedChip({ med, className }: { med: MedSummary; className?: string }) {
  const round = med.form === "tablet" || med.form === "pill";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-muted py-1 pr-3 pl-1.5 text-sm font-medium",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("block h-4 border border-black/10", round ? "w-4 rounded-full" : "w-6 rounded-full")}
        style={{ background: med.color }}
      />
      {med.name}
    </span>
  );
}
