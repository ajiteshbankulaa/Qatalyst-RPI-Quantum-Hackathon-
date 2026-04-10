import { Link } from "react-router";
import {
  Atom, ArrowRight, Shield, Layers, TrendingUp, Target, Cpu,
  Flame, Building2, Zap, Truck, Lock, CheckCircle, Eye
} from "lucide-react";

const steps = [
  { icon: Layers, title: "Model", desc: "Define spatial systems with grid or graph topologies, constraints, and environment variables." },
  { icon: TrendingUp, title: "Forecast", desc: "Simulate risk propagation through your system over configurable time horizons." },
  { icon: Target, title: "Optimize", desc: "Find the best limited interventions under budget and operational constraints." },
  { icon: Cpu, title: "Benchmark", desc: "Compare classical, quantum, and hybrid solvers under realistic execution conditions." },
];

const useCases = [
  { icon: Flame, title: "Wildfire Resilience", desc: "Model fire spread across terrain grids, optimize firebreak placement under budget constraints." },
  { icon: Building2, title: "Infrastructure Resilience", desc: "Identify cascading failure corridors in utility and transport networks." },
  { icon: Zap, title: "Utilities & Energy", desc: "Optimize grid hardening and load redistribution under failure scenarios." },
  { icon: Truck, title: "Logistics & Supply Chain", desc: "Model disruption propagation and optimize contingency routing." },
];

