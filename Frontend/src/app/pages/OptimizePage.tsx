import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, Notice, PageHeader, ScenarioGrid, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function OptimizePage() {
  const [params] = useSearchParams();
  const [scenarioId, setScenarioId] = useState(params.get("scenario") ?? "");
  const [budget] = useState(10);
  const [reducedCount, setReducedCount] = useState(12);
  const [run, setRun] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; title: string; description: string } | null>(null);
  const { data: scenarios, loading, error } = useAsyncData(api.listScenarios, []);
  const { data: runHistory, loading: historyLoading, reload: reloadHistory } = useAsyncData(
    () => (scenarioId ? api.listOptimizeRuns(scenarioId) : Promise.resolve([])),
    [scenarioId],
  );

  const selectedScenario = useMemo(() => scenarios?.find((scenario) => scenario.id === scenarioId) ?? scenarios?.[0], [scenarioId, scenarios]);
  const activeScenarioId = scenarioId || selectedScenario?.id || "";
  const recommendedPlacements = (run?.results?.recommended_plan?.placements as Array<any> | undefined) ?? [];
  const placementLookup = Object.fromEntries(recommendedPlacements.map((item) => [`${item.row}-${item.col}`, 1]));

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
      const response = await api.runOptimize({
        scenario_id: activeScenarioId,
        intervention_budget_k: budget,
        reduced_candidate_count: reducedCount,
      });
      setRun(response);
      setMessage({
        tone: "success",
        title: "Intervention plan complete",
        description: "The optimizer recomputed the full-grid plan with the same wildfire semantics used by risk and forecast.",
      });
      await reloadHistory();
    } catch (err) {
      setMessage({
        tone: "error",
        title: "Optimization failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <LoadingState label="Loading optimization workspace..." />;
  if (error || !scenarios) return <EmptyState title="Optimization workspace unavailable" description={error ?? "Could not load scenarios."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 4 - Intervention Plan"
        title="Forecast-aware intervention planning"
        description="Place 10 interventions on the full 10x10 hillside using the same hazard semantics as the forecast. The reduced quantum study remains a benchmarkable subproblem, not a fake full-scale solve."
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="inline-flex items-center justify-center bg-primary px-6 py-3 text-[13px] font-bold uppercase tracking-wider text-primary-foreground transition-all hover:bg-qp-slate disabled:opacity-50">
            {running ? "Running..." : "Generate plan"}
          </button>
        }
      />

      {message ? <Notice tone={message.tone} title={message.title} description={message.description} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SectionPanel title="Planning inputs" subtitle="The full-grid plan is classical. The reduced quantum study uses the same hazard-derived candidate ranking.">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Scenario</label>
                <select value={activeScenarioId} onChange={(event) => setScenarioId(event.target.value)} className="w-full border border-border bg-card px-4 py-2.5 text-[13px] outline-none focus:border-primary transition-colors">
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Budget</label>
                <input value="K = 10" readOnly className="w-full border border-border bg-secondary/50 px-4 py-2.5 text-[14px] font-mono text-muted-foreground outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Reduced quantum shortlist</label>
                <input type="number" min={10} max={16} value={reducedCount} onChange={(event) => setReducedCount(Number(event.target.value))} className="w-full border border-border bg-card px-4 py-2.5 text-[14px] font-mono outline-none focus:border-primary transition-colors" />
              </div>
            </div>
          </SectionPanel>

          {run ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <MetricTile label="Burned-area reduction" value={String(run.summary.expected_burned_area_reduction)} hint="Mean ensemble reduction" />
                <MetricTile label="Burn-probability reduction" value={String(run.summary.burn_probability_reduction)} hint="Peak burn probability drop" />
                <MetricTile label="Corridor disruption" value={String(run.summary.corridor_disruption)} hint="Adjacency and corridor pressure reduction" />
                <MetricTile label="Classical/quantum agreement" value={String(run.summary.agreement_between_classical_and_quantum)} hint="Shared placements across both studies" />
              </div>

              <SectionPanel title="Recommended full-grid plan" subtitle="Deployable plan on the full hillside using the shared wildfire model">
                <ScenarioGrid grid={selectedScenario?.grid ?? []} scoreLookup={placementLookup} />
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <MetricTile label="Before burned area" value={String(run.results.baseline.metrics.mean_final_burned_area)} />
                  <MetricTile label="After burned area" value={String(run.results.recommended_plan.metrics_after.mean_final_burned_area)} />
                  <MetricTile label="Before links" value={String(run.results.baseline.metrics.adjacency_links)} />
                  <MetricTile label="After links" value={String(run.results.recommended_plan.metrics_after.adjacency_links)} />
                </div>
              </SectionPanel>

              <SectionPanel title="Classical full-grid vs reduced quantum study" subtitle="The quantum subproblem is derived from the same hazard model but remains explicitly reduced in scope.">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="border border-border bg-card p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border pb-2">Full-grid classical layer</p>
                    <p className="text-[13px] leading-relaxed text-foreground">{run.summary.full_scale_scope}</p>
                    <p className="mt-3 text-[13px] font-semibold text-muted-foreground">Objective after plan: <span className="text-foreground">{run.summary.classical_plan_score}</span></p>
                  </div>
                  <div className="border border-border bg-card p-5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 border-b border-border pb-2">Reduced quantum layer</p>
                    <p className="text-[13px] leading-relaxed text-foreground">{run.summary.reduced_quantum_scope.note}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <StatusPill label={`Shortlist ${run.summary.reduced_quantum_scope.shortlist_count}`} tone="neutral" />
                      <StatusPill label={`Subgraph ${run.summary.reduced_quantum_scope.candidate_count}`} tone="accent" />
                      <StatusPill label={`Approx ratio ${(run.results.quantum.approximation_ratio * 100).toFixed(1)}%`} tone="good" />
                    </div>
                  </div>
                </div>
              </SectionPanel>

              <SectionPanel title="Placement explanations" subtitle="Each recommendation is tied to corridor pressure, burn probability, and agreement with the reduced quantum study where applicable.">
                <div className="space-y-4">
                  {recommendedPlacements.slice(0, budget).map((placement) => (
                    <div key={`${placement.row}-${placement.col}`} className="border border-border bg-card p-5 border-l-2 border-l-qp-cyan">
                      <p className="text-[14px] font-bold text-foreground mb-1">Row {placement.row + 1}, Col {placement.col + 1}</p>
                      <p className="text-[13px] leading-relaxed text-muted-foreground">{placement.reason}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <StatusPill label={`Burn prob ${(placement.burn_probability * 100).toFixed(0)}%`} tone="warn" />
                        <StatusPill label={`Area reduction ${placement.expected_burned_area_reduction}`} tone="good" />
                        {placement.selected_by_quantum ? <StatusPill label="Supported by reduced quantum study" tone="accent" /> : <StatusPill label="Included in classical full plan" tone="neutral" />}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionPanel>
            </>
          ) : (
            <EmptyState title="No intervention plan yet" description="Run the optimizer to compare a full-grid classical plan against a reduced quantum-informed study using the shared wildfire hazard model." />
          )}
        </div>

        <SectionPanel title="Recent intervention plans" subtitle={historyLoading ? "Loading scenario history..." : "Saved optimization runs for this scenario"}>
          <div className="space-y-3">
            {(runHistory ?? []).length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No optimization runs saved for this scenario yet.</p>
            ) : (
              (runHistory ?? []).slice(0, 8).map((item) => (
                <button key={item.id} onClick={() => setRun(item)} className={`w-full border p-4 text-left transition-colors ${run?.id === item.id ? "border-primary bg-secondary/30" : "border-border bg-card hover:border-primary/50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold">{item.id.slice(0, 8)}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <StatusPill label={item.summary?.recommended_mode ?? item.status} tone="accent" />
                  </div>
                </button>
              ))
            )}
          </div>
          {run ? (
            <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
              <p className="text-[12px] uppercase tracking-[0.15em] font-bold text-foreground">Next steps</p>
              <div className="flex flex-wrap gap-2">
                <Link to={`/app/benchmarks?scenario=${activeScenarioId}`} className="border border-border bg-secondary/50 hover:bg-secondary px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-foreground transition-colors">
                  Benchmarks
                </Link>
                <Link to={`/app/reports?scenario=${activeScenarioId}&optimization=${run.id}`} className="border border-border bg-secondary/50 hover:bg-secondary px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-foreground transition-colors">
                  Report with this run
                </Link>
              </div>
            </div>
          ) : null}
        </SectionPanel>
      </div>
    </div>
  );
}
