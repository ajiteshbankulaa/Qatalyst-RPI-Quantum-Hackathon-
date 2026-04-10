import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, PageHeader, ScenarioGrid, SectionPanel, StatusPill } from "../components/product";
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
  const { data: scenarios, loading, error } = useAsyncData(api.listScenarios, []);

  const selectedScenario = useMemo(() => scenarios?.find((scenario) => scenario.id === scenarioId) ?? scenarios?.[0], [scenarioId, scenarios]);
  const activeScenarioId = scenarioId || selectedScenario?.id || "";
  const activeSnapshot = run?.snapshots?.[timelineStep] ?? null;

  async function execute() {
    if (!activeScenarioId) return;
    setRunning(true);
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
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <LoadingState label="Loading forecast workspace..." />;
  if (error || !scenarios) return <EmptyState title="Forecast workspace unavailable" description={error ?? "Could not load scenarios."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forecast"
        title="Propagation forecast"
        description="Project wildfire-like spread over discrete steps with explicit dryness, wind, and sensitivity settings. Shift-circuit diagnostics are included as supporting hardware-aware diagnostics, not as a disconnected academic demo."
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white">
            {running ? "Running..." : "Run forecast"}
          </button>
        }
      />

      <SectionPanel>
        <div className="grid gap-4 lg:grid-cols-5">
          <select value={activeScenarioId} onChange={(event) => setScenarioId(event.target.value)} className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none">
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
          <input type="number" min={2} max={12} value={steps} onChange={(event) => setSteps(Number(event.target.value))} className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
          <input type="number" step="0.01" min={0} max={1} value={dryness} onChange={(event) => setDryness(Number(event.target.value))} className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
          <input type="number" step="0.01" min={0} max={1} value={spreadSensitivity} onChange={(event) => setSpreadSensitivity(Number(event.target.value))} className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none" />
          <select value={windDirection} onChange={(event) => setWindDirection(event.target.value)} className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none">
            {["N", "S", "E", "W", "NE", "NW", "SE", "SW"].map((direction) => (
              <option key={direction} value={direction}>
                Wind {direction}
              </option>
            ))}
          </select>
        </div>
      </SectionPanel>

      {run ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricTile label="Peak ignition" value={String(run.summary.peak_ignited_cells)} hint={`Containment outlook: ${run.summary.containment_outlook}`} />
            <MetricTile label="Final affected" value={String(run.summary.final_affected_cells)} hint={`Threshold step: ${run.summary.time_to_threshold ?? "not reached"}`} />
            <MetricTile label="Timeline step" value={String(timelineStep)} hint={`Run ${run.id}`} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
            <SectionPanel title="Spread snapshots" subtitle="Timeline-controlled wildfire projection">
              <ScenarioGrid grid={activeSnapshot?.grid ?? selectedScenario?.grid ?? []} />
              <input
                type="range"
                min={0}
                max={(run.snapshots?.length ?? 1) - 1}
                value={timelineStep}
                onChange={(event) => setTimelineStep(Number(event.target.value))}
                className="mt-5 w-full"
              />
              <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
                <span>Step {timelineStep}</span>
                {activeSnapshot ? <StatusPill label={`${activeSnapshot.metrics.ignited_cells} ignited`} tone="warn" /> : null}
              </div>
            </SectionPanel>

            <SectionPanel title="Forecast diagnostics" subtitle="Hardware-aware support metrics for grid-shift logic">
              <div className="grid gap-3">
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
        </>
      ) : (
        <EmptyState
          title="No forecast run yet"
          description="Run a propagation forecast to inspect snapshot timelines, ignition pressure, and hardware-aware shift diagnostics."
        />
      )}
    </div>
  );
}
