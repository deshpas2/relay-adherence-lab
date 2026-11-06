import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { adhColor, Panel, StatTile, StatusPill } from "@/components/clinic/bits";
import { samplePatients, type ClinicBarrier } from "@/lib/fixtures/clinic";
import { WEATHER_STYLE } from "@/components/forecast/weather";
import { SIGNAL_ORDER, weatherSignal } from "@/lib/engine/forecast";

// TODO(backend): v_clinic_overview (Section 3.5).
export default async function OverviewPage() {
  const t = await getTranslations("Clinic");
  const tF = await getTranslations("Forecast");
  const ps = samplePatients;
  const exps = ps.flatMap((p) => p.experiments);
  const finished = exps.filter((e) => e.status === "done").length;
  const adopted = exps.filter((e) => e.decision === "adopted").length;
  const mean = ps.reduce((s, p) => s + p.onTime, 0) / ps.length;
  const status = [
    { key: "green" as const, color: "#2b8a54" },
    { key: "amber" as const, color: "#b07d16" },
    { key: "red" as const, color: "#c0392b" },
  ].map((s) => ({ ...s, n: ps.filter((p) => p.status === s.key).length }));
  const counts = new Map<ClinicBarrier, number>();
  ps.forEach((p) => p.barriers.forEach((b) => counts.set(b, (counts.get(b) ?? 0) + 1)));
  const barriers = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const maxB = Math.max(...barriers.map(([, n]) => n));
  const attention = ps.filter((p) => p.status !== "green").sort((a, b) => a.onTime - b.onTime);
  const forecast = [...ps].sort(
    (a, b) => SIGNAL_ORDER.indexOf(weatherSignal(a.weather)) - SIGNAL_ORDER.indexOf(weatherSignal(b.weather)),
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl">{t("overviewTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("patientsSub")}</p>
        </div>
        <span className="rounded-md border px-2 py-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          {t("simulated")}
        </span>
      </header>

      <Panel title={tF("title")}>
        <p className="-mt-2 mb-4 text-sm text-muted-foreground">{tF("subtitle")}</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {forecast.map((p) => {
            const w = p.weather ?? "fog";
            const { icon: Icon, color, soft } = WEATHER_STYLE[w];
            return (
              <li key={p.id}>
                <Link
                  href={`/clinic/home/${p.id}`}
                  className="flex h-full flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:border-[#2563ab]"
                  style={{ background: soft }}
                >
                  <Icon aria-hidden className="size-9" style={{ color }} />
                  <span className="text-sm font-bold">{p.name}</span>
                  <span className="text-xs font-semibold" style={{ color }}>
                    {tF(`weather_${w}`)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{tF(`signal_${weatherSignal(p.weather)}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile value={`${Math.round(mean * 100)}%`} label={t("statMeanOnTime")} color={adhColor(mean)} />
        <StatTile value={`${finished}/${exps.length}`} label={t("statFinished")} />
        <StatTile value={String(adopted)} label={t("statAdopted")} color="#1f9d57" />
        <StatTile value={String(attention.length)} label={t("statAttention")} color="#c0392b" />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title={t("statusMixTitle")}>
          <div className="flex h-4 overflow-hidden rounded-full">
            {status.map((s) => (
              <span key={s.key} style={{ width: `${(s.n / ps.length) * 100}%`, background: s.color }} />
            ))}
          </div>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {status.map((s) => (
              <li key={s.key} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="size-3 rounded-sm" style={{ background: s.color }} />
                  {t(`status_${s.key}`)}
                </span>
                <span className="font-bold tabular-nums">{s.n}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={t("barriersTitle")}>
          <ul className="flex flex-col gap-2.5">
            {barriers.map(([b, n]) => (
              <li key={b} className="grid grid-cols-[9rem_1fr_1.5rem] items-center gap-3 text-sm">
                <span className="truncate font-medium">{t(`barrier_${b}`)}</span>
                <span className="h-2.5 overflow-hidden rounded-full border bg-muted">
                  <span className="block h-full bg-[#163a5f]" style={{ width: `${(n / maxB) * 100}%` }} />
                </span>
                <span className="text-right font-bold tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title={t("attentionTitle")}>
        <ul className="-mx-5 -mb-5 divide-y border-t">
          {attention.map((p) => (
            <li key={p.id}>
              <Link href={`/clinic/home/${p.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-muted">
                <span className="flex-1">
                  <span className="block font-bold">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{t(`barrier_${p.primary}`)}</span>
                </span>
                <span className="font-bold tabular-nums" style={{ color: adhColor(p.onTime) }}>
                  {Math.round(p.onTime * 100)}%
                </span>
                <StatusPill status={p.status} />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
