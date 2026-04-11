import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, Play, Save, Trash2 } from "lucide-react";

import { api } from "../api";
import { EmptyState, LoadingState, Notice, PageHeader, ScenarioGrid, SectionPanel, StatusPill } from "../components/product";
import { blankGrid, CELL_OPTIONS } from "../scenarioUtils";
import type { CellState, ScenarioPayload } from "../types";

const templates: Array<{ key: string; label: string; payload: ScenarioPayload }> = [
  {
    key: "base",
    label: "Base wildfire grid",
    payload: {
      name: "Base wildfire scenario",
      domain: "wildfire",
      status: "draft",
      description: "Balanced 10x10 wildfire planning grid.",
      grid: blankGrid(),
      metadata_json: { region: "Unassigned", owner: "Wildfire West" },
      constraints_json: { intervention_budget_k: 10, crew_limit: 3, time_horizon_hours: 72, spread_sensitivity: 0.64 },
      objectives_json: { primary: "minimize propagated ignition exposure" },
    },
  },
  {
    key: "wind",
    label: "Wind corridor",
    payload: {
      name: "Wind corridor scenario",
      domain: "wildfire",
      status: "draft",
      description: "North-east corridor with elevated fuel continuity.",
      grid: blankGrid().map((row, rowIndex) =>
        row.map((_, colIndex) => {
          if (rowIndex === 1 && colIndex === 1) return "ignition";
          if (rowIndex >= 2 && rowIndex <= 6 && colIndex >= 2 && colIndex <= 7) return "dry_brush";
          if (colIndex === 8) return "protected";
          return "tree";
        }),
      ),
      metadata_json: { region: "Foothill corridor", owner: "Wildfire West" },
      constraints_json: { intervention_budget_k: 8, crew_limit: 2, time_horizon_hours: 48, spread_sensitivity: 0.72 },
      objectives_json: { primary: "protect east perimeter assets" },
    },
  },
  {
    key: "interface",
    label: "Community interface",
    payload: {
      name: "Community interface scenario",
      domain: "wildfire",
      status: "draft",
      description: "Mixed brush and protected edge for intervention planning.",
      grid: blankGrid().map((row, rowIndex) =>
        row.map((_, colIndex) => {
          if (rowIndex === 2 && colIndex === 2) return "ignition";
          if (rowIndex >= 1 && rowIndex <= 6 && colIndex >= 1 && colIndex <= 5) return "dry_brush";
          if (colIndex >= 7) return "protected";
          if (rowIndex === 8 || rowIndex === 9) return "water";
          return "tree";
        }),
      ),
      metadata_json: { region: "Interface zone", owner: "Operations" },
      constraints_json: { intervention_budget_k: 10, crew_limit: 4, time_horizon_hours: 72, spread_sensitivity: 0.58 },
      objectives_json: { primary: "reduce exposure near protected edge" },
    },
  },
];

function clonePayload(payload: ScenarioPayload): ScenarioPayload {
  return JSON.parse(JSON.stringify(payload)) as ScenarioPayload;
}

