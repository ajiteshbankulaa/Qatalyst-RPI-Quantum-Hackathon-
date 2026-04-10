import { Link } from "react-router";
import { ArrowRight, Cpu, FileText, Flame, Layers, Target, TrendingUp } from "lucide-react";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, PageHeader, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function DashboardPage() {
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [overview, scenarios, benchmarks, integrations] = await Promise.all([
        api.overview(),
        api.listScenarios(),
        api.listBenchmarks(),
        api.integrations(),
      ]);
      return { overview, scenarios, benchmarks, integrations };
    },
    [],
  );

  if (loading) return <LoadingState label="Loading overview..." />;
  if (error || !data) {
    return (
      <EmptyState
        title="Overview unavailable"
        description={error ?? "The dashboard could not be loaded."}
        action={
          <button onClick={() => void reload()} className="rounded-2xl bg-qp-navy px-4 py-2 text-[13px] text-white">
            Retry
          </button>
        }
      />
    );
  }

  const { overview, scenarios, benchmarks, integrations } = data;
  const activeScenarios = scenarios.filter((scenario) => scenario.status === "active").length;
  const degradedBenchmarks = benchmarks.filter((run) => run.status !== "complete").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Portfolio"
        title="Spatial decision intelligence command center"
        description="Track the current wildfire scenario portfolio, latest solver runs, and whether the benchmark pipeline is operating in simulator-only or hardware-capable mode."
        actions={
          <Link to="/app/scenarios/new" className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white">
            New scenario
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Scenarios" value={String(overview.portfolio.scenario_count)} hint={`${activeScenarios} active wildfire setups`} />
        <MetricTile label="Risk runs" value={String(overview.portfolio.risk_runs)} hint="Classical, quantum, and hybrid comparisons" />
        <MetricTile label="Benchmarks" value={String(overview.portfolio.benchmark_runs)} hint={`${degradedBenchmarks} degraded due to missing compiler/hardware capability`} />
        <MetricTile label="Reports" value={String(overview.portfolio.report_count)} hint="Decision artifacts ready for export" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <SectionPanel
          title="Current product workflow"
          subtitle="The platform is organized around one execution chain: scenario setup, risk scoring, propagation forecast, intervention optimization, benchmark integrity, and report output."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { icon: Layers, title: "Scenario setup", text: "Persisted 10x10 wildfire grids with constraints, objectives, and versioned edits.", href: "/app/scenarios" },
              { icon: TrendingUp, title: "Risk + forecast", text: "Compare solver modes on the same scenario features and project spread pressure over time.", href: "/app/risk" },
              { icon: Target, title: "Optimize + benchmark", text: "Pair full-grid intervention planning with reduced-subproblem quantum studies and benchmark integrity.", href: "/app/optimize" },
            ].map((item) => (
              <Link key={item.title} to={item.href} className="rounded-2xl border border-border bg-white/80 p-4 transition-transform hover:-translate-y-0.5">
                <item.icon className="h-5 w-5 text-qp-cyan" />
                <h3 className="mt-4 text-[15px] font-semibold">{item.title}</h3>
                <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{item.text}</p>
              </Link>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Execution posture" subtitle="Current backend capability state.">
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Quantum benchmarking</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[15px] font-semibold">qBraid-centered pipeline</p>
                <StatusPill label={integrations.qbraid_ready ? "SDK detected" : "Degraded"} tone={integrations.qbraid_ready ? "good" : "warn"} />
              </div>
              <p className="mt-2 text-[12px] leading-5 text-muted-foreground">
                {integrations.qbraid_ready
                  ? "Compiler-aware benchmarking can execute when Qiskit workloads are available."
                  : "Runs remain explicitly degraded until qBraid and Qiskit are installed locally."}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white/80 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Execution environments</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill label="Ideal simulator" tone="good" />
                <StatusPill label="Noisy simulator" tone="accent" />
                <StatusPill label={integrations.hardware_available ? "IBM hardware configured" : "IBM hardware unavailable"} tone={integrations.hardware_available ? "good" : "warn"} />
              </div>
            </div>
          </div>
        </SectionPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <SectionPanel title="Recent scenarios" subtitle="Use seeded wildfire scenarios or open the workspace to edit a new grid.">
          <div className="space-y-3">
            {scenarios.slice(0, 5).map((scenario) => (
              <Link
                key={scenario.id}
                to={`/app/scenarios/${scenario.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-white/80 px-4 py-3 transition-colors hover:bg-white"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-red-50 p-2 text-red-500">
                    <Flame className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">{scenario.name}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      v{scenario.version} • {scenario.domain} • {scenario.status}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel title="Recent benchmark and report activity" subtitle="Runs are sourced from the backend, not seeded UI-only placeholders.">
          <div className="space-y-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-qp-cyan" />
                <p className="text-[13px] font-semibold">Benchmarks</p>
              </div>
              <div className="space-y-2">
                {benchmarks.slice(0, 3).map((run) => (
                  <Link key={run.id} to={`/app/benchmarks/${run.id}`} className="flex items-center justify-between rounded-2xl border border-border bg-white/80 px-4 py-3">
                    <div>
                      <p className="text-[13px] font-medium">{run.id}</p>
                      <p className="text-[12px] text-muted-foreground">{run.summary?.recommendation ?? "No recommendation available"}</p>
                    </div>
                    <StatusPill label={run.status} tone={run.status === "complete" ? "good" : "warn"} />
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-qp-violet" />
                <p className="text-[13px] font-semibold">Reports</p>
              </div>
              <div className="space-y-2">
                {(overview.recent.reports as Array<{ id: string; title: string; created_at: string }>).slice(0, 3).map((report) => (
                  <div key={report.id} className="rounded-2xl border border-border bg-white/80 px-4 py-3">
                    <p className="text-[13px] font-medium">{report.title}</p>
                    <p className="text-[12px] text-muted-foreground">{new Date(report.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
