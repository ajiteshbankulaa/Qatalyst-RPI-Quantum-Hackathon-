import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, Notice, PageHeader, SectionPanel, SimulatorBanner, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function BenchmarksPage() {
  const [params] = useSearchParams();
  const [scenarioId, setScenarioId] = useState(params.get("scenario") ?? "");
  const [latestRun, setLatestRun] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; title: string; description: string } | null>(null);
  const { data: scenarios, loading: scenariosLoading, error: scenariosError } = useAsyncData(api.listScenarios, []);
  const { data: integrations, loading: integrationsLoading } = useAsyncData(api.integrations, []);
  const { data: benchmarks, loading: benchmarksLoading, reload: reloadBenchmarks } = useAsyncData(
    () => (scenarioId ? api.listBenchmarks(scenarioId) : Promise.resolve([])),
    [scenarioId],
  );

  const selectedScenario = useMemo(() => scenarios?.find((scenario) => scenario.id === scenarioId) ?? scenarios?.[0], [scenarios, scenarioId]);
  const activeScenarioId = scenarioId || selectedScenario?.id || "";

  useEffect(() => {
    if (selectedScenario && !scenarioId) {
      setScenarioId(selectedScenario.id);
    }
  }, [scenarioId, selectedScenario]);

  useEffect(() => {
    if (benchmarks && benchmarks.length > 0 && !latestRun) {
      setLatestRun(benchmarks[0]);
    }
  }, [benchmarks, latestRun]);

  const scatterData =
    (latestRun?.results?.strategy_results as Array<any> | undefined)?.map((item) => ({
      x: item.compiled_metrics.depth,
      y: Number(((item.output_quality.approximation_ratio ?? 0) * 100).toFixed(1)),
      label: item.strategy_label ?? item.strategy,
      environment: item.environment,
      gates: item.compiled_metrics.total_gates,
      twoQ: item.compiled_metrics.two_qubit_gate_count,
    })) ?? [];

  async function execute() {
    if (!activeScenarioId) return;
    setRunning(true);
    setMessage(null);
    try {
      const response = await api.runBenchmark({ scenario_id: activeScenarioId });
      setLatestRun(response);
      setMessage({
        tone: "success",
        title: "Benchmark complete",
        description: response.summary?.recommendation ?? "Compiled benchmark results are available.",
      });
      await reloadBenchmarks();
    } catch (err) {
      setMessage({
        tone: "error",
        title: "Benchmark failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setRunning(false);
    }
  }

  if (scenariosLoading || integrationsLoading || benchmarksLoading) return <LoadingState label="Loading benchmark workspace..." />;
  if (scenariosError || !scenarios || !integrations || !benchmarks) {
    return <EmptyState title="Benchmark workspace unavailable" description={scenariosError ?? "Could not load benchmark data."} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 5 - Benchmarks"
        title="Compiler-aware benchmarking"
        description="Benchmark the reduced intervention workload through qBraid-centered compilation strategies and compare output quality against compiled cost."
        actions={
          <button onClick={() => void execute()} disabled={!activeScenarioId || running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-50">
            {running ? "Running benchmark..." : "Run benchmark"}
          </button>
        }
      />

      <SimulatorBanner simulatorOnly={integrations.simulator_only} qbraidReady={integrations.qbraid_ready} />
      {message ? <Notice tone={message.tone} title={message.title} description={message.description} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <SectionPanel>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Scenario</label>
                <select value={activeScenarioId} onChange={(event) => setScenarioId(event.target.value)} className="min-w-[320px] rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none">
                  {scenarios.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusPill label={integrations.qbraid_ready ? "qBraid ready" : "qBraid degraded"} tone={integrations.qbraid_ready ? "good" : "warn"} />
                <StatusPill label={integrations.hardware_available ? "IBM ready" : "Simulator-only"} tone={integrations.hardware_available ? "good" : "warn"} />
              </div>
            </div>
          </SectionPanel>

          {latestRun ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricTile label="Run status" value={latestRun.status} hint={`Run ${latestRun.id.slice(0, 8)}`} />
                <MetricTile label="Best strategy" value={latestRun.summary?.best_strategy ?? "n/a"} hint={latestRun.summary?.best_environment ?? "No best environment recorded"} />
                <MetricTile label="Recommendation" value={latestRun.summary?.recommended_mode ?? latestRun.summary?.recommendation ?? "n/a"} hint={latestRun.availability?.mode ?? "unknown availability"} />
              </div>

              <SectionPanel title="Quality vs cost" subtitle="Lower depth is cheaper. Higher approximation ratio is better. Marker size reflects total gate count.">
                {latestRun.status === "complete" && scatterData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 12, right: 24, bottom: 28, left: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                          <XAxis dataKey="x" name="Compiled depth" tick={{ fontSize: 11 }} label={{ value: "Compiled depth", position: "bottom", fontSize: 11, fill: "#636882" }} />
                          <YAxis dataKey="y" name="Approximation ratio (%)" tick={{ fontSize: 11 }} label={{ value: "Approx. ratio (%)", angle: -90, position: "insideLeft", fontSize: 11, fill: "#636882" }} />
                          <ZAxis dataKey="gates" range={[60, 220]} name="Total gates" />
                          <Tooltip
                            cursor={{ strokeDasharray: "4 4" }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.[0]) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="rounded-xl border border-border bg-white p-3 text-[12px] shadow-lg">
                                  <p className="font-semibold">{d.label}</p>
                                  <p className="text-muted-foreground">{d.environment}</p>
                                  <p className="mt-1">Depth: {d.x} • Approx. ratio: {d.y}%</p>
                                  <p>Total gates: {d.gates} • 2Q gates: {d.twoQ}</p>
                                </div>
                              );
                            }}
                          />
                          <Scatter data={scatterData} fill="#06b6d4" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-border">
                      <table className="w-full bg-white/90 text-[12px]">
                        <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3">Strategy</th>
                            <th className="px-4 py-3">Environment</th>
                            <th className="px-4 py-3 text-right">Depth</th>
                            <th className="px-4 py-3 text-right">2Q gates</th>
                            <th className="px-4 py-3 text-right">Approx. ratio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(latestRun.results?.strategy_results as Array<any>).map((item, index) => (
                            <tr key={`${item.strategy}-${item.environment}-${index}`} className="border-t border-border">
                              <td className="px-4 py-3 font-medium">{item.strategy_label ?? item.strategy}</td>
                              <td className="px-4 py-3 text-muted-foreground">{item.environment}</td>
                              <td className="px-4 py-3 text-right font-mono">{item.compiled_metrics.depth}</td>
                              <td className="px-4 py-3 text-right font-mono">{item.compiled_metrics.two_qubit_gate_count}</td>
                              <td className="px-4 py-3 text-right font-mono">
                                {item.output_quality?.approximation_ratio != null ? `${(item.output_quality.approximation_ratio * 100).toFixed(1)}%` : "n/a"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <Notice tone="warn" title="Compiled benchmark results unavailable" description={latestRun.results?.note ?? "This run did not produce a complete strategy comparison."} />
                )}
              </SectionPanel>

              <SectionPanel title="Continue workflow" subtitle="Use this run in reporting or inspect the full benchmark detail.">
                <div className="flex flex-wrap gap-2">
                  <Link to={`/app/benchmarks/${latestRun.id}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Open detail
                  </Link>
                  <Link to={`/app/reports?scenario=${activeScenarioId}&benchmark=${latestRun.id}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
                    Report with this run
                  </Link>
                </div>
              </SectionPanel>
            </>
          ) : (
            <EmptyState
              title="No benchmark run yet"
              description="Run a benchmark to compare compilation strategy quality against compiled resource cost for the reduced intervention workload."
            />
          )}
        </div>

        <SectionPanel title="Run history" subtitle="Persisted benchmark records for this scenario">
          <div className="space-y-3">
            {benchmarks.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No benchmark runs saved for this scenario yet.</p>
            ) : (
              benchmarks.slice(0, 10).map((run) => (
                <button
                  key={run.id}
                  onClick={() => setLatestRun(run)}
                  className={`w-full rounded-2xl border p-4 text-left ${latestRun?.id === run.id ? "border-qp-cyan bg-cyan-50/40" : "border-border bg-white/80"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-semibold">{run.id.slice(0, 8)}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">{new Date(run.created_at).toLocaleString()}</p>
                    </div>
                    <StatusPill label={run.status} tone={run.status === "complete" ? "good" : "warn"} />
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
