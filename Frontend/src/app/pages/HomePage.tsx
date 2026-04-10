import { Link } from "react-router";
import { ArrowRight, Atom, Cpu, Flame, Layers, ShieldCheck, Target, TrendingUp } from "lucide-react";

export function HomePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4f8_0%,#f8fafc_42%,#f6f8fb_100%)] text-foreground">
      <header className="border-b border-white/70 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-qp-navy text-white">
              <Atom className="h-5 w-5 text-qp-cyan" />
            </div>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.02em]">QuantumProj</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Spatial decision intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link to="/app" className="rounded-2xl bg-qp-navy px-4 py-2 text-[13px] font-medium text-white">
              View platform
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-qp-cyan">Wildfire resilience first</p>
              <h1 className="mt-4 text-[46px] font-semibold tracking-[-0.05em] text-foreground">
                Model risk, forecast spread, optimize interventions, and benchmark solver integrity.
              </h1>
              <p className="mt-5 text-[16px] leading-8 text-muted-foreground">
                QuantumProj is a real decision platform for constrained spatial systems. It starts with wildfire grids, couples operational planning to solver comparison, and keeps qBraid central to the trust story for quantum recommendations.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/app" className="inline-flex items-center gap-2 rounded-2xl bg-qp-navy px-5 py-3 text-[14px] font-medium text-white">
                  Open platform <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login" className="rounded-2xl border border-border bg-white px-5 py-3 text-[14px] font-medium text-foreground">
                  Request demo
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(160deg,#101b31_0%,#162541_38%,#0f1729_100%)] p-8 shadow-[0_50px_120px_-65px_rgba(15,23,41,0.75)]">
              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 100 }).map((_, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded-sm ${
                      index === 45 || index === 46 || index === 55
                        ? "bg-red-400/80"
                        : index % 9 === 0
                        ? "bg-cyan-300/35"
                        : index % 5 === 0
                        ? "bg-amber-300/35"
                        : "bg-white/5"
                    }`}
                  />
                ))}
              </div>
              <div className="absolute inset-x-8 bottom-8 grid gap-3 md:grid-cols-3">
                {[
                  { label: "Risk modeling", value: "Classical / Quantum / Hybrid" },
                  { label: "Optimization scope", value: "Full grid + reduced quantum study" },
                  { label: "Benchmark posture", value: "Compiler-aware with degraded fallback" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/6 p-4 text-white">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">{item.label}</p>
                    <p className="mt-2 text-[13px] font-medium text-white/90">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-4">
            {[
              { icon: Layers, title: "Scenario setup", text: "Editable 10x10 wildfire grids, metadata, constraints, objectives, and versioned runs." },
              { icon: TrendingUp, title: "Forecast", text: "Time-step spread simulation with dryness, wind direction, and sensitivity controls." },
              { icon: Target, title: "Optimize", text: "Budget-constrained intervention placement with full-scale classical and reduced quantum study." },
              { icon: Cpu, title: "Benchmarks", text: "qBraid-centered execution integrity analysis across compilation strategies and targets." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-border bg-white/80 p-6">
                <item.icon className="h-5 w-5 text-qp-cyan" />
                <h2 className="mt-4 text-[18px] font-semibold tracking-[-0.03em]">{item.title}</h2>
                <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-border bg-white/85 p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-qp-violet">Why qBraid is central</p>
              <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.04em]">Benchmark trust comes from execution integrity, not decoration.</h2>
              <p className="mt-4 text-[14px] leading-7 text-muted-foreground">
                Quantum recommendations are only useful if the workload survives compilation and realistic execution constraints. QuantumProj uses qBraid as the backbone of its benchmark story so teams can compare strategy quality against compiled resource cost without pretending hardware success where it does not exist.
              </p>
            </div>
            <div className="rounded-[28px] border border-border bg-qp-navy p-8 text-white">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  "Reduced intervention QAOA workload tied to product optimization",
                  "Strategy A vs strategy B comparison",
                  "Ideal simulator, noisy simulator, and optional IBM execution",
                  "Approximation ratio, success probability, depth, width, and 2Q gate tracking",
                ].map((line) => (
                  <div key={line} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-[13px] leading-6 text-white/78">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-white/80 px-6 py-10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-8 text-[13px] text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Flame className="h-4 w-4 text-qp-amber" /> Wildfire resilience
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Honest degraded mode when hardware is unavailable
            </span>
            <span className="inline-flex items-center gap-2">
              <Cpu className="h-4 w-4 text-qp-cyan" /> Compiler-aware benchmark workflow
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
