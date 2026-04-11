import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Copy, Plus, Search, Trash2 } from "lucide-react";

import { api } from "../api";
import { EmptyState, LoadingState, Notice, PageHeader, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function ScenariosPage() {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; title: string; description: string } | null>(null);
  const { data: scenarios, loading, error, reload } = useAsyncData(api.listScenarios, []);

  const filtered = useMemo(() => {
    if (!scenarios) return [];
    const lower = query.toLowerCase();
    return scenarios.filter((scenario) => scenario.name.toLowerCase().includes(lower) || scenario.status.toLowerCase().includes(lower));
  }, [query, scenarios]);

  async function archiveScenario(id: string) {
    if (!window.confirm("Archive this scenario?")) return;
    try {
      await api.updateScenario(id, { archived: true, status: "archived" });
      setMessage({ tone: "success", title: "Scenario archived", description: "The scenario remains available in history and can still be opened." });
      await reload();
    } catch (err) {
      setMessage({ tone: "error", title: "Archive failed", description: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  async function duplicateScenario(id: string) {
    const scenario = scenarios?.find((item) => item.id === id);
    if (!scenario) return;
    try {
      await api.createScenario({
        name: `${scenario.name} copy`,
        domain: scenario.domain,
        status: "draft",
        description: scenario.description,
        grid: scenario.grid,
        metadata_json: scenario.metadata_json,
        constraints_json: scenario.constraints_json,
        objectives_json: scenario.objectives_json,
      });
      setMessage({ tone: "success", title: "Scenario duplicated", description: "A draft copy has been added to the library." });
      await reload();
    } catch (err) {
      setMessage({ tone: "error", title: "Duplicate failed", description: err instanceof Error ? err.message : "Unknown error" });
    }
  }

  if (loading) return <LoadingState label="Loading scenarios..." />;
  if (error || !scenarios) {
    return (
      <EmptyState
        title="Scenario library unavailable"
        description={error ?? "The backend did not return scenarios."}
        action={
          <button onClick={() => void reload()} className="rounded-2xl bg-qp-navy px-4 py-2 text-[13px] text-white">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scenario library"
        title="Wildfire planning scenarios"
        description="Manage the saved hillside cases that feed the risk map, spread forecast, intervention plan, benchmark integrity run, and final report."
        actions={
          <Link to="/app/scenarios/new" className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white">
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> New scenario
            </span>
          </Link>
        }
      />

      {message ? <Notice tone={message.tone} title={message.title} description={message.description} /> : null}

      <SectionPanel>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-[380px] items-center gap-2 rounded-2xl border border-border bg-white px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or status"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-[12px] text-muted-foreground">{filtered.length} scenarios available</p>
        </div>
      </SectionPanel>

      <SectionPanel title="Scenario records" subtitle="Each record captures the minimum information needed to run the full wildfire planning workflow.">
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full bg-white/90">
            <thead className="bg-slate-50">
              <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-4 py-3">Scenario</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Constraints</th>
                <th className="px-4 py-3">Objective</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((scenario) => (
                <tr key={scenario.id} className="border-t border-border text-[13px]">
                  <td className="px-4 py-4">
                    <Link to={`/app/scenarios/${scenario.id}`} className="font-medium text-foreground hover:text-qp-cyan">
                      {scenario.name}
                    </Link>
                    <p className="mt-1 text-[12px] text-muted-foreground">{scenario.description}</p>
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">v{scenario.version}</td>
                  <td className="px-4 py-4 text-muted-foreground">
                    K={(scenario.constraints_json.intervention_budget_k as number | undefined) ?? "n/a"} • horizon{" "}
                    {(scenario.constraints_json.time_horizon_hours as number | undefined) ?? "n/a"}h
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">{(scenario.objectives_json.primary as string | undefined) ?? "No primary objective"}</td>
                  <td className="px-4 py-4">
                    <StatusPill label={scenario.status} tone={scenario.status === "active" ? "good" : scenario.status === "archived" ? "neutral" : "accent"} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => void duplicateScenario(scenario.id)} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button onClick={() => void archiveScenario(scenario.id)} className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
}
