import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  Atom,
  Bell,
  ChevronDown,
  Cpu,
  FileText,
  LayoutDashboard,
  Layers,
  LogOut,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { api } from "../api";
import { SimulatorBanner, StatusPill, cx } from "./product";
import { useAsyncData } from "../useAsyncData";

const navItems = [
  { path: "/app", label: "Overview", icon: LayoutDashboard },
  { path: "/app/scenarios", label: "Scenarios", icon: Layers },
  { path: "/app/risk", label: "Risk", icon: AlertTriangle },
  { path: "/app/forecast", label: "Forecast", icon: TrendingUp },
  { path: "/app/optimize", label: "Optimize", icon: Target },
  { path: "/app/benchmarks", label: "Benchmarks", icon: Cpu },
  { path: "/app/reports", label: "Reports", icon: FileText },
  { path: "/app/integrations", label: "Integrations", icon: Plug },
  { path: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const { data: integrations } = useAsyncData(api.integrations, []);

  const activeLabel = useMemo(
    () => navItems.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))?.label ?? "Workspace",
    [location.pathname],
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.08),transparent_28%),linear-gradient(180deg,#f7f9fc_0%,#eef2f7_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[280px] shrink-0 border-r border-white/60 bg-[linear-gradient(180deg,#0f1729_0%,#111f36_100%)] px-5 py-6 text-white lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
              <Atom className="h-5 w-5 text-qp-cyan" />
            </div>
            <div>
              <p className="text-[15px] font-semibold">QuantumProj</p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Wildfire resilience</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Workspace</p>
                <p className="mt-2 text-[15px] font-medium">Wildfire West</p>
              </div>
              <ChevronDown className="h-4 w-4 text-white/50" />
            </div>
            <p className="mt-3 text-[12px] leading-5 text-white/58">
              Scenario setup, solver comparison, and compiler-aware benchmarking in one operating surface.
            </p>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cx(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-[13px] transition-colors",
                    active ? "bg-white text-slate-900 shadow-sm" : "text-white/70 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-qp-cyan" />
              <p className="text-[13px] font-medium">Execution integrity</p>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-white/55">
              Benchmark runs are labeled by actual availability. Hardware and qBraid capability are never inferred from placeholders.
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 px-5 py-4 backdrop-blur xl:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">QuantumProj</p>
                <h1 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-foreground">{activeLabel}</h1>
              </div>
              <div className="flex flex-1 items-center gap-3 lg:justify-end">
                <div className="flex w-full max-w-[420px] items-center gap-2 rounded-2xl border border-border bg-white px-4 py-2.5">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search scenarios or run IDs"
                    className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {integrations ? (
                  <StatusPill label={integrations.simulator_only ? "Simulator only" : "Hardware ready"} tone={integrations.simulator_only ? "warn" : "good"} />
                ) : null}
                <button className="rounded-2xl border border-border bg-white p-2.5 text-muted-foreground transition-colors hover:text-foreground">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="hidden items-center gap-3 rounded-2xl border border-border bg-white px-3 py-2.5 md:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-qp-navy text-[12px] font-semibold text-white">
                    JD
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">Jane Doe</p>
                    <p className="text-[11px] text-muted-foreground">Platform lead</p>
                  </div>
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 xl:px-8">
            {integrations ? (
              <div className="mb-6">
                <SimulatorBanner simulatorOnly={integrations.simulator_only} qbraidReady={integrations.qbraid_ready} />
              </div>
            ) : null}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
