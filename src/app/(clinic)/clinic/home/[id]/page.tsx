import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { adhColor, DoseHeatmap, Panel, StatTile, StatusPill } from "@/components/clinic/bits";
import { ClinicActions } from "@/components/clinic/clinic-actions";
import { ReengagePanel } from "@/components/clinic/reengage-panel";
import { MessagePlanPanel } from "@/components/personal/message-plan-panel";
import { getSampleProfile } from "@/lib/fixtures/personal";
import { ideaLibrary } from "@/lib/fixtures/experiments";
import { WeatherBadge } from "@/components/forecast/weather";
import { weatherSignal } from "@/lib/engine/forecast";
import { sharingMode } from "@/lib/engine/consent";
import { TrendChart } from "@/components/clinic/trend-chart";
import { getSamplePatient, SAMPLE_NURSE } from "@/lib/fixtures/clinic";
import { reengagementPlan } from "@/lib/engine/reengage";



export default async function PatientPage({ params }: PageProps<"/clinic/home/[id]">) {
  const { id } = await params;
  const p = getSamplePatient(id);
  if (!p) notFound();
  const t = await getTranslations("Clinic");
  const tV = await getTranslations("ExperimentVerdict");
  const first = p.name.split(" ")[0];
  const pct = (x: number | null) => (x === null ? "–" : `${Math.round(x * 100)}%`);
  const quiet = reengagementPlan(p.lastCheckinDays, p.reengageDone).active;
  const tR = await getTranslations("Reengage");
  const tP = await getTranslations("Personal");
  const tF = await getTranslations("Forecast");
  const tE = await getTranslations("Enroll");
  const share = sharingMode(p.age, p.age >= 18 ? { share: p.adultShare ?? false, agreedAt: "" } : null);
  const tIdea = await getTranslations("ExperimentIdeas");
  const ideas = ideaLibrary.map((i) => ({ key: i.key, title: tIdea(`${i.key}.title`), hypothesis: tIdea(`${i.key}.hypothesis`) }));
  const profile = getSampleProfile(p.id, await getLocale());
  const reaching = (
    <Panel title={tR("panelTitle")} className={quiet ? "border-danger/40" : undefined}>
      <ReengagePanel name={first} nurse={SAMPLE_NURSE} daysQuiet={p.lastCheckinDays} done={p.reengageDone ?? []} />
    </Panel>
  );

  return (
    <div className="flex flex-col gap-5">
      <Link href="/clinic/home" className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-blue">
        <ArrowLeft aria-hidden className="size-4" /> {t("patientsTitle")}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl">{p.name}</h1>
          <p className="text-sm text-muted-foreground">
            {t("age", { age: p.age })} · {p.story}
          </p>
          <p className="mt-1 text-xs font-semibold text-blue">{tE(`share_${share}`)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={p.status} />
          <span className="rounded-md border px-2 py-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {t("simulated")}
          </span>
        </div>
      </header>

      {quiet && reaching}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile value={pct(p.onTime)} label={t("statSelfReported")} color={adhColor(p.onTime)} />
        <StatTile value={pct(p.verified)} label={t("statParentVerified")} />
        <StatTile value={String(p.experiments.length)} label={t("statExperiments")} />
        <StatTile value={t("daysAgo", { n: p.lastCheckinDays })} label={t("statLastCheckin")} />
      </div>

      <section className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card px-5 py-3">
        <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{tF("colWeather")}</span>
        <WeatherBadge weather={p.weather ?? "fog"} label={tF(`weather_${p.weather ?? "fog"}`)} />
        <span className="text-sm font-semibold">{tF(`signal_${weatherSignal(p.weather)}`)}</span>
        <span className="text-sm text-muted-foreground">
          {p.weather ? tF("replied", { n: p.weatherDays }) : tF("noReply")}
        </span>
      </section>

      <Panel title={t("trendTitle")}>
        <TrendChart
          data={p.trend}
          labels={{
            selfReported: t("selfReported"),
            verified: t("parentVerified"),
            target: t("target"),
            summary: t("trendSummary", { from: p.trend[0].selfReported, to: p.trend[7].selfReported }),
          }}
        />
        <h3 className="mt-5 mb-2 font-sans text-xs font-bold tracking-wider text-muted-foreground uppercase">
          {t("heatmapTitle")}
        </h3>
        <DoseHeatmap doses={p.doses} />
      </Panel>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title={t("focusTitle")}>
          <p className="text-2xl font-bold">{t(`barrier_${p.primary}`)}</p>
          <p className="mb-3 text-xs font-semibold text-blue">{t("teenChosen")}</p>
          <div className="flex flex-wrap gap-2">
            {p.barriers.map((b) => (
              <span
                key={b}
                className={
                  b === p.primary
                    ? "rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                    : "rounded-full border bg-muted px-3 py-1 text-xs font-semibold"
                }
              >
                {t(`barrier_${b}`)}
              </span>
            ))}
          </div>
          <h3 className="mt-4 mb-2 font-sans text-xs font-bold tracking-wider text-muted-foreground uppercase">
            {t("planTitle")}
          </h3>
          <p className="rounded-lg border bg-muted px-3 py-2.5 font-medium">{p.plan}</p>
        </Panel>

        <Panel title={t("experimentsTitle")}>
          <ul className="flex flex-col divide-y">
            {p.experiments.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{e.hypothesis}</p>
                  <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
                    {e.status === "active" ? t("running") : t(`decision_${e.decision ?? "rerun"}`)}
                  </span>
                </div>
                {(
                  [
                    ["A", e.armA, e.result.aAdh],
                    ["B", e.armB, e.result.bAdh],
                  ] as const
                ).map(([arm, text, adh]) => (
                  <div key={arm} className="grid grid-cols-[1fr_5rem_2.5rem] items-center gap-3 text-xs">
                    <span className="truncate font-medium">
                      {arm} · {text}
                    </span>
                    <span className="h-2 overflow-hidden rounded-full border bg-muted">
                      <span
                        className="block h-full"
                        style={{ width: pct(adh), background: e.result.winner === arm ? "var(--success)" : "var(--muted-foreground)" }}
                      />
                    </span>
                    <span className="text-right font-bold tabular-nums">{pct(adh)}</span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">{tV(e.result.verdict)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {profile && (
        <Panel title={tP("planTitle")}>
          <MessagePlanPanel teenId={p.id} profile={profile} />
        </Panel>
      )}

      {!quiet && reaching}

      <Panel title={t("actionsTitle")}>
        <ClinicActions teenId={p.id} first={first} ideas={ideas} />
      </Panel>
    </div>
  );
}
