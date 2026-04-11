import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, Notice, PageHeader, ScenarioGrid, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function RiskPage() {
  const [params] = useSearchParams();
  const seededScenario = params.get("scenario") ?? "";
  const [scenarioId, setScenarioId] = useState(seededScenario);
  const [run, setRun] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; title: string; description: string } | null>(null);
  const { data: scenarios, loading, error } = useAsyncData(api.listScenarios, []);
  const { data: runHistory, loading: historyLoading, reload: reloadHistory } = useAsyncData(
    () => (scenarioId ? api.listRiskRuns(scenarioId) : Promise.resolve([])),
    [scenarioId],
  );

  const selectedScenario = useMemo(() => scenarios?.find((scenario) => scenario.id === scenarioId) ?? scenarios?.[0], [scenarioId, scenarios]);
  const activeScenarioId = scenarioId || selectedScenario?.id || "";

  useEffect(() => {
    if (selectedScenario && !scenarioId) {
      setScenarioId(selectedScenario.id);
    }
  }, [scenarioId, selectedScenario]);

  useEffect(() => {
    if (runHistory && runHistory.length > 0 && !run) {
      setRun(runHistory[0]);
    }
  }, [runHistory, run]);

  async function execute() {
    if (!activeScenarioId) return;
    setRunning(true);
    setMessage(null);
    try {
      const response = await api.runRisk({ scenario_id: activeScenarioId });
      setRun(response);
      setScenarioId(activeScenarioId);
      setMessage({
        tone: "success",
        title: "Risk run complete",
        description: `Recommended mode: ${response.summary?.recommended_mode ?? "unavailable"}. The run is now persisted in scenario history.`,
      });
      await reloadHistory();
    } catch (err) {
      setMessage({
        tone: "error",
        title: "Risk run failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <LoadingState label="Loading risk workspace..." />;
  if (error || !scenarios) return <EmptyState title="Risk workspace unavailable" description={error ?? "Could not load scenarios."} />;

  const resultModes = run?.results ? Object.values(run.results) : [];
  const scoreLookup = (mode: string) =>
    Object.fromEntries((run?.results?.[mode]?.grid_scores ?? []).map((item: any) => [`${item.row}-${item.col}`, item.score]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 2 - Risk"
        title="Risk comparison analysis"
        description="Compare classical, quantum, and hybrid risk scoring over the same scenario-derived features. The output is operational practicality, not a claim of quantum advantage."
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-50">
            {running ? "Running..." : "Run risk"}
          </button>
        }
      />

      {message ? <Notice tone={message.tone} title={message.title} description={message.description} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SectionPanel>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Scenario</label>
                <select
                  value={activeScenarioId}
                  onChange={(event) => setScenarioId(event.target.value)}
                  className="min-w-[320px] rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none"
                >
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
              </div>
              {run ? <StatusPill label={`Run ${run.id.slice(0, 8)}`} tone="accent" /> : null}
            </div>
          </SectionPanel>

          {run ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {(run.summary.comparison as Array<any>).map((item) => (
                  <MetricTile
                    key={item.mode}
                    label={item.mode}
                    value={(item.avg_score * 100).toFixed(1)}
                    hint={`${item.high_risk_cells} high-risk cells • ${item.runtime_ms} ms • ${item.practicality}`}
                  />
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                {(["classical", "quantum", "hybrid"] as const).map((mode) => (
                  <SectionPanel key={mode} title={`${mode[0].toUpperCase()}${mode.slice(1)} surface`} subtitle={run.results[mode]?.metrics?.practicality}>
                    <ScenarioGrid grid={selectedScenario?.grid ?? []} scoreLookup={scoreLookup(mode)} />
                  </SectionPanel>
                ))}
              </div>

              <SectionPanel title="Comparison summary" subtitle="Each mode is evaluated on the same scenario state.">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill label={`Recommended: ${run.summary.recommended_mode}`} tone="good" />
                  <StatusPill label={`Most practical: ${run.summary.most_practical_mode}`} tone="accent" />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {resultModes.map((mode: any) => (
                    <div key={mode.mode} className="rounded-2xl border border-border bg-white/80 p-4">
                      <p className="text-[14px] font-semibold">{mode.mode}</p>
                      <ul className="mt-3 space-y-2 text-[12px] text-muted-foreground">
                        {(mode.top_hotspots as Array<any>).slice(0, 3).map((hotspot) => (
                          <li key={`${hotspot.row}-${hotspot.col}`}>
                            Row {hotspot.row + 1}, Col {hotspot.col + 1} • {(hotspot.score * 100).toFixed(0)} score
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel title="Continue workflow" subtitle="Use this scenario state in the next module.">
                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/forecast?scenario=${activeScenarioId}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Forecast
                  </Link>
                  <Link to={`/app/reports?scenario=${activeScenarioId}&risk=${run.id}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Report with this run
                  </Link>
                </div>
              </SectionPanel>
            </>
          ) : (
            <EmptyState
              title="No risk run yet"
              description="Select a scenario and run the comparison to see classical, quantum, and hybrid risk heatmaps over the same wildfire grid."
            />
          )}
        </div>

        <SectionPanel title="Recent runs" subtitle={historyLoading ? "Loading scenario history..." : "Latest persisted runs for this scenario"}>
          <div className="space-y-3">
            {(runHistory ?? []).length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No risk runs saved for this scenario yet.</p>
            ) : (
              (runHistory ?? []).slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setRun(item)}
                  className={`w-full rounded-2xl border p-4 text-left ${run?.id === item.id ? "border-qp-cyan bg-cyan-50/40" : "border-border bg-white/80"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold">{item.id.slice(0, 8)}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <StatusPill label={item.summary?.recommended_mode ?? item.status} tone="accent" />
                  </div>
                </button>
              ))
            )}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
