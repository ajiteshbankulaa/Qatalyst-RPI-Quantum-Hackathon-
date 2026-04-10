import { useState } from "react";
import { FileText, Download, Link as LinkIcon, Presentation, Plus, Eye, Clock, CheckCircle } from "lucide-react";

const templates = [
  { name: "Executive Summary", desc: "High-level overview with key metrics and recommendations" },
  { name: "Risk Assessment", desc: "Detailed risk analysis with heatmaps and feature importance" },
  { name: "Intervention Plan", desc: "Optimized intervention layout with budget and impact analysis" },
  { name: "Benchmark Report", desc: "Compiler-aware benchmark results across strategies" },
];

const savedReports = [
  { id: "RPT-012", title: "Sierra Nevada Q1 Risk Assessment", template: "Risk Assessment", date: "Apr 10, 2026", status: "Complete", author: "Jane Doe" },
  { id: "RPT-011", title: "Grid Resilience NE Executive Brief", template: "Executive Summary", date: "Apr 8, 2026", status: "Complete", author: "Jane Doe" },
  { id: "RPT-010", title: "Wildfire Intervention Plan — March", template: "Intervention Plan", date: "Mar 28, 2026", status: "Complete", author: "Alex Kim" },
  { id: "RPT-009", title: "Benchmark Integrity — VQE vs QAOA", template: "Benchmark Report", date: "Mar 22, 2026", status: "Generating", author: "Jane Doe" },
];

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState(savedReports[0]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Reports</h1>
          <p className="text-muted-foreground" style={{ fontSize: "13px" }}>Generate and manage decision artifacts</p>
        </div>
        <button className="flex items-center gap-2 bg-qp-navy text-white px-4 py-2 rounded-lg hover:bg-qp-slate transition-colors" style={{ fontSize: "13px" }}>
          <Plus className="w-3.5 h-3.5" /> New report
        </button>
      </div>

      {/* Templates */}
      <div>
        <h3 className="mb-3" style={{ fontSize: "14px", fontWeight: 600 }}>Templates</h3>
        <div className="grid grid-cols-4 gap-4">
          {templates.map((t) => (
            <button key={t.name} className="bg-card rounded-xl border border-border p-4 text-left hover:shadow-sm hover:border-qp-cyan/30 transition-all">
              <FileText className="w-5 h-5 text-qp-cyan mb-2" />
              <p style={{ fontSize: "13px", fontWeight: 600 }}>{t.name}</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "11px", lineHeight: 1.5 }}>{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Saved reports list */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Saved Reports</h3>
          </div>
          <div className="divide-y divide-border">
            {savedReports.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedReport(r)}
                className={`w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors ${
                  selectedReport.id === r.id ? "bg-qp-cyan/5 border-l-2 border-l-qp-cyan" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-qp-cyan" style={{ fontSize: "11px", fontWeight: 500 }}>{r.id}</span>
                  {r.status === "Complete" ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-amber-500" />
                  )}
                </div>
                <p style={{ fontSize: "12px", fontWeight: 500, lineHeight: 1.4 }}>{r.title}</p>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: "11px" }}>{r.date} · {r.author}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Report preview */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-qp-cyan" style={{ fontSize: "11px", fontWeight: 500 }}>{selectedReport.id}</p>
              <h2 className="mt-1" style={{ fontSize: "18px", fontWeight: 600 }}>{selectedReport.title}</h2>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>{selectedReport.template} · {selectedReport.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-border hover:bg-muted" title="Export PDF">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg border border-border hover:bg-muted" title="Share link">
                <LinkIcon className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg border border-border hover:bg-muted" title="Presentation mode">
                <Presentation className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Executive summary block */}
          <div className="mb-6">
            <h3 className="mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>Executive Summary</h3>
            <div className="p-4 rounded-lg bg-background" style={{ fontSize: "13px", lineHeight: 1.7, color: "#636882" }}>
              The Sierra Nevada wildfire scenario shows elevated risk (58.3 aggregate) across the western grid quadrant, driven primarily by wind speed (34%) and dryness (28%). Hybrid optimization reduced projected risk by 55.4% through 6 targeted interventions within $2.4M budget. Compiler-aware benchmarking confirmed VQE via Qiskit maintains 91% solution quality under ideal simulation.
            </div>
          </div>

          {/* Key metrics */}
          <div className="mb-6">
            <h3 className="mb-3" style={{ fontSize: "14px", fontWeight: 600 }}>Key Metrics</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Aggregate Risk Score", value: "58.3", change: "+6.2%" },
                { label: "Risk Reduction", value: "55.4%", change: "Hybrid optimizer" },
                { label: "Budget Utilization", value: "80%", change: "$1.92M of $2.4M" },
              ].map((m) => (
                <div key={m.label} className="p-3 rounded-lg bg-background text-center">
                  <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{m.label}</span>
                  <p className="mt-1" style={{ fontSize: "20px", fontWeight: 600 }}>{m.value}</p>
                  <span className="text-muted-foreground" style={{ fontSize: "10px" }}>{m.change}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-6">
            <h3 className="mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>Recommendations</h3>
            <div className="space-y-2">
              {[
                "Deploy 4 firebreaks at recommended positions before dry season onset",
                "Establish real-time monitoring at cells (2,8) and (6,9)",
                "Schedule benchmark rerun with updated IBM Eagle calibration data",
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2 p-2">
                  <span className="w-5 h-5 rounded-full bg-qp-cyan/10 text-qp-cyan flex items-center justify-center shrink-0" style={{ fontSize: "10px", fontWeight: 600 }}>{i + 1}</span>
                  <p style={{ fontSize: "12px", lineHeight: 1.5 }}>{r}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Methodology */}
          <div>
            <h3 className="mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>Methodology</h3>
            <p className="text-muted-foreground" style={{ fontSize: "12px", lineHeight: 1.6 }}>
              Risk scores computed using hybrid ensemble of classical gradient boosting and quantum VQE optimization. Propagation modeled via discrete-time Markov chain on 10×10 grid topology. Intervention optimization performed using constrained QAOA with budget and cardinality constraints. All quantum workloads transpiled via Qiskit at optimization level 2 with Sabre routing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
