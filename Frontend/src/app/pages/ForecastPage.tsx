import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, Notice, PageHeader, ScenarioGrid, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function ForecastPage() {
  const [params] = useSearchParams();
  const [scenarioId, setScenarioId] = useState(params.get("scenario") ?? "");
  const [steps, setSteps] = useState(6);
  const [dryness, setDryness] = useState(0.78);
  const [spreadSensitivity, setSpreadSensitivity] = useState(0.64);
  const [windDirection, setWindDirection] = useState("NE");
  const [timelineStep, setTimelineStep] = useState(0);
  const [run, setRun] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; title: string; description: string } | null>(null);
  const { data: scenarios, loading, error } = useAsyncData(api.listScenarios, []);
  const { data: runHistory, loading: historyLoading, reload: reloadHistory } = useAsyncData(
    () => (scenarioId ? api.listForecastRuns(scenarioId) : Promise.resolve([])),
    [scenarioId],
  );

  const selectedScenario = useMemo(() => scenarios?.find((scenario) => scenario.id === scenarioId) ?? scenarios?.[0], [scenarioId, scenarios]);
  const activeScenarioId = scenarioId || selectedScenario?.id || "";
  const activeSnapshot = run?.snapshots?.[timelineStep] ?? null;

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
      const response = await api.runForecast({
        scenario_id: activeScenarioId,
        steps,
        dryness,
        spread_sensitivity: spreadSensitivity,
        wind_direction: windDirection,
      });
      setRun(response);
      setTimelineStep(0);
      setMessage({
        tone: "success",
        title: "Forecast complete",
        description: `${response.snapshots?.length ?? 0} snapshots generated and stored for this scenario.`,
      });
      await reloadHistory();
    } catch (err) {
      setMessage({
        tone: "error",
        title: "Forecast failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <LoadingState label="Loading forecast workspace..." />;
  if (error || !scenarios) return <EmptyState title="Forecast workspace unavailable" description={error ?? "Could not load scenarios."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 3 - Forecast"
        title="Spread forecast"
        description="Project how ignition pressure may move across the hillside over time. Dryness, wind, and spread sensitivity stay explicit so the forecast remains interpretable."
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-50">
            {running ? "Running..." : "Run forecast"}
          </button>
        }
      />

      {message ? <Notice tone={message.tone} title={message.title} description={message.description} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SectionPanel title="Forecast inputs" subtitle="Set the weather and spread assumptions before running the forecast">
            <div className="grid gap-4 lg:grid-cols-5">
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
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Steps</label>
                <input type="number" min={2} max={12} value={steps} onChange={(event) => setSteps(Number(event.target.value))} className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Dryness</label>
                <input type="number" step="0.01" min={0} max={1} value={dryness} onChange={(event) => setDryness(Number(event.target.value))} className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Sensitivity</label>
                <input type="number" step="0.01" min={0} max={1} value={spreadSensitivity} onChange={(event) => setSpreadSensitivity(Number(event.target.value))} className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Wind</label>
                <select value={windDirection} onChange={(event) => setWindDirection(event.target.value)} className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none">
                  {["N", "S", "E", "W", "NE", "NW", "SE", "SW"].map((direction) => (
                    <option key={direction} value={direction}>
                      {direction}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </SectionPanel>

          {run ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricTile label="Peak ignition" value={String(run.summary.peak_ignited_cells)} hint={`Containment outlook: ${run.summary.containment_outlook}`} />
                <MetricTile label="Final affected" value={String(run.summary.final_affected_cells)} hint={`Threshold step: ${run.summary.time_to_threshold ?? "not reached"}`} />
                <MetricTile label="Timeline" value={`${timelineStep} / ${(run.snapshots?.length ?? 1) - 1}`} hint={`Run ${run.id.slice(0, 8)}`} />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
                <SectionPanel title="Spread snapshots" subtitle="Step through the projected hillside state one time step at a time">
                  <ScenarioGrid grid={activeSnapshot?.grid ?? selectedScenario?.grid ?? []} />
                  <input
                    type="range"
                    min={0}
                    max={(run.snapshots?.length ?? 1) - 1}
                    value={timelineStep}
                    onChange={(event) => setTimelineStep(Number(event.target.value))}
                    className="mt-5 w-full accent-qp-cyan"
                  />
                  <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
                    <span>Step {timelineStep}</span>
                    {activeSnapshot ? <StatusPill label={`${activeSnapshot.metrics.ignited_cells} ignited`} tone="warn" /> : null}
                  </div>
                </SectionPanel>

                <SectionPanel title="Forecast diagnostics" subtitle="Shift-kernel metrics included as supporting evidence for forecast execution quality">
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-border bg-white/80 p-4">
                      <p className="text-[13px] font-semibold">Baseline shift circuit</p>
                      <p className="mt-2 text-[12px] text-muted-foreground">
                        Depth {run.diagnostics.baseline_shift.depth} • 2Q gates {run.diagnostics.baseline_shift.two_qubit_gate_count}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-white/80 p-4">
                      <p className="text-[13px] font-semibold">Optimized shift circuit</p>
                      <p className="mt-2 text-[12px] text-muted-foreground">
                        Depth {run.diagnostics.optimized_shift.depth} • 2Q gates {run.diagnostics.optimized_shift.two_qubit_gate_count}
                      </p>
                    </div>
                    <p className="text-[12px] leading-5 text-muted-foreground">{run.diagnostics.summary}</p>
                  </div>
                </SectionPanel>
              </div>

              <SectionPanel title="Continue workflow" subtitle="Move to intervention planning or generate a report with this forecast run.">
                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/optimize?scenario=${activeScenarioId}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Optimize
                  </Link>
                  <Link to={`/app/reports?scenario=${activeScenarioId}&forecast=${run.id}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Report with this run
                  </Link>
                </div>
              </SectionPanel>
            </>
          ) : (
            <EmptyState
              title="No forecast run yet"
              description="Run a forecast to inspect projected spread snapshots, threshold timing, and the diagnostic support layer behind the simulation."
            />
          )}
        </div>

        <SectionPanel title="Recent forecasts" subtitle={historyLoading ? "Loading scenario history..." : "Saved spread forecasts for this scenario"}>
          <div className="space-y-3">
            {(runHistory ?? []).length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No forecast runs saved for this scenario yet.</p>
            ) : (
              (runHistory ?? []).slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setRun(item);
                    setTimelineStep(0);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left ${run?.id === item.id ? "border-qp-cyan bg-cyan-50/40" : "border-border bg-white/80"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold">{item.id.slice(0, 8)}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <StatusPill label={item.summary?.containment_outlook ?? item.status} tone="accent" />
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
