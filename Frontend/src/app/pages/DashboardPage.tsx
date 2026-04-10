import {
  TrendingUp, AlertTriangle, Cpu, FileText, Play, ArrowUpRight,
  CheckCircle, Clock, Zap, ChevronRight, BarChart3, Activity
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const riskTrend = [
  { day: "Mon", risk: 42 }, { day: "Tue", risk: 45 }, { day: "Wed", risk: 51 },
  { day: "Thu", risk: 48 }, { day: "Fri", risk: 55 }, { day: "Sat", risk: 52 }, { day: "Sun", risk: 58 },
];

const solverMix = [
  { name: "Classical", value: 45, color: "#3b82f6" },
  { name: "Quantum", value: 30, color: "#8b5cf6" },
  { name: "Hybrid", value: 25, color: "#06b6d4" },
];

const recentBenchmarks = [
  { id: "BR-042", scenario: "Wildfire Sierra Grid", solver: "Hybrid", quality: 0.94, time: "2.3s", status: "complete" },
  { id: "BR-041", scenario: "Grid Resilience NE", solver: "Classical", quality: 0.87, time: "0.4s", status: "complete" },
  { id: "BR-040", scenario: "Supply Chain EU", solver: "Quantum", quality: 0.91, time: "8.1s", status: "complete" },
];

const recommendations = [
  { text: "Re-run Sierra scenario with updated wind model", priority: "high" },
  { text: "Benchmark QAOA vs VQE on Grid Resilience NE", priority: "medium" },
  { text: "Review intervention budget for Q2 planning", priority: "low" },
];

export function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Overview</h1>
          <p className="text-muted-foreground" style={{ fontSize: "13px" }}>Wildfire West workspace — April 2026</p>
        </div>
        <button className="flex items-center gap-2 bg-qp-navy text-white px-4 py-2 rounded-lg hover:bg-qp-slate transition-colors" style={{ fontSize: "13px" }}>
          <Play className="w-3.5 h-3.5" /> Quick launch
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active Scenarios", value: "12", change: "+2 this week", icon: Activity, color: "text-qp-cyan" },
          { label: "Avg Risk Score", value: "58.3", change: "+6.2% vs last month", icon: AlertTriangle, color: "text-qp-amber" },
          { label: "Benchmark Runs", value: "847", change: "23 this week", icon: Cpu, color: "text-qp-violet" },
          { label: "Reports Generated", value: "34", change: "3 pending review", icon: FileText, color: "text-qp-cyan" },
        ].map((card) => (
          <div key={card.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground" style={{ fontSize: "12px", fontWeight: 500 }}>{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-foreground" style={{ fontSize: "24px", fontWeight: 600 }}>{card.value}</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: "11px" }}>{card.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Risk trend */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Risk Trend</h3>
            <span className="text-muted-foreground" style={{ fontSize: "11px" }}>Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={riskTrend}>
              <defs>
                <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#636882" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#636882" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="risk" stroke="#f59e0b" strokeWidth={2} fill="url(#riskGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Solver mix */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Solver Mix</h3>
          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie data={solverMix} cx={80} cy={80} innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {solverMix.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="flex justify-center gap-4 mt-3">
            {solverMix.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5" style={{ fontSize: "11px" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.name} {s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Recent benchmarks */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Recent Benchmark Runs</h3>
            <button className="text-qp-cyan flex items-center gap-1" style={{ fontSize: "12px" }}>
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Scenario", "Solver", "Quality", "Time", "Status"].map((h) => (
                  <th key={h} className="text-left py-2 text-muted-foreground" style={{ fontSize: "11px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBenchmarks.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 text-qp-cyan" style={{ fontSize: "12px", fontWeight: 500 }}>{b.id}</td>
                  <td className="py-2.5" style={{ fontSize: "12px" }}>{b.scenario}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-full ${
                      b.solver === "Quantum" ? "bg-qp-violet/10 text-qp-violet" :
                      b.solver === "Hybrid" ? "bg-qp-cyan/10 text-qp-cyan" :
                      "bg-blue-50 text-blue-600"
                    }`} style={{ fontSize: "11px" }}>{b.solver}</span>
                  </td>
                  <td className="py-2.5" style={{ fontSize: "12px", fontWeight: 500 }}>{b.quality}</td>
                  <td className="py-2.5 text-muted-foreground" style={{ fontSize: "12px" }}>{b.time}</td>
                  <td className="py-2.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recommendations */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Recommended Actions</h3>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-background">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  r.priority === "high" ? "bg-qp-amber" : r.priority === "medium" ? "bg-qp-cyan" : "bg-qp-steel"
                }`} />
                <p style={{ fontSize: "12px", lineHeight: 1.5 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System health */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Quantum Backend", status: "Connected", icon: Zap, ok: true },
          { label: "Classical Solver", status: "Operational", icon: BarChart3, ok: true },
          { label: "Job Queue", status: "3 pending", icon: Clock, ok: true },
          { label: "Last Sync", status: "2 min ago", icon: ArrowUpRight, ok: true },
        ].map((item) => (
          <div key={item.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <item.icon className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{item.label}</p>
              <p style={{ fontSize: "13px", fontWeight: 500 }}>{item.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
