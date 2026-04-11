import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import {
  Atom,
  Cpu,
  FileText,
  LayoutDashboard,
  Layers,
  Plug,
  Settings,
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
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/70 bg-white/80 px-5 py-4 backdrop-blur xl:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">QuantumProj</p>
                <h1 className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-foreground">{activeLabel}</h1>
              </div>
              <div className="flex flex-1 items-center gap-3 lg:justify-end">
                {integrations ? (
                  <StatusPill label={integrations.simulator_only ? "Simulator only" : "Hardware ready"} tone={integrations.simulator_only ? "warn" : "good"} />
                ) : null}
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
