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

  const recommendedLabel =
    run?.summary?.recommended_mode === "quantum_informed_plan"
      ? "Quantum-informed full-grid plan"
      : run?.summary?.recommended_mode === "classical_full_plan"
      ? "Classical full-grid plan"
      : "Recommended plan";

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
        description: `Recommended plan: ${response.summary?.recommended_mode === "quantum_informed_plan" ? "Quantum-informed full-grid plan" : "Classical full-grid plan"}. Full-scale planning stayed classical while the reduced quantum study was evaluated side by side.`,
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

  const recommendedPlacements = (run?.results?.recommended_plan?.placements as Array<any> | undefined) ?? [];
  const placementLookup = Object.fromEntries(recommendedPlacements.map((item) => [`${item.row}-${item.col}`, 1]));

  if (loading) return <LoadingState label="Loading optimization workspace..." />;
  if (error || !scenarios) return <EmptyState title="Optimization workspace unavailable" description={error ?? "Could not load scenarios."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 4 - Optimize"
        title="Intervention plan"
        description="Given 10 interventions, where should we place them to break adjacency-based fire spread pathways through dry brush on the 10x10 hillside?"
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-50">
            {running ? "Running..." : "Generate plan"}
          </button>
        }
      />

      {message ? <Notice tone={message.tone} title={message.title} description={message.description} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SectionPanel title="Challenge-aligned inputs" subtitle="The full plan enforces the wildfire challenge budget K=10. The reduced quantum study operates on a smaller critical candidate set.">
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
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Enforced budget</label>
                <input value="10 interventions" readOnly className="w-full rounded-2xl border border-border bg-slate-50 px-4 py-2.5 text-[13px] text-foreground outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Reduced quantum candidates</label>
                <input type="number" min={10} max={16} value={reducedCount} onChange={(event) => setReducedCount(Number(event.target.value))} className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
              </div>
            </div>
          </SectionPanel>

          {run ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <MetricTile label="Budget enforced" value={`K=${run.summary.budget_enforced_k}`} hint="Full 10x10 classical planning budget" />
                <MetricTile label="Broken links" value={String(run.summary.broken_adjacency_links)} hint="Flammable adjacency links removed by the recommended plan" />
                <MetricTile label="Corridor disruption" value={String(run.summary.spread_corridor_disruption)} hint="Reduction in ignition-connected spread pressure" />
                <MetricTile label="High-risk coverage" value={String(run.summary.coverage_high_risk_cells)} hint="Top critical cells covered by the recommended plan" />
              </div>

              <SectionPanel title="Objective and planning split" subtitle="The optimizer now exposes exactly what it is trying to improve and how the full-grid plan differs from the reduced quantum study">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-white/80 p-4">
                    <p className="text-[13px] font-semibold">Full-scale classical plan</p>
                    <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{run.summary.full_scale_scope}</p>
                    <p className="mt-3 text-[12px] text-muted-foreground">Objective</p>
                    <p className="text-[13px] font-medium">{run.summary.objective}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white/80 p-4">
                    <p className="text-[13px] font-semibold">Reduced quantum study</p>
                    <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{run.results.quantum.scope.note}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusPill label={`Shortlist ${run.results.quantum.scope.shortlist_count}`} tone="neutral" />
                      <StatusPill label={`Quantum subgraph ${run.results.quantum.scope.candidate_count}`} tone="accent" />
                      <StatusPill label={`Study budget ${run.results.quantum.scope.budget}`} tone="neutral" />
                    </div>
                  </div>
                </div>
              </SectionPanel>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <SectionPanel title="Recommended placement layout" subtitle="This is the deployable plan on the full 10x10 hillside. Selected cells are scored against the adjacency disruption objective.">
                  <ScenarioGrid grid={selectedScenario?.grid ?? []} scoreLookup={placementLookup} />
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <MetricTile label="Baseline links" value={String(run.results.baseline.metrics.adjacency_links)} />
                    <MetricTile label="After plan links" value={String(run.results.recommended_plan.metrics_after.adjacency_links)} />
                    <MetricTile label="Largest cluster before" value={String(run.results.baseline.metrics.largest_component)} />
                    <MetricTile label="Largest cluster after" value={String(run.results.recommended_plan.metrics_after.largest_component)} />
                  </div>
                </SectionPanel>

                <SectionPanel title="Plan comparison" subtitle="The product stays honest: full 10x10 planning is classical, while the quantum study informs a reduced subset only.">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-border bg-white/80 p-4">
                      <p className="text-[13px] font-semibold">Classical full-grid plan</p>
                      <p className="mt-2 text-[12px] text-muted-foreground">
                        Objective after plan: {run.summary.classical_plan_score} • broken links {run.results.classical.improvement.broken_adjacency_links} • corridor disruption{" "}
                        {run.results.classical.improvement.spread_corridor_disruption}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-white/80 p-4">
                      <p className="text-[13px] font-semibold">Quantum-informed full-grid plan</p>
                      <p className="mt-2 text-[12px] text-muted-foreground">
                        Objective after plan: {run.summary.quantum_informed_plan_score} • broken links {run.results.quantum_informed.improvement.broken_adjacency_links} • corridor disruption{" "}
                        {run.results.quantum_informed.improvement.spread_corridor_disruption}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-slate-50/80 p-4">
                      <p className="text-[13px] font-semibold">Recommended</p>
                      <p className="mt-1 text-[13px] font-medium text-foreground">{recommendedLabel}</p>
                      <p className="mt-2 text-[12px] text-muted-foreground">
                        {run.summary.recommended_mode === "quantum_informed_plan" ? "The reduced quantum study improved the full-grid objective enough to influence the final deployable plan." : "The full-grid classical plan remained stronger, so the quantum study is kept as supporting evidence rather than forced into deployment."}
                      </p>
                    </div>
                  </div>
                </SectionPanel>
              </div>

              <SectionPanel title="Placement explanations" subtitle="Each selected cell explains how it disrupts connectivity and whether it also appeared in the reduced quantum study">
                <div className="space-y-3">
                  {recommendedPlacements.slice(0, budget).map((placement) => (
                    <div key={`${placement.row}-${placement.col}`} className="rounded-2xl border border-border bg-white/80 p-4">
                      <p className="text-[13px] font-semibold">
                        Row {placement.row + 1}, Col {placement.col + 1}
                      </p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{placement.reason}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusPill label={`Blocked links ${placement.blocked_links ?? 0}`} tone="good" />
                        <StatusPill label={`Corridor disruption ${placement.spread_corridor_disruption ?? 0}`} tone="accent" />
                        {placement.selected_by_quantum ? <StatusPill label="Appears in reduced quantum study" tone="neutral" /> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel title="Continue workflow" subtitle="Use this intervention plan in benchmarking or report generation.">
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
              title="No intervention plan yet"
              description="Run the optimizer to answer the core challenge question: given 10 interventions, where should they go to break wildfire spread pathways most effectively?"
            />
          )}
        </div>

        <SectionPanel title="Recent intervention plans" subtitle={historyLoading ? "Loading scenario history..." : "Saved optimization runs for this scenario"}>
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
                    <StatusPill label={item.summary?.recommended_mode === "quantum_informed_plan" ? "Quantum-informed" : item.summary?.recommended_mode === "classical_full_plan" ? "Classical" : item.status} tone="accent" />
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
