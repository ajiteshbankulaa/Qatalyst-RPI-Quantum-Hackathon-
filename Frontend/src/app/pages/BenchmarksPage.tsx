import { useState } from "react";
import { Link } from "react-router";
import { Cpu, ChevronDown, Play, Eye, ChevronRight, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const qualityCost = [
  { cost: 0.3, quality: 78, name: "Classical Greedy" },
  { cost: 1.2, quality: 82, name: "QAOA (Qiskit→Qiskit)" },
  { cost: 2.8, quality: 79, name: "QAOA (Qiskit→Cirq)" },
  { cost: 6.5, quality: 89, name: "VQE (Qiskit→IBM)" },
  { cost: 3.2, quality: 91, name: "VQE (Qiskit→Qiskit)" },
  { cost: 1.8, quality: 85, name: "Hybrid QAOA" },
  { cost: 4.1, quality: 87, name: "VQE (Cirq→IBM)" },
];

const benchmarkRuns = [
  { id: "BM-094", algorithm: "QAOA", source: "Qiskit", target: "Qiskit", env: "Ideal Sim", depth: 42, gates: 156, quality: 0.91, status: "complete", time: "2.3s" },
  { id: "BM-093", algorithm: "QAOA", source: "Qiskit", target: "Cirq", env: "Noisy Sim", depth: 67, gates: 234, quality: 0.79, status: "complete", time: "4.1s" },
  { id: "BM-092", algorithm: "VQE", source: "Qiskit", target: "IBM Eagle", env: "Hardware", depth: 89, gates: 312, quality: 0.87, status: "complete", time: "12.4s" },
  { id: "BM-091", algorithm: "VQE", source: "Cirq", target: "IBM Eagle", env: "Hardware", depth: 102, gates: 387, quality: 0.83, status: "complete", time: "15.8s" },
  { id: "BM-090", algorithm: "QAOA", source: "Qiskit", target: "Qiskit", env: "Ideal Sim", depth: 38, gates: 142, quality: 0.93, status: "complete", time: "1.9s" },
  { id: "BM-089", algorithm: "Classical", source: "—", target: "CPU", env: "Local", depth: 0, gates: 0, quality: 0.78, status: "complete", time: "0.3s" },
];

const envBadgeColors: Record<string, string> = {
  "Ideal Sim": "bg-emerald-50 text-emerald-600",
  "Noisy Sim": "bg-amber-50 text-amber-600",
  "Hardware": "bg-qp-violet/10 text-qp-violet",
  "Local": "bg-blue-50 text-blue-600",
};

export function BenchmarksPage() {
  const [algorithm, setAlgorithm] = useState("All");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Compiler-Aware Benchmarking</h1>
          <p className="text-muted-foreground" style={{ fontSize: "13px" }}>Execution integrity analysis across compilation strategies and hardware targets</p>
        </div>
        <button className="flex items-center gap-2 bg-qp-cyan text-white px-4 py-2 rounded-lg hover:bg-qp-cyan/90 transition-colors" style={{ fontSize: "13px" }}>
          <Play className="w-3.5 h-3.5" /> New benchmark run
        </button>
      </div>

      {/* Recommendation banner */}
      <div className="bg-qp-cyan/5 border border-qp-cyan/20 rounded-xl p-4 flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-qp-cyan/10 flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4 text-qp-cyan" />
        </div>
        <div className="flex-1">
          <p style={{ fontSize: "13px", fontWeight: 500 }}>Recommended: VQE via Qiskit→Qiskit on Ideal Simulator</p>
          <p className="text-muted-foreground" style={{ fontSize: "12px" }}>Best quality-to-cost ratio under current constraints. Quality: 0.91, Runtime: 3.2s</p>
        </div>
        <Link to="/app/benchmarks/BM-094" className="flex items-center gap-1 text-qp-cyan" style={{ fontSize: "12px" }}>
          View details <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div>
          <span className="text-muted-foreground mr-2" style={{ fontSize: "12px" }}>Algorithm:</span>
          {["All", "QAOA", "VQE", "Classical"].map((a) => (
            <button
              key={a}
              onClick={() => setAlgorithm(a)}
              className={`px-3 py-1 rounded-full border mr-1.5 transition-colors ${
                algorithm === a ? "bg-qp-navy text-white border-qp-navy" : "border-border hover:bg-muted"
              }`}
              style={{ fontSize: "12px" }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Quality vs Cost scatter */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Quality vs Cost</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="cost" name="Cost (s)" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#636882" }} label={{ value: "Runtime (s)", position: "bottom", fontSize: 11, fill: "#636882" }} />
              <YAxis dataKey="quality" name="Quality" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#636882" }} label={{ value: "Quality Score", angle: -90, position: "left", fontSize: 11, fill: "#636882" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }} formatter={(value: any, name: string) => [value, name === "cost" ? "Runtime (s)" : "Quality"]} />
              <Scatter data={qualityCost} fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison cards */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="mb-3" style={{ fontSize: "13px", fontWeight: 600 }}>Strategy A: Qiskit→Qiskit</h3>
            <div className="space-y-2">
              {[
                { label: "Circuit Depth", value: "42" },
                { label: "2-Qubit Gates", value: "156" },
                { label: "Width", value: "10 qubits" },
                { label: "Shots", value: "4,096" },
                { label: "Quality", value: "0.91" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{m.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="mb-3" style={{ fontSize: "13px", fontWeight: 600 }}>Strategy B: Qiskit→Cirq</h3>
            <div className="space-y-2">
              {[
                { label: "Circuit Depth", value: "67" },
                { label: "2-Qubit Gates", value: "234" },
                { label: "Width", value: "10 qubits" },
                { label: "Shots", value: "4,096" },
                { label: "Quality", value: "0.79" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{m.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Compilation path visual */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Compilation Paths</h3>
        <div className="flex items-center justify-center gap-3 py-4">
          {[
            { label: "Source Circuit", sub: "QAOA (Qiskit)" },
            { label: "Transpilation", sub: "Optimization Level 2" },
            { label: "Target IR", sub: "OpenQASM 3.0" },
            { label: "Backend Compile", sub: "IBM Eagle r3" },
            { label: "Execution", sub: "4,096 shots" },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              <div className="text-center">
                <div className="w-24 h-16 rounded-lg border border-border bg-background flex flex-col items-center justify-center">
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>{step.label}</span>
                  <span className="text-muted-foreground" style={{ fontSize: "10px" }}>{step.sub}</span>
                </div>
              </div>
              {i < 4 && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Results table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Run History</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background">
              {["Run ID", "Algorithm", "Source", "Target", "Environment", "Depth", "Gates", "Quality", "Time", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-muted-foreground" style={{ fontSize: "11px", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {benchmarkRuns
              .filter((r) => algorithm === "All" || r.algorithm === algorithm)
              .map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2.5 text-qp-cyan" style={{ fontSize: "12px", fontWeight: 500 }}>{r.id}</td>
                  <td className="px-4 py-2.5" style={{ fontSize: "12px" }}>{r.algorithm}</td>
                  <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: "12px" }}>{r.source}</td>
                  <td className="px-4 py-2.5" style={{ fontSize: "12px" }}>{r.target}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full ${envBadgeColors[r.env] || "bg-muted"}`} style={{ fontSize: "10px" }}>{r.env}</span>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: "12px" }}>{r.depth}</td>
                  <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: "12px" }}>{r.gates}</td>
                  <td className="px-4 py-2.5" style={{ fontSize: "12px", fontWeight: 500 }}>{r.quality}</td>
                  <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: "12px" }}>{r.time}</td>
                  <td className="px-4 py-2.5">
                    <Link to={`/app/benchmarks/${r.id}`} className="p-1 rounded hover:bg-muted inline-flex">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
