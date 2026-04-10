import { useState, useCallback } from "react";
import {
  ChevronLeft, Save, Play, Settings, Brush, MousePointer,
  Square, Circle, Info, History, MessageSquare, X, ChevronDown
} from "lucide-react";
import { Link } from "react-router";

const GRID_SIZE = 10;

type CellState = "empty" | "low" | "medium" | "high" | "critical" | "firebreak" | "intervention";

const cellColors: Record<CellState, string> = {
  empty: "bg-slate-100",
  low: "bg-cyan-200",
  medium: "bg-amber-200",
  high: "bg-orange-300",
  critical: "bg-red-400",
  firebreak: "bg-slate-400",
  intervention: "bg-violet-400",
};

function generateInitialGrid(): CellState[][] {
  const states: CellState[] = ["empty", "low", "medium", "high", "critical"];
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => {
      const r = Math.random();
      if (r > 0.85) return "critical";
      if (r > 0.65) return "high";
      if (r > 0.4) return "medium";
      if (r > 0.15) return "low";
      return "empty";
    })
  );
}

export function ScenarioWorkspacePage() {
  const [grid, setGrid] = useState<CellState[][]>(generateInitialGrid);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [tool, setTool] = useState<"select" | "brush">("select");
  const [brushState, setBrushState] = useState<CellState>("firebreak");
  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleCellClick = useCallback((r: number, c: number) => {
    if (tool === "select") {
      setSelectedCell([r, c]);
      setDrawerOpen(true);
    } else {
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = brushState;
        return next;
      });
    }
  }, [tool, brushState]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-11 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
        <Link to="/app/scenarios" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "12px" }}>
          <ChevronLeft className="w-3.5 h-3.5" /> Scenarios
        </Link>
        <div className="w-px h-5 bg-border" />
        <span style={{ fontSize: "13px", fontWeight: 600 }}>Sierra Nevada Wildfire Grid</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600" style={{ fontSize: "10px" }}>Active</span>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors" style={{ fontSize: "12px" }}>
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-qp-cyan text-white hover:bg-qp-cyan/90 transition-colors" style={{ fontSize: "12px" }}>
            <Play className="w-3.5 h-3.5" /> Run analysis
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left config panel */}
        <div className="w-64 border-r border-border bg-card p-4 overflow-y-auto shrink-0 space-y-5">
          <div>
            <h4 className="text-muted-foreground mb-2" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.05em" }}>SCENARIO</h4>
            <div className="space-y-2">
              <div>
                <label style={{ fontSize: "12px", fontWeight: 500 }}>Domain</label>
                <div className="mt-1 px-3 py-1.5 rounded-lg bg-input-background border border-border flex items-center justify-between" style={{ fontSize: "12px" }}>
                  Wildfire <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 500 }}>Geometry</label>
                <div className="mt-1 px-3 py-1.5 rounded-lg bg-input-background border border-border" style={{ fontSize: "12px" }}>10×10 Grid</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-muted-foreground mb-2" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.05em" }}>ENVIRONMENT</h4>
            <div className="space-y-3">
              {[
                { label: "Wind Speed", value: "24 mph", range: 80 },
                { label: "Dryness Index", value: "0.78", range: 78 },
                { label: "Temperature", value: "94°F", range: 65 },
                { label: "Humidity", value: "12%", range: 12 },
              ].map((v) => (
                <div key={v.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{v.label}</span>
                    <span style={{ fontSize: "11px", fontWeight: 500 }}>{v.value}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full">
                    <div className="h-full bg-qp-amber rounded-full" style={{ width: `${v.range}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-muted-foreground mb-2" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.05em" }}>CONSTRAINTS</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "12px" }}>Intervention Budget</span>
                <span className="text-qp-cyan" style={{ fontSize: "12px", fontWeight: 600 }}>$2.4M</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "12px" }}>Max Interventions</span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>8</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "12px" }}>Time Horizon</span>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>72h</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-muted-foreground mb-2" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.05em" }}>OBJECTIVE</h4>
            <p className="text-muted-foreground" style={{ fontSize: "12px", lineHeight: 1.5 }}>
              Minimize total propagated risk across grid cells while staying within budget and max intervention constraints.
            </p>
          </div>

          <div>
            <h4 className="text-muted-foreground mb-2" style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.05em" }}>TOOLS</h4>
            <div className="flex gap-1.5">
              <button
                onClick={() => setTool("select")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${tool === "select" ? "bg-qp-navy text-white border-qp-navy" : "border-border hover:bg-muted"}`}
                style={{ fontSize: "11px" }}
              >
                <MousePointer className="w-3 h-3" /> Select
              </button>
              <button
                onClick={() => setTool("brush")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${tool === "brush" ? "bg-qp-navy text-white border-qp-navy" : "border-border hover:bg-muted"}`}
                style={{ fontSize: "11px" }}
              >
                <Brush className="w-3 h-3" /> Brush
              </button>
            </div>
            {tool === "brush" && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {(["firebreak", "intervention", "critical", "high", "medium", "low", "empty"] as CellState[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setBrushState(s)}
                    className={`px-2 py-0.5 rounded border ${brushState === s ? "border-qp-navy" : "border-border"}`}
                    style={{ fontSize: "10px" }}
                  >
                    <span className={`inline-block w-2 h-2 rounded-sm mr-1 ${cellColors[s]}`} />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center bg-background p-8 relative">
          <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={`w-12 h-12 rounded-sm ${cellColors[cell]} transition-colors hover:ring-2 hover:ring-qp-cyan/50 ${
                    selectedCell && selectedCell[0] === r && selectedCell[1] === c ? "ring-2 ring-qp-cyan" : ""
                  }`}
                />
              ))
            )}
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-card px-4 py-2 rounded-lg border border-border shadow-sm">
            {Object.entries(cellColors).map(([state, cls]) => (
              <div key={state} className="flex items-center gap-1" style={{ fontSize: "10px" }}>
                <span className={`w-3 h-3 rounded-sm ${cls}`} />
                <span className="text-muted-foreground capitalize">{state}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right drawer */}
        {drawerOpen && (
          <div className="w-72 border-l border-border bg-card p-4 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h4 style={{ fontSize: "13px", fontWeight: 600 }}>Cell Details</h4>
              <button onClick={() => setDrawerOpen(false)} className="p-1 rounded hover:bg-muted">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {selectedCell ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground" style={{ fontSize: "11px" }}>Position</span>
                    <span style={{ fontSize: "12px", fontWeight: 500 }}>({selectedCell[0]}, {selectedCell[1]})</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground" style={{ fontSize: "11px" }}>State</span>
                    <span className={`px-2 py-0.5 rounded-full capitalize ${
                      grid[selectedCell[0]][selectedCell[1]] === "critical" ? "bg-red-100 text-red-600" :
                      grid[selectedCell[0]][selectedCell[1]] === "high" ? "bg-orange-100 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    }`} style={{ fontSize: "11px" }}>
                      {grid[selectedCell[0]][selectedCell[1]]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground" style={{ fontSize: "11px" }}>Risk Score</span>
                    <span style={{ fontSize: "12px", fontWeight: 500 }}>{(Math.random() * 100).toFixed(1)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-muted-foreground mb-2" style={{ fontSize: "11px", fontWeight: 500 }}>ADJACENCY</h4>
                  <div className="grid grid-cols-3 gap-1">
                    {[-1, 0, 1].map((dr) =>
                      [-1, 0, 1].map((dc) => {
                        const r = selectedCell[0] + dr;
                        const c = selectedCell[1] + dc;
                        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
                          return <div key={`${dr}-${dc}`} className="w-8 h-8 rounded-sm bg-muted/30" />;
                        }
                        return (
                          <div
                            key={`${dr}-${dc}`}
                            className={`w-8 h-8 rounded-sm ${cellColors[grid[r][c]]} ${dr === 0 && dc === 0 ? "ring-1 ring-qp-cyan" : ""}`}
                          />
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-muted-foreground mb-2" style={{ fontSize: "11px", fontWeight: 500 }}>RECOMMENDATION</h4>
                  <div className="p-3 rounded-lg bg-qp-cyan/5 border border-qp-cyan/20">
                    <p style={{ fontSize: "12px", lineHeight: 1.5, color: "#0e7490" }}>
                      Consider placing firebreak at this position. Adjacent cells show elevated risk with propagation potential.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-1 text-muted-foreground mb-2" style={{ fontSize: "11px", fontWeight: 500 }}>
                    <History className="w-3 h-3" /> HISTORY
                  </h4>
                  <div className="space-y-1.5">
                    {["State changed to high — 2h ago", "Annotation added — 5h ago", "Created — 2d ago"].map((note, i) => (
                      <p key={i} className="text-muted-foreground" style={{ fontSize: "11px" }}>{note}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground" style={{ fontSize: "12px" }}>Select a cell to view details</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
