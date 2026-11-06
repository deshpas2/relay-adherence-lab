import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { DoseCell, PatientStatus } from "@/lib/fixtures/clinic";

const PILL: Record<PatientStatus, string> = {
  green: "bg-[#e2f5e9] text-[#2b8a54]",
  amber: "bg-[#fbf0d6] text-[#8a6210]",
  red: "bg-[#fde8e8] text-[#b0352a]",
};

/** On track / Follow-up due / Needs attention. Text carries the meaning, color helps. */
export function StatusPill({ status }: { status: PatientStatus }) {
  const t = useTranslations("Clinic");
  return (
    <span className={cn("inline-block rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap", PILL[status])}>
      {t(`status_${status}`)}
    </span>
  );
}

/** Green 85%+, amber 70%+, red below. */
export function adhColor(x: number) {
  return x >= 0.85 ? "#1f9d57" : x >= 0.7 ? "#b07d16" : "#c0392b";
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
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="font-heading text-3xl leading-none font-bold tabular-nums" style={{ color }}>
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function Panel({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-sm", className)}>
      <h2 className="mb-3 font-sans text-xs font-bold tracking-wider text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

const CELL: Record<DoseCell["status"], string> = {
  taken: "bg-[#1f9d57]",
  late: "bg-[#b07d16]",
  missed: "bg-[#c0392b]",
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
            {d.verified && <span className="absolute right-0.5 bottom-0.5 size-1.5 rounded-full bg-white" />}
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
          <span className="grid size-2.5 place-items-center rounded-sm bg-[#5f7186]">
            <span className="size-1 rounded-full bg-white" />
          </span>
          {t("verifiedShort")}
        </span>
      </div>
    </div>
  );
}