export function ScenarioWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState<ScenarioPayload>(clonePayload(templates[0].payload));
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ tone: "success" | "error" | "info"; title: string; description: string } | null>(null);
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

  function applyTemplate(templateKey: string) {
    const template = templates.find((item) => item.key === templateKey);
    if (!template) return;
    setPayload(clonePayload(template.payload));
    setSelectedCell(null);
    setStatusMessage({
      tone: "info",
      title: "Template applied",
      description: `${template.label} loaded into the workspace. Save to persist it as a scenario version.`,
    });
  }

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
      setStatusMessage({
        tone: "success",
        title: "Scenario saved",
        description: `Version ${saved.version} is now persisted and available to risk, forecast, optimization, benchmarks, and reports.`,
      });
      if (!scenarioId) {
        navigate(`/app/scenarios/${saved.id}`, { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save scenario";
      setError(message);
      setStatusMessage({ tone: "error", title: "Save failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  async function archiveScenario() {
    if (!scenarioId) return;
    if (!window.confirm("Archive this scenario? It will remain available in history but marked inactive.")) {
      return;
    }
    const updated = await api.updateScenario(scenarioId, { archived: true, status: "archived" });
    setScenarioVersion(updated.version);
    setPayload((current) => ({ ...current, status: updated.status }));
    setStatusMessage({
      tone: "success",
      title: "Scenario archived",
      description: "The scenario remains versioned and retrievable, but it is now marked archived.",
    });
  }

  async function deleteScenario() {
    if (!scenarioId) return;
    if (!window.confirm("Delete this scenario permanently? Existing runs remain in the database but this scenario record will be removed.")) {
      return;
    }
    await api.deleteScenario(scenarioId);
    navigate("/app/scenarios");
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
          <StatusPill label={payload.status} tone={payload.status === "archived" ? "warn" : "neutral"} />
        </div>
      </div>

      <PageHeader
        eyebrow="Step 1 - Scenario setup"
        title={payload.name}
        description="Edit the wildfire grid, budget constraints, and objective settings. Keep the scenario small, explicit, and versioned."
        actions={
          <>
            {scenarioId ? (
              <button onClick={() => void archiveScenario()} className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] font-medium text-foreground">
                Archive
              </button>
            ) : null}
            {scenarioId ? (
              <button onClick={() => void deleteScenario()} className="rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-[13px] font-medium text-red-700">
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" /> Delete
                </span>
              </button>
            ) : null}
            <button
              onClick={() => void saveScenario()}
              disabled={saving}
              className="rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] font-medium text-foreground disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
              </span>
            </button>
            {scenarioId ? (
              <Link to={`/app/risk?scenario=${scenarioId}`} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white">
                <span className="inline-flex items-center gap-2">
                  <Play className="h-4 w-4" /> Continue
                </span>
              </Link>
            ) : null}
          </>
        }
      />

      {statusMessage ? <Notice tone={statusMessage.tone} title={statusMessage.title} description={statusMessage.description} /> : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_300px]">
        <SectionPanel title="Controls" subtitle="Templates, metadata, and constraint inputs">
          <div className="space-y-4 text-[13px]">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Template</label>
              <select onChange={(event) => applyTemplate(event.target.value)} defaultValue="" className="w-full rounded-2xl border border-border bg-white px-3 py-2.5 outline-none">
                <option value="" disabled>
                  Load a template
                </option>
                {templates.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.label}
                  </option>
                ))}
              </select>
            </div>
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
                  min={1}
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
                <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Crews</label>
                <input
                  type="number"
                  min={1}
                  value={String(payload.constraints_json.crew_limit ?? 3)}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      constraints_json: { ...current.constraints_json, crew_limit: Number(event.target.value) },
                    }))
                  }
                  className="w-full rounded-2xl border border-border bg-white px-3 py-2.5 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Horizon (hrs)</label>
                <input
                  type="number"
                  min={1}
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
              <div>
                <label className="mb-1 block text-[12px] font-medium text-muted-foreground">Sensitivity</label>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step="0.01"
                  value={String(payload.constraints_json.spread_sensitivity ?? 0.64)}
                  onChange={(event) =>
                    setPayload((current) => ({
                      ...current,
                      constraints_json: { ...current.constraints_json, spread_sensitivity: Number(event.target.value) },
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

        <SectionPanel title="10x10 wildfire grid" subtitle="Choose a brush, then paint directly onto the scenario.">
          <ScenarioGrid grid={payload.grid} selected={selectedCell} editable onSelect={updateGridCell} brushState={brushState} />
        </SectionPanel>

        <SectionPanel title="Brush and inspector" subtitle="Minimal tools for editing and checking grid cells">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CELL_OPTIONS.map((state) => (
                <button
                  key={state}
                  onClick={() => setBrushState(state)}
                  className={`rounded-full px-3 py-1.5 text-[12px] transition-all ${
                    brushState === state ? "bg-qp-navy text-white shadow-sm" : "border border-border bg-white text-muted-foreground hover:bg-slate-50"
                  }`}
                >
                  {state.replace("_", " ")}
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
                  <p className="mt-1 text-[12px] text-muted-foreground">State: {selectedState?.replace("_", " ")}</p>
                </>
              ) : (
                <p className="mt-3 text-[13px] text-muted-foreground">Select a cell to inspect it.</p>
              )}
            </div>
            {scenarioId ? (
              <div className="rounded-2xl border border-border bg-white/80 p-4">
                <p className="text-[12px] font-medium text-foreground">Next steps</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={`/app/risk?scenario=${scenarioId}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Risk
                  </Link>
                  <Link to={`/app/forecast?scenario=${scenarioId}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Forecast
                  </Link>
                  <Link to={`/app/optimize?scenario=${scenarioId}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Optimize
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
