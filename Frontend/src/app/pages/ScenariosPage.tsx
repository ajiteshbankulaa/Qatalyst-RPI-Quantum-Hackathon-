import { useState } from "react";
import { Link } from "react-router";
import {
  Search, Filter, Grid3X3, List, Plus, Copy, Archive, GitCompare,
  MoreHorizontal, Flame, Building2, Zap, Truck, Clock, ChevronDown
} from "lucide-react";

const scenarios = [
  { id: "SC-001", name: "Sierra Nevada Wildfire Grid", domain: "Wildfire", geometry: "10×10 Grid", lastRun: "2h ago", status: "Active", risk: 72, solver: "Hybrid", icon: Flame },
  { id: "SC-002", name: "Northeast Power Grid Resilience", domain: "Infrastructure", geometry: "Graph (142 nodes)", lastRun: "5h ago", status: "Active", risk: 58, solver: "Classical", icon: Zap },
  { id: "SC-003", name: "Pacific Coast Supply Chain", domain: "Logistics", geometry: "Graph (89 nodes)", lastRun: "1d ago", status: "Draft", risk: 41, solver: "Quantum", icon: Truck },
  { id: "SC-004", name: "Urban Infrastructure Network", domain: "Infrastructure", geometry: "Graph (203 nodes)", lastRun: "3d ago", status: "Active", risk: 65, solver: "Hybrid", icon: Building2 },
  { id: "SC-005", name: "Colorado Front Range Fire Model", domain: "Wildfire", geometry: "10×10 Grid", lastRun: "1w ago", status: "Archived", risk: 34, solver: "Classical", icon: Flame },
  { id: "SC-006", name: "Midwest Utility Hardening", domain: "Infrastructure", geometry: "Graph (78 nodes)", lastRun: "2d ago", status: "Active", risk: 49, solver: "Quantum", icon: Zap },
];

const filters = ["All", "Wildfire", "Infrastructure", "Logistics", "Active", "Draft", "Archived"];

export function ScenariosPage() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = scenarios.filter((s) => {
    if (activeFilter !== "All" && s.domain !== activeFilter && s.status !== activeFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Scenarios</h1>
          <p className="text-muted-foreground" style={{ fontSize: "13px" }}>{scenarios.length} scenarios in workspace</p>
        </div>
        <Link to="/app/scenarios/workspace" className="flex items-center gap-2 bg-qp-navy text-white px-4 py-2 rounded-lg hover:bg-qp-slate transition-colors" style={{ fontSize: "13px" }}>
          <Plus className="w-3.5 h-3.5" /> New scenario
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search scenarios..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-qp-cyan/30"
            style={{ fontSize: "13px" }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 rounded-full border transition-colors ${
                activeFilter === f ? "bg-qp-navy text-white border-qp-navy" : "border-border text-muted-foreground hover:bg-muted"
              }`}
              style={{ fontSize: "12px" }}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 border border-border rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded ${viewMode === "table" ? "bg-muted" : ""}`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded ${viewMode === "grid" ? "bg-muted" : ""}`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table view */}
      {viewMode === "table" ? (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background">
                {["Scenario", "Domain", "Geometry", "Risk Score", "Solver", "Last Run", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-muted-foreground" style={{ fontSize: "11px", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link to="/app/scenarios/workspace" className="flex items-center gap-2 hover:text-qp-cyan transition-colors">
                      <s.icon className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 500 }}>{s.name}</p>
                        <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{s.id}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3" style={{ fontSize: "12px" }}>{s.domain}</td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: "12px" }}>{s.geometry}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.risk > 60 ? "bg-qp-amber" : s.risk > 40 ? "bg-qp-cyan" : "bg-emerald-400"}`}
                          style={{ width: `${s.risk}%` }}
                        />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 500 }}>{s.risk}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full ${
                      s.solver === "Quantum" ? "bg-qp-violet/10 text-qp-violet" :
                      s.solver === "Hybrid" ? "bg-qp-cyan/10 text-qp-cyan" :
                      "bg-blue-50 text-blue-600"
                    }`} style={{ fontSize: "11px" }}>{s.solver}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: "12px" }}>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.lastRun}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full ${
                      s.status === "Active" ? "bg-emerald-50 text-emerald-600" :
                      s.status === "Draft" ? "bg-amber-50 text-amber-600" :
                      "bg-gray-100 text-gray-500"
                    }`} style={{ fontSize: "11px" }}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 rounded hover:bg-muted"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((s) => (
            <Link to="/app/scenarios/workspace" key={s.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <s.icon className="w-4 h-4 text-muted-foreground" />
                <span className={`px-2 py-0.5 rounded-full ${
                  s.status === "Active" ? "bg-emerald-50 text-emerald-600" :
                  s.status === "Draft" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"
                }`} style={{ fontSize: "10px" }}>{s.status}</span>
              </div>
              <h3 style={{ fontSize: "14px", fontWeight: 600 }}>{s.name}</h3>
              <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>{s.domain} · {s.geometry}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="text-muted-foreground" style={{ fontSize: "11px" }}>Risk: {s.risk}</span>
                <span className={`px-2 py-0.5 rounded-full ${
                  s.solver === "Quantum" ? "bg-qp-violet/10 text-qp-violet" :
                  s.solver === "Hybrid" ? "bg-qp-cyan/10 text-qp-cyan" : "bg-blue-50 text-blue-600"
                }`} style={{ fontSize: "11px" }}>{s.solver}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
