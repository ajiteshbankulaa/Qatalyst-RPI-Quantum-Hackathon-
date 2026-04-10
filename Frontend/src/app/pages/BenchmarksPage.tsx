import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { api } from "../api";
import { EmptyState, LoadingState, PageHeader, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function BenchmarksPage() {
  const [params] = useSearchParams();
  const [scenarioId, setScenarioId] = useState(params.get("scenario") ?? "");
  const [latestRun, setLatestRun] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [scenarios, benchmarks, integrations] = await Promise.all([api.listScenarios(), api.listBenchmarks(), api.integrations()]);
      return { scenarios, benchmarks, integrations };
    },
    [],
  );

  const selectedScenario = useMemo(() => data?.scenarios.find((scenario) => scenario.id === scenarioId) ?? data?.scenarios[0], [data?.scenarios, scenarioId]);
  const activeScenarioId = scenarioId || selectedScenario?.id || "";
  const scatterData =
    (latestRun?.results?.strategy_results as Array<any> | undefined)?.map((item) => ({
      x: item.compiled_metrics.depth,
      y: item.output_quality.approximation_ratio,
      label: `${item.strategy} / ${item.environment}`,
    })) ?? [];

  async function execute() {
    if (!activeScenarioId) return;
    setRunning(true);
    try {
      const response = await api.runBenchmark({ scenario_id: activeScenarioId });
      setLatestRun(response);
      await reload();
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <LoadingState label="Loading benchmark workspace..." />;
  if (error || !data) return <EmptyState title="Benchmark workspace unavailable" description={error ?? "Could not load benchmark data."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Benchmarks"
        title="Compiler-aware benchmarking"
        description="This is the product’s execution-integrity layer. Reduced intervention workloads are benchmarked through a qBraid-centered workflow when the environment is capable, and clearly labeled as degraded when it is not."
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white">
            {running ? "Running..." : "Run benchmark"}
          </button>
        }
      />

      <SectionPanel>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <select value={activeScenarioId} onChange={(event) => setScenarioId(event.target.value)} className="min-w-[320px] rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none">
            {data.scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <StatusPill label={data.integrations.qbraid_ready ? "qBraid SDK detected" : "qBraid missing"} tone={data.integrations.qbraid_ready ? "good" : "warn"} />
            <StatusPill label={data.integrations.hardware_available ? "IBM ready" : "Simulator-only"} tone={data.integrations.hardware_available ? "good" : "warn"} />
          </div>
        </div>
      </SectionPanel>

      {latestRun ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionPanel title="Latest benchmark run" subtitle={latestRun.summary.recommendation}>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={`Run ${latestRun.id}`} tone="accent" />
                <StatusPill label={latestRun.status} tone={latestRun.status === "complete" ? "good" : "warn"} />
              </div>
              {latestRun.status === "complete" ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
                      <XAxis dataKey="x" name="Depth" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="y" name="Approx. ratio" tick={{ fontSize: 11 }} />
                      <Tooltip cursor={{ strokeDasharray: "4 4" }} />
                      <Scatter data={scatterData} fill="#06b6d4" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[12px] leading-5 text-amber-900">
                  {latestRun.results.note}
                </p>
              )}
            </div>
          </SectionPanel>

          <SectionPanel title="Run history" subtitle="Persisted benchmark records from the backend">
            <div className="space-y-3">
              {data.benchmarks.map((run) => (
                <Link key={run.id} to={`/app/benchmarks/${run.id}`} className="block rounded-2xl border border-border bg-white/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold">{run.id}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{run.summary?.recommendation ?? "No recommendation available"}</p>
                    </div>
                    <StatusPill label={run.status} tone={run.status === "complete" ? "good" : "warn"} />
                  </div>
                </Link>
              ))}
            </div>
          </SectionPanel>
        </div>
      ) : (
        <EmptyState
          title="No benchmark executed in this session"
          description="Launch a benchmark to compare compilation strategy quality versus compiled resource cost for the reduced intervention workload."
        />
      )}
    </div>
  );
}
