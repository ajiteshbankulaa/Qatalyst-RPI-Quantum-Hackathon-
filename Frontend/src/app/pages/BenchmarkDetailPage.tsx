import { useParams } from "react-router";

import { api } from "../api";
import { EmptyState, LoadingState, PageHeader, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function BenchmarkDetailPage() {
  const { id = "" } = useParams();
  const { data: run, loading, error } = useAsyncData(() => api.getBenchmark(id), [id]);

  if (loading) return <LoadingState label="Loading benchmark detail..." />;
  if (error || !run) return <EmptyState title="Benchmark run unavailable" description={error ?? "Run not found."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Benchmark detail"
        title={`Run ${run.id}`}
        description="Inspect workload scope, compiler strategy outputs, compiled resource metrics, and availability labeling for this benchmark record."
      />

      <SectionPanel>
        <div className="flex flex-wrap gap-2">
          <StatusPill label={run.status} tone={run.status === "complete" ? "good" : "warn"} />
          <StatusPill label={run.availability.mode} tone={run.availability.mode === "ready" ? "good" : "warn"} />
        </div>
        <p className="mt-4 text-[13px] leading-6 text-muted-foreground">{run.summary.recommendation}</p>
      </SectionPanel>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionPanel title="Workload" subtitle="Reduced intervention optimization subproblem">
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100">
            {JSON.stringify(run.results.workload, null, 2)}
          </pre>
        </SectionPanel>

        <SectionPanel title="Strategy outputs" subtitle="Compiled resource metrics and observed quality metrics">
          <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100">
            {JSON.stringify(run.results.strategy_results ?? run.results.note, null, 2)}
          </pre>
        </SectionPanel>
      </div>
    </div>
  );
}
