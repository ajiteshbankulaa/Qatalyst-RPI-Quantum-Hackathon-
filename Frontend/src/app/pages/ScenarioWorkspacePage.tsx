import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, Play, Save } from "lucide-react";

import { api } from "../api";
import { EmptyState, LoadingState, PageHeader, ScenarioGrid, SectionPanel, StatusPill } from "../components/product";
import { blankGrid, CELL_OPTIONS } from "../scenarioUtils";
import type { CellState, ScenarioPayload } from "../types";

const defaultPayload = (): ScenarioPayload => ({
  name: "New wildfire scenario",
  domain: "wildfire",
  status: "draft",
  description: "Editable wildfire resilience grid.",
  grid: blankGrid(),
  metadata_json: { region: "Unassigned", owner: "Wildfire West" },
  constraints_json: { intervention_budget_k: 10, crew_limit: 3, time_horizon_hours: 72 },
  objectives_json: { primary: "minimize propagated ignition exposure" },
});

export function ScenarioWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<ScenarioPayload>(defaultPayload);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [brushState, setBrushState] = useState<CellState>("dry_brush");
  const [scenarioId, setScenarioId] = useState<string | null>(id ?? null);
  const [scenarioVersion, setScenarioVersion] = useState<number | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const scenario = await api.getScenario(id);
        if (cancelled) return;
        setScenarioId(scenario.id);
        setScenarioVersion(scenario.version);
        setPayload({
          name: scenario.name,
          domain: scenario.domain,
          status: scenario.status,
          description: scenario.description,
          grid: scenario.grid,
          metadata_json: scenario.metadata_json,
          constraints_json: scenario.constraints_json,
          objectives_json: scenario.objectives_json,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load scenario");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const selectedState = useMemo(
    () => (selectedCell ? payload.grid[selectedCell[0]][selectedCell[1]] : null),
    [payload.grid, selectedCell],
  );

  function updateGridCell(row: number, col: number) {
    setSelectedCell([row, col]);
    setPayload((current) => ({
      ...current,
      grid: current.grid.map((gridRow, rowIndex) =>
        gridRow.map((cell, colIndex) => (rowIndex === row && colIndex === col ? brushState : cell)),
      ),
    }));
  }

  async function saveScenario() {
    setSaving(true);
    setError(null);
    try {
      const saved = scenarioId ? await api.updateScenario(scenarioId, payload) : await api.createScenario(payload);
      setScenarioId(saved.id);
      setScenarioVersion(saved.version);
      if (!scenarioId) {
        navigate(`/app/scenarios/${saved.id}`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scenario");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading scenario workspace..." />;
  if (error && !scenarioId) {
    return <EmptyState title="Scenario unavailable" description={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/app/scenarios" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to scenarios
        </Link>
        <div className="flex items-center gap-2">
          {scenarioVersion ? <StatusPill label={`v${scenarioVersion}`} tone="accent" /> : null}
          <button
            onClick={() => void saveScenario()}
            disabled={saving}
            className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] font-medium text-foreground"
          >
            <span className="inline-flex items-center gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save scenario"}
            </span>
          </button>
          {scenarioId ? (
            <Link to={`/app/risk?scenario=${scenarioId}`} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white">
              <span className="inline-flex items-center gap-2">
                <Play className="h-4 w-4" /> Run workflow
              </span>
            </Link>
          ) : null}
        </div>
      </div>

      <PageHeader
        eyebrow="Scenario setup"
        title={payload.name}
        description="Edit the constrained wildfire grid, intervention budget, and planning objective. These settings feed the risk, forecast, optimize, benchmark, and report modules."
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <SectionPanel title="Scenario controls" subtitle="Metadata, constraints, and objectives">
          <div className="space-y-4 text-[13px]">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Name</label>
              <input
                value={payload.name}
                onChange={(event) => setPayload((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-border bg-white px-3 py-2.5 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Description</label>
              <textarea
                value={payload.description}
                onChange={(event) => setPayload((current) => ({ ...current, description: event.target.value }))}
                className="min-h-[90px] w-full rounded-2xl border border-border bg-white px-3 py-2.5 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Budget K</label>
                <input
                  type="number"
                  value={String(payload.constraints_json.intervention_budget_k ?? 10)}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      constraints_json: { ...current.constraints_json, intervention_budget_k: Number(event.target.value) },
                    }))
                  }
                  className="w-full rounded-2xl border border-border bg-white px-3 py-2.5 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Horizon</label>
                <input
                  type="number"
                  value={String(payload.constraints_json.time_horizon_hours ?? 72)}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      constraints_json: { ...current.constraints_json, time_horizon_hours: Number(event.target.value) },
                    }))
                  }
                  className="w-full rounded-2xl border border-border bg-white px-3 py-2.5 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Primary objective</label>
              <input
                value={String(payload.objectives_json.primary ?? "")}
                onChange={(event) =>
                  setPayload((current) => ({
                    ...current,
                    objectives_json: { ...current.objectives_json, primary: event.target.value },
                  }))
                }
                className="w-full rounded-2xl border border-border bg-white px-3 py-2.5 outline-none"
              />
            </div>
          </div>
        </SectionPanel>

        <SectionPanel title="10x10 wildfire grid" subtitle="Brush directly onto the scenario state. Every save persists the grid to the backend.">
          <ScenarioGrid grid={payload.grid} selected={selectedCell} editable onSelect={updateGridCell} brushState={brushState} />
        </SectionPanel>

        <SectionPanel title="Brush and inspection" subtitle="Choose a cell state, then paint or inspect the selected position.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CELL_OPTIONS.map((state) => (
                <button
                  key={state}
                  onClick={() => setBrushState(state)}
                  className={`rounded-full px-3 py-1.5 text-[12px] ${
                    brushState === state ? "bg-qp-navy text-white" : "border border-border bg-white text-muted-foreground"
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Selected cell</p>
              {selectedCell ? (
                <>
                  <p className="mt-3 text-[16px] font-semibold">
                    Row {selectedCell[0] + 1}, Col {selectedCell[1] + 1}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">State: {selectedState}</p>
                </>
              ) : (
                <p className="mt-3 text-[13px] text-muted-foreground">Select a cell to inspect it.</p>
              )}
            </div>
            {scenarioId ? (
              <div className="rounded-2xl border border-border bg-white/80 p-4 text-[12px] leading-5 text-muted-foreground">
                <p className="font-medium text-foreground">Workflow shortcuts</p>
                <div className="mt-3 space-y-2">
                  <Link to={`/app/risk?scenario=${scenarioId}`} className="block hover:text-foreground">
                    Run risk comparison
                  </Link>
                  <Link to={`/app/forecast?scenario=${scenarioId}`} className="block hover:text-foreground">
                    Forecast spread pressure
                  </Link>
                  <Link to={`/app/optimize?scenario=${scenarioId}`} className="block hover:text-foreground">
                    Optimize interventions
                  </Link>
                  <Link to={`/app/benchmarks?scenario=${scenarioId}`} className="block hover:text-foreground">
                    Launch compiler-aware benchmark
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
