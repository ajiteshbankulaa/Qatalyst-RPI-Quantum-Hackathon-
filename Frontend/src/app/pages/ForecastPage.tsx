import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Clock, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const spreadData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}h`,
  classical: Math.min(100, 5 + i * 3.2 + Math.random() * 8),
  hybrid: Math.min(100, 5 + i * 2.5 + Math.random() * 6),
}));

const metricsOverTime = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}h`,
  affected: Math.round(i * 4.2 + Math.random() * 3),
  threshold: 60,
}));

export function ForecastPage() {
  const [timeStep, setTimeStep] = useState(12);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState<"current-projected" | "classical-hybrid">("current-projected");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Propagation Forecast</h1>
          <p className="text-muted-foreground" style={{ fontSize: "13px" }}>Sierra Nevada — Risk spread simulation over 72h horizon</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5">
            <button onClick={() => setMode("current-projected")} className={`px-3 py-1 rounded ${mode === "current-projected" ? "bg-muted" : ""}`} style={{ fontSize: "12px" }}>Current vs Projected</button>
            <button onClick={() => setMode("classical-hybrid")} className={`px-3 py-1 rounded ${mode === "classical-hybrid" ? "bg-muted" : ""}`} style={{ fontSize: "12px" }}>Classical vs Hybrid</button>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button onClick={() => setTimeStep(0)} className="p-1.5 rounded-lg hover:bg-muted"><SkipBack className="w-4 h-4" /></button>
            <button onClick={() => setPlaying(!playing)} className="p-2 rounded-lg bg-qp-navy text-white hover:bg-qp-slate">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={() => setTimeStep(23)} className="p-1.5 rounded-lg hover:bg-muted"><SkipForward className="w-4 h-4" /></button>
          </div>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={23}
              value={timeStep}
              onChange={(e) => setTimeStep(Number(e.target.value))}
              className="w-full accent-qp-cyan"
            />
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground" style={{ fontSize: "10px" }}>0h</span>
              <span style={{ fontSize: "11px", fontWeight: 500 }}>T = {timeStep}h</span>
              <span className="text-muted-foreground" style={{ fontSize: "10px" }}>72h</span>
            </div>
          </div>
          <div className="text-right">
            <p style={{ fontSize: "12px", fontWeight: 500 }}>Hour {timeStep}</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{Math.round(timeStep * 4.2)} cells affected</p>
          </div>
        </div>
      </div>

      {/* Side by side heatmaps */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: mode === "current-projected" ? "Current State" : "Classical Forecast", step: 0 },
          { label: mode === "current-projected" ? `Projected (T+${timeStep}h)` : `Hybrid Forecast (T+${timeStep}h)`, step: timeStep },
        ].map((panel) => (
          <div key={panel.label} className="bg-card rounded-xl border border-border p-5">
            <h3 className="mb-3" style={{ fontSize: "13px", fontWeight: 600 }}>{panel.label}</h3>
            <div className="grid grid-cols-10 gap-0.5">
              {Array.from({ length: 100 }).map((_, i) => {
                const baseRisk = Math.random();
                const propagated = Math.min(1, baseRisk + (panel.step / 72) * 0.4);
                const risk = panel.step === 0 ? baseRisk : propagated;
                const color = risk > 0.8 ? "bg-red-500" : risk > 0.6 ? "bg-orange-400" : risk > 0.35 ? "bg-amber-300" : risk > 0.15 ? "bg-cyan-200" : "bg-slate-100";
                return <div key={i} className={`aspect-square rounded-[2px] ${color}`} style={{ opacity: 0.3 + risk * 0.7 }} />;
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Spread corridor chart */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Spread Area Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={spreadData}>
              <defs>
                <linearGradient id="classicalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="hybridGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#636882" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#636882" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="classical" stroke="#3b82f6" strokeWidth={2} fill="url(#classicalGrad)" />
              <Area type="monotone" dataKey="hybrid" stroke="#06b6d4" strokeWidth={2} fill="url(#hybridGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1" style={{ fontSize: "11px" }}><span className="w-2 h-2 rounded-full bg-blue-500" /> Classical</span>
            <span className="flex items-center gap-1" style={{ fontSize: "11px" }}><span className="w-2 h-2 rounded-full bg-qp-cyan" /> Hybrid</span>
          </div>
        </div>

        {/* Summary metrics */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="mb-3" style={{ fontSize: "14px", fontWeight: 600 }}>Summary Metrics</h3>
            <div className="space-y-3">
              {[
                { label: "Projected Spread Area", value: `${Math.round(timeStep * 4.2)} cells` },
                { label: "Affected Nodes", value: `${Math.round(timeStep * 2.8)}` },
                { label: "Time to Threshold", value: "14.3h" },
                { label: "Peak Propagation Rate", value: "5.2 cells/h" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground" style={{ fontSize: "12px" }}>{m.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="mb-3" style={{ fontSize: "14px", fontWeight: 600 }}>Model Diagnostics</h3>
            <div className="space-y-2">
              {[
                { label: "Convergence", value: "98.2%" },
                { label: "Iterations", value: "1,247" },
                { label: "Residual Error", value: "0.003" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground" style={{ fontSize: "12px" }}>{m.label}</span>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-qp-navy/5 border border-qp-navy/10 rounded-xl p-4">
            <p className="text-muted-foreground" style={{ fontSize: "11px", lineHeight: 1.5 }}>
              <span style={{ fontWeight: 500, color: "#1a1d2e" }}>Hardware-aware engine:</span> Propagation model accounts for compilation overhead and execution noise when using quantum backends.
            </p>
          </div>
        </div>
      </div>

      {/* Simulation settings */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="mb-4" style={{ fontSize: "14px", fontWeight: 600 }}>Simulation Settings</h3>
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: "Time Horizon", value: "72 hours" },
            { label: "Time Step", value: "1 hour" },
            { label: "Propagation Model", value: "Markov Chain" },
            { label: "Backend", value: "Hybrid (auto)" },
          ].map((s) => (
            <div key={s.label}>
              <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{s.label}</span>
              <div className="mt-1 px-3 py-1.5 rounded-lg bg-input-background border border-border flex items-center justify-between" style={{ fontSize: "12px" }}>
                {s.value} <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
