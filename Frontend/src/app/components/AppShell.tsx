import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard, Layers, AlertTriangle, TrendingUp, Target, Cpu,
  FileText, Plug, Settings, Search, Bell, ChevronDown, Menu, X,
  Atom, LogOut, User
} from "lucide-react";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="h-screen flex bg-background overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside
        className={`${sidebarCollapsed ? "w-16" : "w-56"} bg-sidebar flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <Atom className="w-6 h-6 text-qp-cyan shrink-0" />
          {!sidebarCollapsed && (
            <span className="ml-2.5 text-white tracking-tight" style={{ fontSize: "15px", fontWeight: 600 }}>
              QuantumProj
            </span>
          )}
        </div>

        {/* Workspace switcher */}
        {!sidebarCollapsed && (
          <div className="px-3 py-3 border-b border-sidebar-border">
            <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-sidebar-accent text-sidebar-foreground hover:bg-white/10 transition-colors">
              <div className="w-5 h-5 rounded bg-qp-violet/30 flex items-center justify-center" style={{ fontSize: "10px", color: "#c4b5fd" }}>
                W
              </div>
              <span style={{ fontSize: "13px" }}>Wildfire West</span>
              <ChevronDown className="w-3 h-3 ml-auto opacity-50" />
            </button>
          </div>
        )}

        <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/app" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                style={{ fontSize: "13px" }}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-1.5 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-card border-b border-border flex items-center px-5 gap-4 shrink-0">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-input-background cursor-pointer hover:bg-muted transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground" style={{ fontSize: "13px" }}>
                Search scenarios, reports...
              </span>
              <kbd className="ml-auto text-muted-foreground bg-white/80 px-1.5 py-0.5 rounded border border-border" style={{ fontSize: "10px" }}>
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-qp-cyan rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-qp-navy flex items-center justify-center">
                  <span className="text-white" style={{ fontSize: "11px", fontWeight: 500 }}>JD</span>
                </div>
                {!sidebarCollapsed && <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <p style={{ fontSize: "13px", fontWeight: 500 }}>Jane Doe</p>
                    <p className="text-muted-foreground" style={{ fontSize: "12px" }}>jane@quantumproj.io</p>
                  </div>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2" style={{ fontSize: "13px" }}>
                    <User className="w-3.5 h-3.5" /> Profile
                  </button>
                  <button className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2" style={{ fontSize: "13px" }}>
                    <Settings className="w-3.5 h-3.5" /> Settings
                  </button>
                  <div className="border-t border-border mt-1 pt-1">
                    <Link to="/login" className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 text-destructive" style={{ fontSize: "13px" }}>
                      <LogOut className="w-3.5 h-3.5" /> Sign out
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Click outside to close user menu */}
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </div>
  );
}
