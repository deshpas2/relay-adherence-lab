import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { DoseCell, PatientStatus } from "@/lib/fixtures/clinic";

const PILL: Record<PatientStatus, string> = {
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  red: "bg-danger-soft text-danger",
};

/** On track / Follow-up due / Needs attention. Text carries the meaning, color helps. */
export function StatusPill({ status }: { status: PatientStatus }) {
  const t = useTranslations("Clinic");
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", PILL[status])}>
      {t(`status_${status}`)}
    </span>
  );
}

/** On-time rate color: 85%+ success, 70%+ warning, below that danger. Always shown with the number. */
export function adhColor(x: number) {
  return x >= 0.85 ? "var(--success)" : x >= 0.7 ? "var(--warning)" : "var(--danger)";
}

export function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <span className="mt-1 block h-1.5 w-full max-w-28 overflow-hidden rounded-full border bg-muted">
      <span className="block h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
    </span>
  );
}

export function StatTile({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div className="border-t-2 border-primary/80 bg-card px-4 pt-3 pb-4">
      <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card p-5", className)}>
      <h2 className="mb-3 font-sans text-xs font-bold tracking-wider text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

const CELL: Record<DoseCell["status"], string> = {
  taken: "bg-success",
  late: "bg-warning",
  missed: "bg-danger",
};

/** Last 28 doses, oldest first. A white dot marks a parent-verified dose. */
export function DoseHeatmap({ doses }: { doses: DoseCell[] }) {
  const t = useTranslations("Clinic");
  return (
    <div>
      <ol className="grid max-w-md grid-cols-14 gap-1" aria-label={t("heatmapLabel")}>
        {doses.map((d, i) => (
          <li
            key={i}
            title={`${t(`dose_${d.status}`)}${d.verified ? ` · ${t("verifiedShort")}` : ""}`}
            className={cn("relative aspect-square rounded-[4px]", CELL[d.status])}
          >
            {d.verified && <span className="absolute right-0.5 bottom-0.5 size-1.5 rounded-full bg-card" />}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(["taken", "late", "missed"] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-sm", CELL[s])} /> {t(`dose_${s}`)}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="grid size-2.5 place-items-center rounded-sm bg-muted-foreground">
            <span className="size-1 rounded-full bg-card" />
          </span>
          {t("verifiedShort")}
        </span>
      </div>
    </div>
  );
}
