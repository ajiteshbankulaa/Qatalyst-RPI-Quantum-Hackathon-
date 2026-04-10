import { Link, useParams } from "react-router";
import { ChevronLeft, Download, Copy, CheckCircle } from "lucide-react";

export function BenchmarkDetailPage() {
  const { id } = useParams();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/app/benchmarks" className="flex items-center gap-1 text-muted-foreground hover:text-foreground" style={{ fontSize: "12px" }}>
            <ChevronLeft className="w-3.5 h-3.5" /> Benchmarks
          </Link>
          <div className="w-px h-5 bg-border" />
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Run {id || "BM-094"}</h1>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600" style={{ fontSize: "10px" }}>Complete</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted" style={{ fontSize: "13px" }}>
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted" style={{ fontSize: "13px" }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Algorithm", value: "QAOA" },
          { label: "Source Framework", value: "Qiskit 1.2" },
          { label: "Target Framework", value: "Qiskit (Transpiled)" },
          { label: "Execution Environment", value: "Ideal Simulator" },
        ].map((m) => (
          <div key={m.label} className="bg-card rounded-xl border border-border p-4">
            <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{m.label}</span>
            <p className="mt-1" style={{ fontSize: "14px", fontWeight: 600 }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Compilation strategy */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Compilation Strategy</h3>
          <div className="space-y-3">
            {[
              { label: "Optimization Level", value: "2 (Heavy)" },
              { label: "Routing Method", value: "Sabre" },
              { label: "Layout Method", value: "Trivial" },
              { label: "Basis Gates", value: "CX, ID, RZ, SX, X" },
              { label: "Coupling Map", value: "Eagle r3 (127q)" },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                <span className="text-muted-foreground" style={{ fontSize: "12px" }}>{m.label}</span>
                <span style={{ fontSize: "12px", fontWeight: 500 }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compiled resource metrics */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Compiled Resource Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Circuit Depth", value: "42", prev: "38", change: "+10.5%" },
              { label: "2-Qubit Gates", value: "156", prev: "142", change: "+9.9%" },
              { label: "Circuit Width", value: "10", prev: "10", change: "0%" },
              { label: "Total Gates", value: "312", prev: "284", change: "+9.9%" },
              { label: "Shots", value: "4,096", prev: "4,096", change: "0%" },
              { label: "Estimated Runtime", value: "2.3s", prev: "1.9s", change: "+21%" },
            ].map((m) => (
              <div key={m.label} className="p-3 rounded-lg bg-background">
                <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{m.label}</span>
                <p className="mt-0.5" style={{ fontSize: "18px", fontWeight: 600 }}>{m.value}</p>
                <span className="text-muted-foreground" style={{ fontSize: "10px" }}>prev: {m.prev} ({m.change})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Output quality */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Output Quality Metrics</h3>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Solution Quality", value: "0.91", status: "good" },
            { label: "Fidelity", value: "0.94", status: "good" },
            { label: "Approximation Ratio", value: "0.87", status: "good" },
            { label: "Convergence", value: "98.2%", status: "good" },
            { label: "Variance", value: "0.012", status: "good" },
          ].map((m) => (
            <div key={m.label} className="text-center p-4 rounded-lg bg-background">
              <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{m.label}</span>
              <p className="mt-1" style={{ fontSize: "22px", fontWeight: 600 }}>{m.value}</p>
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mx-auto mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Circuit summary */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Circuit Summary</h3>
        <div className="bg-qp-navy rounded-lg p-4 font-mono overflow-x-auto" style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.8 }}>
          <pre>{`q[0] ──H──●──────────RZ(0.42)──●──────M──
q[1] ──H──X──●───────RZ(0.38)──X──────M──
q[2] ──H─────X──●────RZ(0.55)─────────M──
q[3] ──H────────X──●─RZ(0.29)─────────M──
q[4] ──H───────────X─RZ(0.61)──●──────M──
q[5] ──H──●──────────RZ(0.47)──X──────M──
q[6] ──H──X──●───────RZ(0.33)─────────M──
q[7] ──H─────X──●────RZ(0.51)─────────M──
q[8] ──H────────X──●─RZ(0.44)─────────M──
q[9] ──H───────────X─RZ(0.39)─────────M──`}</pre>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Job Logs</h3>
        <div className="bg-background rounded-lg p-4 font-mono space-y-1" style={{ fontSize: "11px", color: "#636882" }}>
          {[
            "[2026-04-10 14:23:01] Job submitted — ID: BM-094",
            "[2026-04-10 14:23:01] Source: Qiskit QAOA circuit (10 qubits)",
            "[2026-04-10 14:23:02] Transpilation started — Optimization level 2",
            "[2026-04-10 14:23:02] Routing: Sabre | Layout: Trivial",
            "[2026-04-10 14:23:03] Transpilation complete — Depth: 42, 2Q gates: 156",
            "[2026-04-10 14:23:03] Execution started — Backend: Ideal Simulator",
            "[2026-04-10 14:23:04] Shots: 4096 | Seed: 42",
            "[2026-04-10 14:23:05] Execution complete — Runtime: 2.3s",
            "[2026-04-10 14:23:05] Quality metrics computed — Score: 0.91",
            "[2026-04-10 14:23:05] Job complete ✓",
          ].map((log, i) => (
            <p key={i}>{log}</p>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="mb-3" style={{ fontSize: "14px", fontWeight: 600 }}>Notes & Conclusions</h3>
        <div className="p-4 rounded-lg bg-background" style={{ fontSize: "13px", lineHeight: 1.6 }}>
          <p className="text-muted-foreground">
            QAOA with Qiskit-to-Qiskit compilation at optimization level 2 shows strong quality (0.91) with moderate circuit overhead. The Sabre routing kept 2-qubit gate count reasonable at 156. Compared to the Qiskit→Cirq path (BM-093), this strategy maintains higher fidelity with 33% fewer gates, making it the recommended path for production workloads on ideal simulators.
          </p>
        </div>
      </div>
    </div>
  );
}
