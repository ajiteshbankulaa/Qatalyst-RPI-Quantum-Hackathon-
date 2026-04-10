import { useState } from "react";
import { Target, Save, Download, GitCompare, CheckCircle, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const interventions = [
  { rank: 1, cell: "(3, 4)", type: "Firebreak", cost: "$340K", impact: -18.2, confidence: 0.94 },
  { rank: 2, cell: "(5, 7)", type: "Firebreak", cost: "$290K", impact: -15.7, confidence: 0.91 },
  { rank: 3, cell: "(2, 8)", type: "Resource Deploy", cost: "$420K", impact: -14.3, confidence: 0.88 },
  { rank: 4, cell: "(7, 2)", type: "Firebreak", cost: "$310K", impact: -12.1, confidence: 0.86 },
  { rank: 5, cell: "(1, 5)", type: "Monitoring", cost: "$180K", impact: -8.9, confidence: 0.83 },
  { rank: 6, cell: "(6, 9)", type: "Resource Deploy", cost: "$380K", impact: -7.4, confidence: 0.79 },
];

const comparisonData = [
  { label: "Classical Heuristic", before: 85.7, after: 52.3 },
  { label: "Quantum QAOA", before: 85.7, after: 41.8 },
  { label: "Hybrid VQE", before: 85.7, after: 38.2 },
];

export function OptimizePage() {
  const [selectedPlan, setSelectedPlan] = useState(0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Intervention Optimization</h1>
          <p className="text-muted-foreground" style={{ fontSize: "13px" }}>Sierra Nevada — Optimal intervention placement under constraints</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors" style={{ fontSize: "13px" }}>
            <GitCompare className="w-3.5 h-3.5" /> Compare plans
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors" style={{ fontSize: "13px" }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-qp-navy text-white hover:bg-qp-slate transition-colors" style={{ fontSize: "13px" }}>
            <Save className="w-3.5 h-3.5" /> Save plan
          </button>
        </div>
      </div>

      {/* Key answer cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-muted-foreground mb-1" style={{ fontSize: "12px" }}>What should I do?</p>
          <p style={{ fontSize: "20px", fontWeight: 600 }}>6 interventions</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>across 4 firebreaks, 2 resource deployments</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-muted-foreground mb-1" style={{ fontSize: "12px" }}>Why these interventions?</p>
          <p style={{ fontSize: "20px", fontWeight: 600 }}>-55.4% risk</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>Hybrid optimizer found optimal placement</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-muted-foreground mb-1" style={{ fontSize: "12px" }}>What do I gain vs alternatives?</p>
          <p style={{ fontSize: "20px", fontWeight: 600 }}>+14.1 pts</p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>better than classical heuristic approach</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Canvas with interventions */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="mb-3" style={{ fontSize: "14px", fontWeight: 600 }}>Intervention Map</h3>
          <div className="grid grid-cols-10 gap-1 relative">
            {Array.from({ length: 100 }).map((_, i) => {
              const r = Math.floor(i / 10);
              const c = i % 10;
              const isIntervention = interventions.some(
                (int) => int.cell === `(${r}, ${c})`
              );
              const risk = Math.random();
              const baseColor = risk > 0.7 ? "bg-red-300" : risk > 0.4 ? "bg-amber-200" : risk > 0.15 ? "bg-cyan-100" : "bg-slate-100";
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-sm relative ${isIntervention ? "bg-qp-violet ring-2 ring-qp-violet" : baseColor}`}
                >
                  {isIntervention && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Target className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-3" style={{ fontSize: "10px" }}>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-qp-violet" /> Intervention</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-300" /> High risk</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-amber-200" /> Medium</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-cyan-100" /> Low</span>
          </div>
        </div>

        {/* Budget panel */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="mb-3" style={{ fontSize: "14px", fontWeight: 600 }}>Budget</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground" style={{ fontSize: "12px" }}>Total Budget</span>
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>$2,400,000</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground" style={{ fontSize: "12px" }}>Allocated</span>
                  <span className="text-qp-violet" style={{ fontSize: "12px", fontWeight: 600 }}>$1,920,000</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-qp-violet rounded-full" style={{ width: "80%" }} />
                </div>
                <p className="text-muted-foreground mt-1" style={{ fontSize: "11px" }}>80% utilized — $480K remaining</p>
              </div>
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground" style={{ fontSize: "12px" }}>Max Interventions</span>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>8</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-muted-foreground" style={{ fontSize: "12px" }}>Used</span>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>6 of 8</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>Objective Score</h3>
            <p style={{ fontSize: "32px", fontWeight: 600, color: "#06b6d4" }}>38.2</p>
            <p className="text-muted-foreground" style={{ fontSize: "12px" }}>Residual risk score (lower is better)</p>
            <div className="flex items-center gap-1 mt-2 text-emerald-600" style={{ fontSize: "12px" }}>
              <CheckCircle className="w-3 h-3" /> 55.4% reduction from baseline
            </div>
          </div>
        </div>
      </div>

      {/* Ranked intervention list */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Ranked Interventions</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Rank", "Cell", "Type", "Cost", "Risk Impact", "Confidence"].map((h) => (
                <th key={h} className="text-left py-2 text-muted-foreground" style={{ fontSize: "11px", fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {interventions.map((int) => (
              <tr key={int.rank} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="py-2.5">
                  <span className="w-6 h-6 rounded-full bg-qp-violet/10 text-qp-violet inline-flex items-center justify-center" style={{ fontSize: "11px", fontWeight: 600 }}>
                    {int.rank}
                  </span>
                </td>
                <td className="py-2.5" style={{ fontSize: "12px", fontWeight: 500 }}>{int.cell}</td>
                <td className="py-2.5">
                  <span className={`px-2 py-0.5 rounded-full ${
                    int.type === "Firebreak" ? "bg-slate-100 text-slate-600" :
                    int.type === "Resource Deploy" ? "bg-qp-violet/10 text-qp-violet" :
                    "bg-qp-cyan/10 text-qp-cyan"
                  }`} style={{ fontSize: "11px" }}>{int.type}</span>
                </td>
                <td className="py-2.5" style={{ fontSize: "12px" }}>{int.cost}</td>
                <td className="py-2.5 text-emerald-600" style={{ fontSize: "12px", fontWeight: 500 }}>{int.impact}%</td>
                <td className="py-2.5" style={{ fontSize: "12px" }}>{(int.confidence * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Before/after + solver comparison */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Solver Comparison — Before vs After</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={comparisonData} layout="vertical" barGap={4}>
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#636882" }} />
            <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#636882" }} width={120} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }} />
            <Bar dataKey="before" fill="#e8eaef" radius={[0, 3, 3, 0]} name="Before" />
            <Bar dataKey="after" fill="#8b5cf6" radius={[0, 3, 3, 0]} name="After" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