const modules = [
  { title: "Scenario Workspace", desc: "Visual spatial editor with grid and network canvas, constraint configuration, and environment controls." },
  { title: "Risk Modeling", desc: "Classical and quantum risk scoring with split comparison, confidence overlays, and feature importance." },
  { title: "Propagation Forecast", desc: "Time-series spread simulation with playback, corridor visualization, and hardware-aware engines." },
  { title: "Intervention Optimizer", desc: "Constrained optimization with ranked interventions, before/after comparison, and budget tracking." },
  { title: "Compiler-Aware Benchmarking", desc: "Execution integrity analysis across compilation strategies, frameworks, and quantum hardware targets." },
  { title: "Decision Reports", desc: "Auto-generated executive summaries with methodology, recommendations, and export controls." },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Atom className="w-5 h-5 text-qp-cyan" />
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#0f1729" }}>QuantumProj</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "13px" }}>How it works</a>
            <a href="#use-cases" className="text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "13px" }}>Use cases</a>
            <a href="#modules" className="text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "13px" }}>Platform</a>
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: "13px" }}>Sign in</Link>
            <Link
              to="/login"
              className="bg-qp-navy text-white px-4 py-1.5 rounded-lg hover:bg-qp-slate transition-colors"
              style={{ fontSize: "13px" }}
            >
              Request demo
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-qp-cyan/10 text-qp-cyan mb-6" style={{ fontSize: "12px", fontWeight: 500 }}>
              <Cpu className="w-3 h-3" /> Spatial Decision Intelligence
            </div>
            <h1 className="text-foreground mb-5" style={{ fontSize: "42px", fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Model risk. Forecast spread.<br />Optimize interventions.
            </h1>
            <p className="text-muted-foreground mb-8" style={{ fontSize: "17px", lineHeight: 1.6 }}>
              QuantumProj is an enterprise platform for spatial risk propagation analysis and constrained intervention planning—with compiler-aware benchmarking across classical, quantum, and hybrid solvers.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-qp-navy text-white px-5 py-2.5 rounded-lg hover:bg-qp-slate transition-colors"
                style={{ fontSize: "14px" }}
              >
                Request demo <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 border border-border text-foreground px-5 py-2.5 rounded-lg hover:bg-muted transition-colors"
                style={{ fontSize: "14px" }}
              >
                View platform
              </Link>
            </div>
          </div>

          {/* Hero visual */}
          <div className="mt-14 rounded-xl border border-border bg-gradient-to-br from-qp-navy via-[#1a2744] to-[#0c1220] p-8 relative overflow-hidden">
            <div className="grid grid-cols-10 gap-1 opacity-60">
              {Array.from({ length: 100 }).map((_, i) => {
                const risk = Math.random();
                const color = risk > 0.8 ? "bg-red-500/60" : risk > 0.5 ? "bg-amber-400/40" : risk > 0.2 ? "bg-cyan-400/20" : "bg-white/5";
                return <div key={i} className={`aspect-square rounded-sm ${color}`} />;
              })}
            </div>
            {/* Overlay nodes */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="400" height="200" className="opacity-30">
                <line x1="50" y1="50" x2="200" y2="30" stroke="#06b6d4" strokeWidth="1" />
                <line x1="200" y1="30" x2="350" y2="80" stroke="#06b6d4" strokeWidth="1" />
                <line x1="200" y1="30" x2="150" y2="150" stroke="#8b5cf6" strokeWidth="1" />
                <line x1="150" y1="150" x2="300" y2="170" stroke="#8b5cf6" strokeWidth="1" />
                <line x1="350" y1="80" x2="300" y2="170" stroke="#06b6d4" strokeWidth="1" />
                <circle cx="50" cy="50" r="4" fill="#06b6d4" />
                <circle cx="200" cy="30" r="5" fill="#06b6d4" />
                <circle cx="350" cy="80" r="4" fill="#8b5cf6" />
                <circle cx="150" cy="150" r="4" fill="#8b5cf6" />
                <circle cx="300" cy="170" r="5" fill="#06b6d4" />
              </svg>
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-3" style={{ fontSize: "11px" }}>
              <span className="flex items-center gap-1 text-red-400"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Critical</span>
              <span className="flex items-center gap-1 text-amber-300"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Elevated</span>
              <span className="flex items-center gap-1 text-cyan-300"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Low</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <p className="text-qp-cyan mb-2" style={{ fontSize: "13px", fontWeight: 500 }}>WORKFLOW</p>
          <h2 className="text-foreground mb-10" style={{ fontSize: "28px", fontWeight: 600 }}>How it works</h2>
          <div className="grid grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="w-10 h-10 rounded-lg bg-qp-cyan/10 flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-qp-cyan" />
                </div>
                <div className="text-muted-foreground mb-1" style={{ fontSize: "12px", fontWeight: 500 }}>Step {i + 1}</div>
                <h3 className="text-foreground mb-2" style={{ fontSize: "17px", fontWeight: 600 }}>{step.title}</h3>
                <p className="text-muted-foreground" style={{ fontSize: "13px", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-qp-violet mb-2" style={{ fontSize: "13px", fontWeight: 500 }}>INDUSTRIES</p>
          <h2 className="text-foreground mb-10" style={{ fontSize: "28px", fontWeight: 600 }}>Built for critical infrastructure</h2>
          <div className="grid grid-cols-2 gap-4">
            {useCases.map((uc) => (
              <div key={uc.title} className="p-6 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
                <uc.icon className="w-5 h-5 text-qp-violet mb-3" />
                <h3 className="text-foreground mb-1.5" style={{ fontSize: "15px", fontWeight: 600 }}>{uc.title}</h3>
                <p className="text-muted-foreground" style={{ fontSize: "13px", lineHeight: 1.6 }}>{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why benchmark */}
      <section className="py-20 px-6 bg-qp-navy text-white">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-lg">
            <p className="text-qp-cyan mb-2" style={{ fontSize: "13px", fontWeight: 500 }}>BENCHMARKING</p>
            <h2 className="mb-4" style={{ fontSize: "28px", fontWeight: 600 }}>Why benchmark classical vs quantum?</h2>
            <p className="text-white/60 mb-6" style={{ fontSize: "14px", lineHeight: 1.7 }}>
              Quantum advantage isn't binary. Real workloads pass through compilers, noise models, and hardware constraints that can erode theoretical gains. QuantumProj benchmarks solver integrity under realistic execution conditions—so you know what actually works.
            </p>
            <div className="space-y-3">
              {["Compiler-aware circuit analysis", "Framework-to-framework comparison", "Noise-model fidelity tracking", "Cost vs quality tradeoff visualization"].map((item) => (
                <div key={item} className="flex items-center gap-2" style={{ fontSize: "13px" }}>
                  <CheckCircle className="w-4 h-4 text-qp-cyan shrink-0" />
                  <span className="text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product modules */}
      <section id="modules" className="py-20 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <p className="text-qp-cyan mb-2" style={{ fontSize: "13px", fontWeight: 500 }}>PLATFORM</p>
          <h2 className="text-foreground mb-10" style={{ fontSize: "28px", fontWeight: 600 }}>Product modules</h2>
          <div className="grid grid-cols-3 gap-4">
            {modules.map((m) => (
              <div key={m.title} className="p-5 rounded-xl border border-border bg-card">
                <h3 className="text-foreground mb-2" style={{ fontSize: "14px", fontWeight: 600 }}>{m.title}</h3>
                <p className="text-muted-foreground" style={{ fontSize: "13px", lineHeight: 1.6 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-12 px-6 border-y border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-12">
          {[
            { icon: Lock, label: "SOC 2 Compliant" },
            { icon: Shield, label: "End-to-end encryption" },
            { icon: Eye, label: "Full audit logging" },
            { icon: CheckCircle, label: "Role-based access" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: "13px" }}>
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-foreground mb-4" style={{ fontSize: "28px", fontWeight: 600 }}>Ready to model your next decision?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto" style={{ fontSize: "14px", lineHeight: 1.6 }}>
            See how QuantumProj can help your organization make better spatial decisions under uncertainty.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/login"
              className="bg-qp-navy text-white px-6 py-2.5 rounded-lg hover:bg-qp-slate transition-colors"
              style={{ fontSize: "14px" }}
            >
              Request demo
            </Link>
            <Link
              to="/app"
              className="border border-border text-foreground px-6 py-2.5 rounded-lg hover:bg-muted transition-colors"
              style={{ fontSize: "14px" }}
            >
              View platform
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border bg-background">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Atom className="w-4 h-4 text-qp-cyan" />
            <span style={{ fontSize: "13px", fontWeight: 500 }}>QuantumProj</span>
          </div>
          <p className="text-muted-foreground" style={{ fontSize: "12px" }}>© 2026 QuantumProj Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
