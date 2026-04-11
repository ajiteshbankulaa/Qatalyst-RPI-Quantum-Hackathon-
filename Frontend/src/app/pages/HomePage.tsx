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
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Wildfire resilience planning</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-qp-cyan">For wildfire planning teams</p>
              <h1 className="mt-4 text-[46px] font-semibold tracking-[-0.05em] text-foreground">
                Plan wildfire interventions with risk maps, spread forecasts, and benchmark-backed quantum evidence.
              </h1>
              <p className="mt-5 text-[16px] leading-8 text-muted-foreground">
                QuantumProj helps resilience analysts, land managers, and research teams work through one clear flow on a 10x10 hillside grid: define the fire-prone terrain, score local risk, simulate spread, place limited fire-resistant interventions, and verify that the quantum optimization workflow still behaves well after qBraid-centered compilation.
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
                  { label: "Risk map", value: "Classical, quantum, and hybrid scoring on one hillside" },
                  { label: "Intervention plan", value: "Full-grid baseline plus reduced quantum study" },
                  { label: "Benchmark integrity", value: "qBraid-centered compilation across simulators and IBM" },
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
              { icon: Layers, title: "Build the hillside scenario", text: "Edit a 10x10 wildfire grid, set the intervention budget, and save a versioned planning case." },
              { icon: TrendingUp, title: "Forecast spread pressure", text: "Project fire propagation under explicit dryness, wind, and sensitivity assumptions." },
              { icon: Target, title: "Place limited interventions", text: "Recommend where scarce fire-resistant actions should go to break likely spread paths." },
              { icon: Cpu, title: "Validate benchmark integrity", text: "Use qBraid-centered benchmarking to test whether compiled quantum workloads still preserve useful optimization behavior." },
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
              <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.04em]">The benchmark layer exists to answer one practical question: can this quantum recommendation be trusted after compilation?</h2>
              <p className="mt-4 text-[14px] leading-7 text-muted-foreground">
                Quantum recommendations are not useful if they only look good before compilation. QuantumProj keeps qBraid in the center of the workflow so teams can compare strategy quality against compiled resource cost, then see whether the reduced wildfire intervention workload still behaves well on simulators and available IBM hardware.
              </p>
            </div>
            <div className="rounded-[28px] border border-border bg-qp-navy p-8 text-white">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  "Reduced wildfire-intervention QAOA workload tied directly to the planning module",
                  "Two qBraid compilation strategies compared side by side",
                  "Ideal simulator, noisy simulator, and IBM execution when available",
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
              <Flame className="h-4 w-4 text-qp-amber" /> Wildfire resilience planning
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
