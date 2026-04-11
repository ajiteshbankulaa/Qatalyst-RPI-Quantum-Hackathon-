import { useEffect, useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { useSearchParams } from "react-router";

import { api } from "../api";
import { EmptyState, LoadingState, Notice, PageHeader, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

function normalizeSeed(value: string | null) {
  return value && value.length > 0 ? value : "";
}

export function ReportsPage() {
  const [params] = useSearchParams();
  const [scenarioId, setScenarioId] = useState(normalizeSeed(params.get("scenario")));
  const [riskRunId, setRiskRunId] = useState(normalizeSeed(params.get("risk")));
  const [forecastRunId, setForecastRunId] = useState(normalizeSeed(params.get("forecast")));
  const [optimizationRunId, setOptimizationRunId] = useState(normalizeSeed(params.get("optimization")));
  const [benchmarkRunId, setBenchmarkRunId] = useState(normalizeSeed(params.get("benchmark")));
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; title: string; description: string } | null>(null);

  const { data: scenarios, loading: scenariosLoading, error: scenariosError } = useAsyncData(api.listScenarios, []);
  const { data: reports, loading: reportsLoading, reload: reloadReports } = useAsyncData(
    () => api.listReports(scenarioId || undefined),
    [scenarioId],
  );
  const { data: riskRuns } = useAsyncData(() => (scenarioId ? api.listRiskRuns(scenarioId) : Promise.resolve([])), [scenarioId]);
  const { data: forecastRuns } = useAsyncData(() => (scenarioId ? api.listForecastRuns(scenarioId) : Promise.resolve([])), [scenarioId]);
  const { data: optimizeRuns } = useAsyncData(() => (scenarioId ? api.listOptimizeRuns(scenarioId) : Promise.resolve([])), [scenarioId]);
  const { data: benchmarkRuns } = useAsyncData(() => (scenarioId ? api.listBenchmarks(scenarioId) : Promise.resolve([])), [scenarioId]);

  const selectedScenario = useMemo(() => scenarios?.find((scenario) => scenario.id === scenarioId) ?? scenarios?.[0], [scenarioId, scenarios]);
  const activeScenarioId = scenarioId || selectedScenario?.id || "";

  useEffect(() => {
    if (selectedScenario && !scenarioId) {
      setScenarioId(selectedScenario.id);
    }
  }, [scenarioId, selectedScenario]);

  useEffect(() => {
    if (reports && reports.length > 0 && !activeReport) {
      setActiveReport(reports[0]);
    }
  }, [reports, activeReport]);

  async function generate() {
    if (!activeScenarioId) return;
    setRunning(true);
    setMessage(null);
    try {
      const report = await api.generateReport({
        scenario_id: activeScenarioId,
        risk_run_id: riskRunId || null,
        forecast_run_id: forecastRunId || null,
        optimization_run_id: optimizationRunId || null,
        benchmark_run_id: benchmarkRunId || null,
        title: "Wildfire decision report",
      });
      setActiveReport(report);
      await reloadReports();
      setMessage({
        tone: "success",
        title: "Report generated",
        description: "The report now reflects the explicit run selections shown in this workspace.",
      });
    } catch (err) {
      setMessage({
        tone: "error",
        title: "Report generation failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setRunning(false);
    }
  }

  function exportFile(type: "markdown" | "json") {
    if (!activeReport) return;
    const content =
      type === "markdown"
        ? activeReport.export.content
        : JSON.stringify(
            {
              title: activeReport.title,
              scenario_id: activeReport.scenario_id,
              created_at: activeReport.created_at,
              sections: activeReport.sections,
            },
            null,
            2,
          );
    const blob = new Blob([content], { type: type === "markdown" ? "text/markdown;charset=utf-8" : "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = type === "markdown" ? activeReport.export.filename : `${activeReport.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (scenariosLoading || reportsLoading) return <LoadingState label="Loading report workspace..." />;
  if (scenariosError || !scenarios || !reports || !riskRuns || !forecastRuns || !optimizeRuns || !benchmarkRuns) {
    return <EmptyState title="Reports unavailable" description={scenariosError ?? "Could not load report dependencies."} />;
  }

  const sections = activeReport?.sections ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Step 6 - Reports"
        title="Decision reports"
        description="Assemble a decision artifact from explicit scenario-linked runs. If a run selector is left blank, the backend falls back to the latest run for that module."
        actions={
          <button onClick={() => void generate()} disabled={running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-50">
            {running ? "Generating..." : "Generate report"}
          </button>
        }
      />

      {message ? <Notice tone={message.tone} title={message.title} description={message.description} /> : null}

      <SectionPanel title="Report inputs" subtitle="Choose a scenario and the exact runs you want included">
        <div className="grid gap-4 lg:grid-cols-5">
          <Selector label="Scenario" value={activeScenarioId} onChange={setScenarioId} options={scenarios.map((scenario) => ({ value: scenario.id, label: scenario.name }))} />
          <Selector label="Risk run" value={riskRunId} onChange={setRiskRunId} allowLatest options={riskRuns.map((run) => ({ value: run.id, label: `${run.id.slice(0, 8)} • ${new Date(run.created_at).toLocaleString()}` }))} />
          <Selector label="Forecast run" value={forecastRunId} onChange={setForecastRunId} allowLatest options={forecastRuns.map((run) => ({ value: run.id, label: `${run.id.slice(0, 8)} • ${new Date(run.created_at).toLocaleString()}` }))} />
          <Selector label="Optimization run" value={optimizationRunId} onChange={setOptimizationRunId} allowLatest options={optimizeRuns.map((run) => ({ value: run.id, label: `${run.id.slice(0, 8)} • ${new Date(run.created_at).toLocaleString()}` }))} />
          <Selector label="Benchmark run" value={benchmarkRunId} onChange={setBenchmarkRunId} allowLatest options={benchmarkRuns.map((run) => ({ value: run.id, label: `${run.id.slice(0, 8)} • ${new Date(run.created_at).toLocaleString()}` }))} />
        </div>
      </SectionPanel>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionPanel title="Saved reports" subtitle="Persisted report records for the selected scenario">
          <div className="space-y-3">
            {reports.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-muted-foreground">No reports generated yet for this scenario.</p>
            ) : (
              reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report)}
                  className={`w-full rounded-2xl border p-4 text-left ${activeReport?.id === report.id ? "border-qp-cyan bg-cyan-50/30" : "border-border bg-white/80"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-[13px] font-semibold">{report.title}</p>
                        <p className="mt-1 text-[12px] text-muted-foreground">{new Date(report.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <StatusPill label={report.status} tone="good" />
                  </div>
                </button>
              ))
            )}
          </div>
        </SectionPanel>

        {activeReport ? (
          <SectionPanel title="Report preview" subtitle={activeReport.title}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => exportFile("markdown")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-2 text-[13px] font-medium text-foreground hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" /> Export markdown
                </button>
                <button
                  onClick={() => exportFile("json")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border bg-white px-4 py-2 text-[13px] font-medium text-foreground hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" /> Export JSON
                </button>
              </div>

              {sections ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard label="Risk" value={sections.risk?.recommended_mode ?? "Not run"} />
                    <SummaryCard label="Forecast" value={sections.forecast?.containment_outlook ?? "Not run"} />
                    <SummaryCard label="Optimize" value={sections.optimization?.recommended_mode ?? "Not run"} />
                    <SummaryCard label="Benchmark" value={sections.benchmark_detail?.best_strategy ?? sections.benchmark_detail?.status ?? "Not run"} />
                  </div>

                  {sections.executive_summary ? (
                    <ReportListCard title="Executive summary" items={sections.executive_summary as string[]} />
                  ) : null}

                  {sections.methodology ? (
                    <ReportListCard title="Methodology" items={sections.methodology as string[]} />
                  ) : null}

                  <details>
                    <summary className="cursor-pointer text-[12px] font-medium text-muted-foreground hover:text-foreground">View raw markdown</summary>
                    <div className="mt-2 rounded-2xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100">
                      <pre className="whitespace-pre-wrap">{activeReport.export.content}</pre>
                    </div>
                  </details>
                </div>
              ) : null}
            </div>
          </SectionPanel>
        ) : (
          <EmptyState title="No report selected" description="Generate or open a report to preview and export it." />
        )}
      </div>
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
  allowLatest = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allowLatest?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none">
        {allowLatest ? <option value="">Use latest available</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-white/60 p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[14px] font-semibold">{value}</p>
    </div>
  );
}

function ReportListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-white/60 p-4">
      <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 space-y-2 text-[12px] leading-5 text-muted-foreground">
        {items.map((line, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-qp-cyan" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
