import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, PageHeader, ScenarioGrid, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function RiskPage() {
  const [params] = useSearchParams();
  const seededScenario = params.get("scenario") ?? "";
  const [scenarioId, setScenarioId] = useState(seededScenario);
  const [run, setRun] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const { data: scenarios, loading, error } = useAsyncData(api.listScenarios, []);

  const selectedScenario = useMemo(() => scenarios?.find((scenario) => scenario.id === scenarioId) ?? scenarios?.[0], [scenarioId, scenarios]);
  const activeScenarioId = scenarioId || selectedScenario?.id || "";

  async function execute() {
    if (!activeScenarioId) return;
    setRunning(true);
    try {
      const response = await api.runRisk({ scenario_id: activeScenarioId });
      setRun(response);
      setScenarioId(activeScenarioId);
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
        eyebrow="Risk"
        title="Risk modeling comparison"
        description="Run classical, quantum, and hybrid risk scoring over the same scenario-derived features. The goal is comparability and operational practicality, not fabricated quantum superiority."
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white">
            {running ? "Running..." : "Run risk analysis"}
          </button>
        }
      />

      <SectionPanel>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Scenario</p>
            <select
              value={activeScenarioId}
              onChange={(event) => setScenarioId(event.target.value)}
              className="mt-2 min-w-[320px] rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none"
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </option>
              ))}
            </select>
          </div>
          {run ? <StatusPill label={`Run ${run.id}`} tone="accent" /> : null}
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

          <SectionPanel title="Mode comparison" subtitle="The recommended mode is chosen from the actual run summary.">
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
        </>
      ) : (
        <EmptyState
          title="No risk run yet"
          description="Select a scenario and run the comparison to see classical, quantum, and hybrid risk heatmaps over the same wildfire grid."
        />
      )}
    </div>
  );
}
