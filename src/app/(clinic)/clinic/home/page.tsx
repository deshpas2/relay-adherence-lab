import Link from "next/link";
import { ChevronRight, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { adhColor, MiniBar, StatTile, StatusPill } from "@/components/clinic/bits";
import { samplePatients } from "@/lib/fixtures/clinic";
import { reengagementPlan } from "@/lib/engine/reengage";

// TODO(backend): enrolled patients from care_links + v_attention_list.
export default async function PatientsPage() {
  const t = await getTranslations("Clinic");
  const tR = await getTranslations("Reengage");
  const plans = new Map(samplePatients.map((p) => [p.id, reengagementPlan(p.lastCheckinDays, p.reengageDone)]));
  const callNeeded = samplePatients.filter((p) => plans.get(p.id)?.callNeeded);
  const ps = samplePatients;
  const mean = ps.reduce((s, p) => s + p.onTime, 0) / ps.length;
  const attention = ps.filter((p) => p.status !== "green").length;
  const running = ps.flatMap((p) => p.experiments).filter((e) => e.status === "active").length;
  // Needs attention first, then lowest on-time rate.
  const order = { red: 0, amber: 1, green: 2 } as const;
  const rows = [...ps].sort((a, b) => order[a.status] - order[b.status] || a.onTime - b.onTime);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">{t("patientsTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("patientsSub")}</p>
        </div>
        <span className="rounded-md border px-2 py-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          {t("simulated")}
        </span>
      </header>

      {callNeeded.map((p) => (
        <section
          key={p.id}
          role="alert"
          className="flex flex-wrap items-center gap-4 rounded-xl border-2 border-[#e8a8a2] bg-[#fde8e8] p-4 text-[#7a1f17]"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#c0392b] text-white">
            <Phone aria-hidden className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{tR("alertTitle", { name: p.name, n: p.lastCheckinDays })}</p>
            <p className="text-sm">{tR("alertBody")}</p>
          </div>
          <Link
            href={`/clinic/home/${p.id}`}
            className="rounded-lg bg-[#c0392b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#a83226]"
          >
            {tR("alertCta", { name: p.name.split(" ")[0] })}
          </Link>
        </section>
      ))}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile value={String(ps.length)} label={t("statPatients")} />
        <StatTile value={`${Math.round(mean * 100)}%`} label={t("statMeanOnTime")} color={adhColor(mean)} />
        <StatTile value={String(attention)} label={t("statAttention")} color="#c0392b" />
        <StatTile value={String(running)} label={t("statRunning")} />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            <tr>
              <th className="px-5 py-3">{t("colPatient")}</th>
              <th className="px-3 py-3">{t("colBarrier")}</th>
              <th className="px-3 py-3">{t("colOnTime")}</th>
              <th className="px-3 py-3">{t("colVerified")}</th>
              <th className="px-3 py-3">{t("colCheckin")}</th>
              <th className="px-3 py-3">{t("colStatus")}</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="relative border-b last:border-b-0 hover:bg-muted">
                <td className="px-5 py-3.5">
                  <Link href={`/clinic/home/${p.id}`} className="font-bold after:absolute after:inset-0">
                    {p.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{t("age", { age: p.age })}</p>
                  {plans.get(p.id)?.active && (
                    <span className="mt-1 inline-block rounded-md bg-[#fbf0d6] px-2 py-0.5 text-[11px] font-bold text-[#8a6210]">
                      {tR("quietTag", { n: p.lastCheckinDays })}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3.5">{t(`barrier_${p.primary}`)}</td>
                <td className="px-3 py-3.5 tabular-nums">
                  <span className="font-bold" style={{ color: adhColor(p.onTime) }}>
                    {Math.round(p.onTime * 100)}%
                  </span>
                  <MiniBar value={p.onTime} color={adhColor(p.onTime)} />
                </td>
                <td className="px-3 py-3.5 font-semibold tabular-nums">{Math.round(p.verified * 100)}%</td>
                <td className="px-3 py-3.5 text-muted-foreground">{t("daysAgo", { n: p.lastCheckinDays })}</td>
                <td className="px-3 py-3.5">
                  <StatusPill status={p.status} />
                </td>
                <td className="pr-4 text-muted-foreground">
                  <ChevronRight aria-hidden className="size-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
