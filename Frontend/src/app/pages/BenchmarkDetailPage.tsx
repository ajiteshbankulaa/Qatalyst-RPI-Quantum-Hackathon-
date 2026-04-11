import { Link, useParams } from "react-router";
import { ChevronLeft } from "lucide-react";

import { api } from "../api";
import { EmptyState, LoadingState, MetricTile, Notice, PageHeader, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function BenchmarkDetailPage() {
  const { id = "" } = useParams();
  const { data: run, loading, error } = useAsyncData(() => api.getBenchmark(id), [id]);

  if (loading) return <LoadingState label="Loading benchmark detail..." />;
  if (error || !run) return <EmptyState title="Benchmark run unavailable" description={error ?? "Run not found."} />;

  const workload = run.results?.workload;
  const strategyResults = run.results?.strategy_results as Array<any> | undefined;
  const simExecution = run.results?.simulator_execution;

  return (
    <div className="space-y-6">
      <Link to="/app/benchmarks" className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to benchmarks
      </Link>

      <PageHeader
        eyebrow="Benchmark detail"
        title="Compiler-aware benchmark run"
        description={run.summary?.recommendation ?? "Inspect workload scope, compiler strategy outputs, and simulator results."}
      />

      <SectionPanel>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill label={run.status} tone={run.status === "complete" ? "good" : "warn"} />
          <StatusPill label={run.availability?.mode ?? "unknown"} tone={run.availability?.mode === "ready" ? "good" : "warn"} />
          {run.summary?.circuit_type ? <StatusPill label={run.summary.circuit_type} tone="accent" /> : null}
          {run.summary?.qiskit_version ? <StatusPill label={`Qiskit ${run.summary.qiskit_version}`} /> : null}
          {run.summary?.qbraid_version ? <StatusPill label={`qBraid ${run.summary.qbraid_version}`} /> : null}
        </div>
      </SectionPanel>

      {run.status !== "complete" ? (
        <Notice
          tone="warn"
          title={run.status === "degraded" ? "Degraded benchmark" : "Benchmark error"}
          description={run.results?.note ?? "This benchmark did not produce full compiled results."}
        />
      ) : null}

      {workload ? (
        <SectionPanel title="Workload" subtitle="Reduced intervention QAOA subproblem derived from the scenario grid">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <MetricTile label="Problem" value={workload.name ?? "QAOA"} />
            <MetricTile label="Qubits" value={String(workload.problem_size?.num_qubits ?? workload.uncompiled_circuit?.width ?? "n/a")} />
            <MetricTile label="Raw depth" value={String(workload.uncompiled_circuit?.depth ?? "n/a")} />
            <MetricTile label="Raw 2Q gates" value={String(workload.uncompiled_circuit?.two_qubit_gate_count ?? "n/a")} />
            <MetricTile label="Best known cost" value={String(workload.best_known_cost ?? workload.exact_reference_cost ?? "n/a")} />
            <MetricTile label="QAOA expected cost" value={String(workload.qaoa_analytical_reference?.expected_cost ?? workload.qaoa_reference?.expected_cost ?? "n/a")} />
          </div>
        </SectionPanel>
      ) : null}

      {strategyResults && strategyResults.length > 0 ? (
        <SectionPanel title="Strategy comparison" subtitle="Compiled resource metrics and output quality across strategies and environments">
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full bg-white/90 text-[12px]">
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="px-4 py-3">Strategy</th>
                  <th className="px-4 py-3">Environment</th>
                  <th className="px-4 py-3 text-right">Depth</th>
                  <th className="px-4 py-3 text-right">2Q gates</th>
                  <th className="px-4 py-3 text-right">Total gates</th>
                  <th className="px-4 py-3 text-right">Approx. ratio</th>
                  <th className="px-4 py-3 text-right">Success prob.</th>
                </tr>
              </thead>
              <tbody>
                {strategyResults.map((result: any, idx: number) => {
                  const isBest = result.strategy === run.results?.best_strategy && result.environment === run.results?.best_environment;
                  return (
                    <tr key={idx} className={`border-t border-border ${isBest ? "bg-cyan-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.strategy_label ?? result.strategy}</span>
                          {isBest ? <StatusPill label="Best" tone="good" /> : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{result.environment}</td>
                      <td className="px-4 py-3 text-right font-mono">{result.compiled_metrics?.depth ?? "-"}</td>
                      <td className="px-4 py-3 text-right font-mono">{result.compiled_metrics?.two_qubit_gate_count ?? "-"}</td>
                      <td className="px-4 py-3 text-right font-mono">{result.compiled_metrics?.total_gates ?? "-"}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {result.output_quality?.approximation_ratio != null ? `${(result.output_quality.approximation_ratio * 100).toFixed(1)}%` : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {result.output_quality?.success_probability != null ? `${(result.output_quality.success_probability * 100).toFixed(1)}%` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionPanel>
      ) : null}

      {simExecution ? (
        <SectionPanel title="Simulator results" subtitle="Qiskit Aer execution on ideal and noisy simulator targets">
          <div className="grid gap-4 lg:grid-cols-2">
            {simExecution.ideal_simulator ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-4">
                <p className="text-[13px] font-semibold text-foreground">Ideal simulator</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <MetricTile label="Expected cost" value={String(simExecution.ideal_simulator.expected_cost)} />
                  <MetricTile label="Approx. ratio" value={`${(simExecution.ideal_simulator.approximation_ratio * 100).toFixed(1)}%`} />
                  <MetricTile label="Success prob." value={`${(simExecution.ideal_simulator.success_probability * 100).toFixed(1)}%`} />
                  <MetricTile label="Outcomes" value={String(simExecution.ideal_simulator.unique_outcomes)} />
                </div>
              </div>
            ) : null}
            {simExecution.noisy_simulator ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-4">
                <p className="text-[13px] font-semibold text-foreground">Noisy simulator</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{simExecution.noisy_simulator.noise_model}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <MetricTile label="Expected cost" value={String(simExecution.noisy_simulator.expected_cost)} />
                  <MetricTile label="Approx. ratio" value={`${(simExecution.noisy_simulator.approximation_ratio * 100).toFixed(1)}%`} />
                  <MetricTile label="Success prob." value={`${(simExecution.noisy_simulator.success_probability * 100).toFixed(1)}%`} />
                  <MetricTile label="Outcomes" value={String(simExecution.noisy_simulator.unique_outcomes)} />
                </div>
              </div>
            ) : null}
          </div>
        </SectionPanel>
      ) : null}

      <SectionPanel title="Continue workflow" subtitle="Use this benchmark in the final decision report.">
        <div className="flex flex-wrap gap-2">
          <Link to={`/app/reports?scenario=${run.scenario_id}&benchmark=${run.id}`} className="rounded-full border border-border px-3 py-1.5 text-[12px] text-foreground">
            Report with this run
          </Link>
        </div>
      </SectionPanel>
    </div>
  );
}
