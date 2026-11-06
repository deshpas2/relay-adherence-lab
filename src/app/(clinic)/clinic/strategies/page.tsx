import { getTranslations } from "next-intl/server";
import { Panel } from "@/components/clinic/bits";
import { strategyLeaderboard } from "@/lib/fixtures/clinic";

// TODO(backend): v_strategy_leaderboard (Section 3.5).
export default async function StrategiesPage() {
  const t = await getTranslations("Clinic");
  const rows = strategyLeaderboard();

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl">{t("strategiesTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("strategiesSub")}</p>
      </header>
      <Panel title={t("leaderboardTitle")}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              <tr>
                <th className="py-2 pr-3">{t("colStrategy")}</th>
                <th className="px-3 py-2">{t("colTried")}</th>
                <th className="px-3 py-2">{t("colAdopted")}</th>
                <th className="px-3 py-2">{t("colLift")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.factor} className="border-b last:border-b-0">
                  <td className="py-3 pr-3">
                    <p className="font-bold">{t(`factor_${r.factor}`)}</p>
                    <p className="text-xs text-muted-foreground">{t(`factorHint_${r.factor}`)}</p>
                  </td>
                  <td className="px-3 py-3 tabular-nums">{t("triedCount", { tried: r.tried, finished: r.finished })}</td>
                  <td className="px-3 py-3">
                    {r.pctAdopted === null ? (
                      <span className="text-muted-foreground">{t("noneFinished")}</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-24 overflow-hidden rounded-full border bg-muted">
                          <span className="block h-full bg-[#1f9d57]" style={{ width: `${r.pctAdopted}%` }} />
                        </span>
                        <span className="font-bold tabular-nums">{r.pctAdopted}%</span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-bold tabular-nums">
                    {r.avgLift === null ? "–" : t("points", { n: r.avgLift > 0 ? `+${r.avgLift}` : String(r.avgLift) })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{t("leaderboardNote")}</p>
      </Panel>
    </div>
  );
}
