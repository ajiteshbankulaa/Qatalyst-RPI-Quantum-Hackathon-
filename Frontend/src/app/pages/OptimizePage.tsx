import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, PageHeader, ScenarioGrid, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function OptimizePage() {
  const [params] = useSearchParams();
  const [scenarioId, setScenarioId] = useState(params.get("scenario") ?? "");
  const [budget, setBudget] = useState(10);
  const [reducedCount, setReducedCount] = useState(8);
  const [run, setRun] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const { data: scenarios, loading, error } = useAsyncData(api.listScenarios, []);

  const selectedScenario = useMemo(() => scenarios?.find((scenario) => scenario.id === scenarioId) ?? scenarios?.[0], [scenarioId, scenarios]);
  const activeScenarioId = scenarioId || selectedScenario?.id || "";

  async function execute() {
    if (!activeScenarioId) return;
    setRunning(true);
    try {
      const response = await api.runOptimize({
        scenario_id: activeScenarioId,
        intervention_budget_k: budget,
        reduced_candidate_count: reducedCount,
      });
      setRun(response);
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
        eyebrow="Optimize"
        title="Constrained intervention planning"
        description="Full-grid classical screening remains the baseline. Quantum analysis is restricted to a reduced critical subgraph and labeled that way explicitly so the app never overclaims realistic NISQ scale."
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white">
            {running ? "Running..." : "Run optimization"}
          </button>
        }
      />

      <SectionPanel>
        <div className="grid gap-4 lg:grid-cols-3">
          <select value={activeScenarioId} onChange={(event) => setScenarioId(event.target.value)} className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none">
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
          <input type="number" min={1} max={20} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
          <input type="number" min={4} max={12} value={reducedCount} onChange={(event) => setReducedCount(Number(event.target.value))} className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
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
            <SectionPanel title="Hybrid intervention layout" subtitle="Highlighted placements reflect the combined classical full-grid and reduced quantum study recommendation.">
              <ScenarioGrid grid={selectedScenario?.grid ?? []} scoreLookup={placementLookup} />
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill label={`Before LCC ${run.results.classical.before_connectivity.largest_component}`} tone="warn" />
                <StatusPill label={`After LCC ${run.results.classical.after_connectivity.largest_component}`} tone="good" />
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
              </div>
            </SectionPanel>
          </div>
        </>
      ) : (
        <EmptyState
          title="No optimization run yet"
          description="Run intervention planning to compare classical full-scale placement logic against the reduced quantum study and the hybrid recommendation."
        />
      )}
    </div>
  );
}
