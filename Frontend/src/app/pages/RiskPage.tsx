import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, Notice, PageHeader, ScenarioGrid, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

const MODE_META = {
  classical: { title: "Classical ML", subtitle: "Logistic regression baseline" },
  quantum: { title: "Quantum ML", subtitle: "Qiskit variational classifier" },
  hybrid: { title: "Hybrid view", subtitle: "Probability ensemble on the same task" },
} as const;

function modeLabel(mode: string) {
  return MODE_META[mode as keyof typeof MODE_META]?.title ?? mode;
}

export function RiskPage() {
  const [params] = useSearchParams();
  const seededScenario = params.get("scenario") ?? "";
  const [scenarioId, setScenarioId] = useState(seededScenario);
  const [run, setRun] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [horizonSteps, setHorizonSteps] = useState(2);
  const [sampleCount, setSampleCount] = useState(24);
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
      const response = await api.runRisk({ scenario_id: activeScenarioId, horizon_steps: horizonSteps, sample_count: sampleCount });
      setRun(response);
      setScenarioId(activeScenarioId);
      setMessage({
        tone: "success",
        title: "Risk classification run complete",
        description: `${response.summary?.recommended_mode ?? "A model"} delivered the best held-out F1. The run is now saved in scenario history.`,
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

  const availableModes = (["classical", "quantum", "hybrid"] as const).filter((mode) => run?.results?.[mode]);
  const dataset = run?.summary?.dataset;
  const scoreLookup = (mode: string) =>
    Object.fromEntries((run?.results?.[mode]?.grid_scores ?? []).map((item: any) => [`${item.row}-${item.col}`, item.score]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 2 - Risk Map"
        title="Early ignition risk classification"
        description="Train a classical baseline and a real Qiskit QML model on the same wildfire task: predict which cells become ignition points within the early response window."
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-50">
            {running ? "Running..." : "Run classification"}
          </button>
        }
      />

      {message ? <Notice tone={message.tone} title={message.title} description={message.description} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SectionPanel title="Task setup" subtitle="Same dataset, same label, same evaluation split">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px]">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Scenario</label>
                <select
                  value={activeScenarioId}
                  onChange={(event) => setScenarioId(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none"
                >
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Response window</label>
                <select
                  value={String(horizonSteps)}
                  onChange={(event) => setHorizonSteps(Number(event.target.value))}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none"
                >
                  <option value="2">2 steps</option>
                  <option value="3">3 steps</option>
                  <option value="4">4 steps</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Simulation draws</label>
                <select
                  value={String(sampleCount)}
                  onChange={(event) => setSampleCount(Number(event.target.value))}
                  className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none"
                >
                  <option value="16">16</option>
                  <option value="24">24</option>
                  <option value="32">32</option>
                </select>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MetricTile label="Binary target" value="Ignite" hint="Will this cell ignite inside the response window?" />
              <MetricTile label="Classical model" value="LogReg" hint="Scaled logistic regression baseline" />
              <MetricTile label="Quantum model" value="QML" hint="Shallow Qiskit variational classifier" />
            </div>
          </SectionPanel>

          {run ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <MetricTile label="Recommended model" value={String(run.summary.recommended_mode).toUpperCase()} hint="Best held-out tradeoff for this run" />
                <MetricTile label="Most practical" value={String(run.summary.most_practical_mode).toUpperCase()} hint="Best repeat-use choice under current cost" />
                <MetricTile label="Training samples" value={String(dataset?.train_samples ?? "0")} hint={`${dataset?.positive_samples ?? 0} positive / ${dataset?.negative_samples ?? 0} negative labels`} />
                <MetricTile label="Effective window" value={`${dataset?.effective_label_horizon_steps ?? horizonSteps} steps`} hint="Actual label horizon used to keep the split meaningful" />
              </div>

              <SectionPanel title="Dataset and task" subtitle="Generated from repeated spread simulations on scenario variants">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-white/80 p-4">
                    <p className="text-[13px] font-semibold">Classification target</p>
                    <p className="mt-2 text-[13px] text-muted-foreground">{run.summary.classification_task}</p>
                    <p className="mt-2 text-[12px] text-muted-foreground">{dataset?.label_definition}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white/80 p-4">
                    <p className="text-[13px] font-semibold">Features</p>
                    <p className="mt-2 text-[13px] text-muted-foreground">{(dataset?.feature_names ?? []).join(", ")}</p>
                    <p className="mt-2 text-[12px] text-muted-foreground">{dataset?.dataset_generation}</p>
                  </div>
                </div>
              </SectionPanel>

              <SectionPanel title="Held-out model comparison" subtitle="All models are evaluated on the same test split.">
                <div className="grid gap-4 lg:grid-cols-3">
                  {(run.summary.comparison as Array<any>).map((item) => (
                    <div key={item.mode} className="rounded-2xl border border-border bg-white/85 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[14px] font-semibold">{modeLabel(item.mode)}</p>
                          <p className="mt-1 text-[12px] text-muted-foreground">{run.results[item.mode]?.model?.notes}</p>
                        </div>
                        <StatusPill label={item.mode === run.summary.recommended_mode ? "Best quality" : item.mode === run.summary.most_practical_mode ? "Most practical" : "Compared"} tone={item.mode === run.summary.recommended_mode ? "good" : "accent"} />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <MetricTile label="Accuracy" value={(item.accuracy * 100).toFixed(1)} hint="Held-out split" />
                        <MetricTile label="F1" value={(item.f1 * 100).toFixed(1)} hint="Balanced quality summary" />
                        <MetricTile label="Precision" value={(item.precision * 100).toFixed(1)} hint="Positive prediction quality" />
                        <MetricTile label="Recall" value={(item.recall * 100).toFixed(1)} hint="High-risk cell capture" />
                      </div>
                      <p className="mt-3 text-[12px] text-muted-foreground">{item.runtime_ms} ms • {item.practicality}</p>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <div className="grid gap-6 xl:grid-cols-3">
                {availableModes.map((mode) => (
                  <SectionPanel key={mode} title={`${MODE_META[mode].title} risk map`} subtitle={MODE_META[mode].subtitle}>
                    <ScenarioGrid grid={selectedScenario?.grid ?? []} scoreLookup={scoreLookup(mode)} />
                    <div className="mt-4 space-y-2 text-[12px] text-muted-foreground">
                      <p>Accuracy {(run.results[mode].metrics.accuracy * 100).toFixed(1)}%</p>
                      <p>F1 {(run.results[mode].metrics.f1 * 100).toFixed(1)}%</p>
                      <p>{run.results[mode].metrics.practicality}</p>
                    </div>
                  </SectionPanel>
                ))}
              </div>

              <SectionPanel title="Hotspots and conclusion" subtitle="Highest predicted ignition probabilities for this scenario">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill label={`Recommended: ${run.summary.recommended_mode}`} tone="good" />
                  <StatusPill label={`Practical: ${run.summary.most_practical_mode}`} tone="accent" />
                </div>
                <p className="mt-4 text-[13px] text-muted-foreground">{run.summary.conclusion}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {availableModes.map((mode) => (
                    <div key={mode} className="rounded-2xl border border-border bg-white/80 p-4">
                      <p className="text-[13px] font-semibold">{MODE_META[mode].title}</p>
                      <ul className="mt-3 space-y-2 text-[12px] text-muted-foreground">
                        {(run.results[mode].top_hotspots as Array<any>).slice(0, 4).map((hotspot) => (
                          <li key={`${mode}-${hotspot.row}-${hotspot.col}`}>
                            Row {hotspot.row + 1}, Col {hotspot.col + 1} • {(hotspot.score * 100).toFixed(0)}% ignition risk
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionPanel>

              <SectionPanel title="Continue workflow" subtitle="Use this run as the risk evidence for the same hillside version.">
                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/forecast?scenario=${activeScenarioId}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Spread forecast
                  </Link>
                  <Link to={`/app/reports?scenario=${activeScenarioId}&risk=${run.id}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Report with this run
                  </Link>
                </div>
              </SectionPanel>
            </>
          ) : (
            <EmptyState
              title="No risk classification run yet"
              description="Run the wildfire classifier comparison to see which cells are predicted to ignite early and whether the classical or quantum model is more useful under current constraints."
            />
          )}
        </div>

        <SectionPanel title="Recent risk runs" subtitle={historyLoading ? "Loading scenario history..." : "Saved classifier comparisons for this scenario"}>
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
                  <p className="mt-2 text-[12px] text-muted-foreground">{item.summary?.classification_task ?? "Binary ignition classification"}</p>
                </button>
              ))
            )}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
