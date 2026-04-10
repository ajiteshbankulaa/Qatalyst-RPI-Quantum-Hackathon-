import { useState } from "react";

import { api } from "../api";
import { EmptyState, LoadingState, PageHeader, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function ReportsPage() {
  const [scenarioId, setScenarioId] = useState("");
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [running, setRunning] = useState(false);
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [scenarios, reports] = await Promise.all([api.listScenarios(), api.listReports()]);
      return { scenarios, reports };
    },
    [],
  );

  async function generate() {
    const activeScenarioId = scenarioId || data?.scenarios[0]?.id;
    if (!activeScenarioId) return;
    setRunning(true);
    try {
      const report = await api.generateReport({
        scenario_id: activeScenarioId,
        title: "Wildfire decision report",
      });
      setActiveReport(report);
      await reload();
    } finally {
      setRunning(false);
    }
  }

  function exportMarkdown() {
    if (!activeReport) return;
    const blob = new Blob([activeReport.export.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = activeReport.export.filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingState label="Loading report workspace..." />;
  if (error || !data) return <EmptyState title="Reports unavailable" description={error ?? "Could not load reports."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reports"
        title="Decision reports"
        description="Generate and export decision artifacts assembled from persisted scenario, risk, forecast, optimization, and benchmark records."
        actions={
          <button onClick={() => void generate()} disabled={running} className="rounded-2xl bg-qp-navy px-4 py-2.5 text-[13px] font-medium text-white">
            {running ? "Generating..." : "Generate report"}
          </button>
        }
      />

      <SectionPanel>
        <select value={scenarioId} onChange={(event) => setScenarioId(event.target.value)} className="min-w-[320px] rounded-2xl border border-border bg-white px-4 py-2.5 text-[13px] outline-none">
          <option value="">Use latest scenario context</option>
          {data.scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
      </SectionPanel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionPanel title="Saved reports" subtitle="Records from `/api/reports`">
          <div className="space-y-3">
            {data.reports.map((report) => (
              <button key={report.id} onClick={() => setActiveReport(report)} className="w-full rounded-2xl border border-border bg-white/80 p-4 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold">{report.title}</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">{new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  <StatusPill label={report.status} tone="good" />
                </div>
              </button>
            ))}
          </div>
        </SectionPanel>

        {activeReport ? (
          <SectionPanel title="Preview and export" subtitle="Launch guide quality: summary, methodology, and a markdown export path.">
            <button onClick={exportMarkdown} className="rounded-2xl border border-border bg-white px-4 py-2 text-[13px] font-medium text-foreground">
              Export markdown
            </button>
            <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100">
              <pre className="whitespace-pre-wrap">{activeReport.export.content}</pre>
            </div>
          </SectionPanel>
        ) : (
          <EmptyState title="No report selected" description="Generate or open a report to preview and export it." />
        )}
      </div>
    </div>
  );
}
