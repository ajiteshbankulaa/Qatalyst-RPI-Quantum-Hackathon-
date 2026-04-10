import { useState } from "react";
import { Shield, Users, BarChart3, Palette, FileText, ChevronRight } from "lucide-react";

const members = [
  { name: "Jane Doe", email: "jane@quantumproj.io", role: "Admin", avatar: "JD" },
  { name: "Alex Kim", email: "alex@quantumproj.io", role: "Editor", avatar: "AK" },
  { name: "Sam Chen", email: "sam@quantumproj.io", role: "Viewer", avatar: "SC" },
];

const tabs = [
  { id: "workspace", label: "Workspace", icon: Shield },
  { id: "members", label: "Members", icon: Users },
  { id: "usage", label: "Usage & Limits", icon: BarChart3 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "audit", label: "Audit Log", icon: FileText },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("workspace");

  return (
    <div className="p-6">
      <h1 className="mb-6" style={{ fontSize: "20px", fontWeight: 600 }}>Settings</h1>

      <div className="flex gap-6">
        {/* Tab nav */}
        <div className="w-48 shrink-0 space-y-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                activeTab === t.id ? "bg-qp-navy text-white" : "text-muted-foreground hover:bg-muted"
              }`}
              style={{ fontSize: "13px" }}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === "workspace" && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="mb-4" style={{ fontSize: "15px", fontWeight: 600 }}>Workspace Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 500 }}>Workspace Name</label>
                    <input defaultValue="Wildfire West" className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-input-background" style={{ fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 500 }}>Description</label>
                    <textarea defaultValue="Western US wildfire risk modeling and intervention planning workspace." className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-input-background resize-none" rows={3} style={{ fontSize: "13px" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 500 }}>Default Solver</label>
                    <select className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-input-background" style={{ fontSize: "13px" }}>
                      <option>Hybrid (Auto)</option>
                      <option>Classical Only</option>
                      <option>Quantum Only</option>
                    </select>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-qp-navy text-white hover:bg-qp-slate transition-colors" style={{ fontSize: "13px" }}>
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Members</h3>
                <button className="px-3 py-1.5 rounded-lg bg-qp-navy text-white" style={{ fontSize: "12px" }}>Invite member</button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background">
                    {["Member", "Role", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-2.5 text-muted-foreground" style={{ fontSize: "11px", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.email} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-qp-navy flex items-center justify-center">
                          <span className="text-white" style={{ fontSize: "11px" }}>{m.avatar}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 500 }}>{m.name}</p>
                          <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{m.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full ${
                          m.role === "Admin" ? "bg-qp-violet/10 text-qp-violet" :
                          m.role === "Editor" ? "bg-qp-cyan/10 text-qp-cyan" :
                          "bg-muted text-muted-foreground"
                        }`} style={{ fontSize: "11px" }}>{m.role}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button className="text-muted-foreground hover:text-foreground" style={{ fontSize: "12px" }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "usage" && (
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="mb-4" style={{ fontSize: "15px", fontWeight: 600 }}>Compute Usage</h3>
                <div className="space-y-4">
                  {[
                    { label: "Benchmark Runs", used: 847, limit: 1000, unit: "runs" },
                    { label: "Quantum Minutes", used: 42.5, limit: 100, unit: "min" },
                    { label: "Storage", used: 2.3, limit: 10, unit: "GB" },
                    { label: "API Calls", used: 12400, limit: 50000, unit: "calls" },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: "13px" }}>{m.label}</span>
                        <span className="text-muted-foreground" style={{ fontSize: "12px" }}>{m.used} / {m.limit} {m.unit}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${(m.used / m.limit) > 0.8 ? "bg-qp-amber" : "bg-qp-cyan"}`}
                          style={{ width: `${(m.used / m.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="mb-4" style={{ fontSize: "15px", fontWeight: 600 }}>Theme</h3>
              <div className="flex gap-3">
                {[
                  { label: "Light", active: true },
                  { label: "Dark", active: false },
                  { label: "System", active: false },
                ].map((t) => (
                  <button
                    key={t.label}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      t.active ? "border-qp-cyan bg-qp-cyan/5" : "border-border hover:bg-muted"
                    }`}
                    style={{ fontSize: "13px" }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 style={{ fontSize: "15px", fontWeight: 600 }}>Audit Log</h3>
              </div>
              <div className="divide-y divide-border">
                {[
                  { action: "Benchmark run BM-094 completed", user: "System", time: "2h ago" },
                  { action: "Scenario SC-001 updated", user: "Jane Doe", time: "3h ago" },
                  { action: "Report RPT-012 generated", user: "Jane Doe", time: "5h ago" },
                  { action: "Member Alex Kim invited", user: "Jane Doe", time: "1d ago" },
                  { action: "IBM Quantum credentials updated", user: "Jane Doe", time: "2d ago" },
                  { action: "Workspace created", user: "Jane Doe", time: "2w ago" },
                ].map((log, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p style={{ fontSize: "12px" }}>{log.action}</p>
                      <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{log.user}</p>
                    </div>
                    <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
