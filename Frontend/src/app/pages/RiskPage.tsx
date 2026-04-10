import { useState } from "react";
import { Play, Clock, CheckCircle, BarChart3, ChevronDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

const riskComparison = [
  { cell: "A1", classical: 72, quantum: 68, hybrid: 65 },
  { cell: "A3", classical: 85, quantum: 79, hybrid: 74 },
  { cell: "B2", classical: 61, quantum: 58, hybrid: 55 },
  { cell: "C4", classical: 93, quantum: 86, hybrid: 81 },
  { cell: "D1", classical: 45, quantum: 42, hybrid: 40 },
  { cell: "E3", classical: 78, quantum: 71, hybrid: 68 },
];

const modelMetrics = [
  { metric: "Accuracy", classical: 82, quantum: 89, hybrid: 92 },
  { metric: "Coverage", classical: 88, quantum: 85, hybrid: 90 },
  { metric: "Speed", classical: 95, quantum: 45, hybrid: 78 },
  { metric: "Stability", classical: 90, quantum: 72, hybrid: 85 },
  { metric: "Scalability", classical: 70, quantum: 88, hybrid: 92 },
];

const features = [
  { name: "Wind speed", importance: 0.34 },
  { name: "Dryness index", importance: 0.28 },
  { name: "Adjacent cell risk", importance: 0.19 },
  { name: "Temperature", importance: 0.11 },
  { name: "Elevation", importance: 0.08 },
];

export function RiskPage() {
  const [activeView, setActiveView] = useState<"split" | "overlay">("split");
  const [jobRunning, setJobRunning] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Risk Modeling</h1>
          <p className="text-muted-foreground" style={{ fontSize: "13px" }}>Sierra Nevada Wildfire Grid — Compare risk scoring approaches</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
            <button onClick={() => setActiveView("split")} className={`px-3 py-1 rounded ${activeView === "split" ? "bg-muted" : ""}`} style={{ fontSize: "12px" }}>Split</button>
            <button onClick={() => setActiveView("overlay")} className={`px-3 py-1 rounded ${activeView === "overlay" ? "bg-muted" : ""}`} style={{ fontSize: "12px" }}>Overlay</button>
          </div>
          <button
            onClick={() => { setJobRunning(true); setTimeout(() => setJobRunning(false), 3000); }}
            className="flex items-center gap-2 bg-qp-cyan text-white px-4 py-2 rounded-lg hover:bg-qp-cyan/90 transition-colors"
            style={{ fontSize: "13px" }}
          >
            {jobRunning ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {jobRunning ? "Running..." : "Run risk analysis"}
          </button>
        </div>
      </div>

      {/* Job progress */}
      {jobRunning && (
        <div className="bg-qp-cyan/5 border border-qp-cyan/20 rounded-xl p-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-qp-cyan/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-qp-cyan animate-spin" />
          </div>
          <div className="flex-1">
            <p style={{ fontSize: "13px", fontWeight: 500 }}>Risk analysis in progress</p>
            <p className="text-muted-foreground" style={{ fontSize: "12px" }}>Running classical, quantum, and hybrid models in parallel...</p>
            <div className="mt-2 h-1.5 bg-qp-cyan/10 rounded-full overflow-hidden">
              <div className="h-full bg-qp-cyan rounded-full transition-all" style={{ width: "45%", animation: "pulse 2s infinite" }} />
            </div>
          </div>
        </div>
      )}

      {/* Model summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Classical", score: "78.4", time: "0.3s", color: "#3b82f6", confidence: "±3.2" },
          { label: "Quantum", score: "82.1", time: "6.8s", color: "#8b5cf6", confidence: "±2.1" },
          { label: "Hybrid", score: "85.7", time: "2.4s", color: "#06b6d4", confidence: "±1.8" },
        ].map((m) => (
          <div key={m.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{m.label}</span>
              </div>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p style={{ fontSize: "28px", fontWeight: 600 }}>{m.score}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-muted-foreground" style={{ fontSize: "11px" }}>Runtime: {m.time}</span>
              <span className="text-muted-foreground" style={{ fontSize: "11px" }}>Confidence: {m.confidence}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Benchmark strip */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-6">
          <span className="text-muted-foreground" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.05em" }}>BENCHMARK</span>
          {[
            { label: "Best Quality", value: "Hybrid (85.7)", color: "text-qp-cyan" },
            { label: "Fastest", value: "Classical (0.3s)", color: "text-blue-600" },
            { label: "Best Value", value: "Hybrid (35.7 score/s)", color: "text-qp-cyan" },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="text-muted-foreground" style={{ fontSize: "12px" }}>{b.label}:</span>
              <span className={b.color} style={{ fontSize: "12px", fontWeight: 600 }}>{b.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Risk comparison chart */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Risk Score by Cell — Classical vs Quantum vs Hybrid</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={riskComparison} barGap={2}>
              <XAxis dataKey="cell" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#636882" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#636882" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Bar dataKey="classical" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="quantum" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="hybrid" fill="#06b6d4" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feature importance */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Feature Importance</h3>
          <div className="space-y-3">
            {features.map((f) => (
              <div key={f.name}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: "12px" }}>{f.name}</span>
                  <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{(f.importance * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-qp-violet rounded-full" style={{ width: `${f.importance * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Split heatmap comparison */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Classical", color: "#3b82f6" },
          { label: "Quantum", color: "#8b5cf6" },
          { label: "Hybrid", color: "#06b6d4" },
        ].map((m) => (
          <div key={m.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{m.label} Risk Heatmap</span>
            </div>
            <div className="grid grid-cols-10 gap-0.5">
              {Array.from({ length: 100 }).map((_, i) => {
                const risk = Math.random();
                const opacity = risk * 0.8 + 0.1;
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-[2px]"
                    style={{ background: m.color, opacity }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Previous run comparison */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="mb-3" style={{ fontSize: "14px", fontWeight: 600 }}>Previous Runs</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Run ID", "Date", "Classical Score", "Quantum Score", "Hybrid Score", "Best", "Runtime"].map((h) => (
                <th key={h} className="text-left py-2 text-muted-foreground" style={{ fontSize: "11px", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { id: "RR-014", date: "Apr 10, 2026", c: 78.4, q: 82.1, h: 85.7, best: "Hybrid", time: "9.5s" },
              { id: "RR-013", date: "Apr 8, 2026", c: 76.1, q: 80.3, h: 83.9, best: "Hybrid", time: "10.2s" },
              { id: "RR-012", date: "Apr 5, 2026", c: 74.8, q: 78.9, h: 82.1, best: "Hybrid", time: "9.8s" },
            ].map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="py-2 text-qp-cyan" style={{ fontSize: "12px", fontWeight: 500 }}>{r.id}</td>
                <td className="py-2 text-muted-foreground" style={{ fontSize: "12px" }}>{r.date}</td>
                <td className="py-2" style={{ fontSize: "12px" }}>{r.c}</td>
                <td className="py-2" style={{ fontSize: "12px" }}>{r.q}</td>
                <td className="py-2" style={{ fontSize: "12px" }}>{r.h}</td>
                <td className="py-2"><span className="px-2 py-0.5 rounded-full bg-qp-cyan/10 text-qp-cyan" style={{ fontSize: "11px" }}>{r.best}</span></td>
                <td className="py-2 text-muted-foreground" style={{ fontSize: "12px" }}>{r.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
