import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, Notice, PageHeader, ScenarioGrid, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function OptimizePage() {
  const [params] = useSearchParams();
  const [scenarioId, setScenarioId] = useState(params.get("scenario") ?? "");
  const [budget, setBudget] = useState(10);
  const [reducedCount, setReducedCount] = useState(8);
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
        title: "Optimization complete",
        description: `Recommended mode: ${response.summary?.recommended_mode ?? "unavailable"}. The run is now available to benchmarking and reports.`,
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

  const placementLookup = Object.fromEntries(
    ((run?.results?.hybrid?.placements as Array<any> | undefined) ?? []).map((item) => [`${item.row}-${item.col}`, 1]),
  );

  if (loading) return <LoadingState label="Loading optimization workspace..." />;
  if (error || !scenarios) return <EmptyState title="Optimization workspace unavailable" description={error ?? "Could not load scenarios."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 4 - Optimize"
        title="Constrained intervention planning"
        description="Classical full-grid screening stays the baseline. Quantum analysis is restricted to a reduced candidate set and labeled that way explicitly."
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-50">
            {running ? "Running..." : "Run optimization"}
          </button>
        }
      />

      {message ? <Notice tone={message.tone} title={message.title} description={message.description} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SectionPanel title="Parameters" subtitle="Budget controls the full plan. Reduced candidates control the benchmark-sized quantum study.">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Scenario</label>
                <select value={activeScenarioId} onChange={(event) => setScenarioId(event.target.value)} className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none">
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Budget K</label>
                <input type="number" min={1} max={20} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Reduced candidates</label>
                <input type="number" min={4} max={12} value={reducedCount} onChange={(event) => setReducedCount(Number(event.target.value))} className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
              </div>
            </div>
          </SectionPanel>

          {run ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricTile label="Recommended mode" value={run.summary.recommended_mode} hint={run.summary.full_scale_scope} />
                <MetricTile label="Connectivity reduction" value={String(run.summary.connectivity_reduction)} hint="Largest high-risk component shrinkage" />
                <MetricTile label="Reduced quantum scope" value={String(run.results.quantum.scope.candidate_count)} hint={`Budget ${run.results.quantum.scope.budget}`} />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <SectionPanel title="Hybrid intervention layout" subtitle="Placements combine full-grid classical scoring with reduced quantum study output.">
                  <ScenarioGrid grid={selectedScenario?.grid ?? []} scoreLookup={placementLookup} />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusPill label={`Before LCC ${run.results.classical.before_connectivity.largest_component}`} tone="warn" />
                    <StatusPill label={`After LCC ${run.results.classical.after_connectivity.largest_component}`} tone="good" />
                    {run.results.quantum.circuit ? <StatusPill label={`Real circuit depth ${run.results.quantum.circuit.depth}`} tone="accent" /> : null}
                  </div>
                </SectionPanel>

                <SectionPanel title="Placement rationale" subtitle="Recommended placements and reduced-study detail">
                  <div className="space-y-3">
                    {(run.results.hybrid.placements as Array<any>).slice(0, budget).map((placement) => (
                      <div key={`${placement.row}-${placement.col}`} className="rounded-2xl border border-border bg-white/80 p-4">
                        <p className="text-[13px] font-semibold">
                          Row {placement.row + 1}, Col {placement.col + 1}
                        </p>
                        <p className="mt-1 text-[12px] text-muted-foreground">{placement.reason}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-border bg-white/80 p-4">
                    <p className="text-[13px] font-semibold">Reduced quantum study</p>
                    <p className="mt-2 text-[12px] text-muted-foreground">
                      Approximation ratio {run.results.quantum.approximation_ratio} • exact reference cost {run.results.quantum.exact_baseline.best_cost}
                    </p>
                    <p className="mt-1 text-[11px] text-qp-steel italic">{run.results.quantum.scope.note}</p>
                  </div>
                </SectionPanel>
              </div>

              <SectionPanel title="Continue workflow" subtitle="Use this optimization run for benchmarking or report generation.">
                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/benchmarks?scenario=${activeScenarioId}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Benchmarks
                  </Link>
                  <Link to={`/app/reports?scenario=${activeScenarioId}&optimization=${run.id}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Report with this run
                  </Link>
                </div>
              </SectionPanel>
            </>
          ) : (
            <EmptyState
              title="No optimization run yet"
              description="Run intervention planning to compare classical full-scale placement logic against the reduced quantum study."
            />
          )}
        </div>

        <SectionPanel title="Recent runs" subtitle={historyLoading ? "Loading scenario history..." : "Latest persisted runs for this scenario"}>
          <div className="space-y-3">
            {(runHistory ?? []).length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No optimization runs saved for this scenario yet.</p>
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
