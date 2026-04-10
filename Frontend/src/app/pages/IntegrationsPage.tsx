import { CheckCircle, AlertTriangle, ExternalLink, Settings } from "lucide-react";

const integrations = [
  {
    name: "IBM Quantum",
    desc: "Connect to IBM Quantum hardware and simulators via Qiskit Runtime",
    status: "connected",
    details: "IBM Eagle r3 · Last synced 5 min ago",
    logo: "IBM",
  },
  {
    name: "qBraid",
    desc: "Multi-framework quantum SDK with transpilation and execution services",
    status: "connected",
    details: "qBraid Lab · v0.7.2",
    logo: "qB",
  },
  {
    name: "Cloud Storage",
    desc: "Connect AWS S3, GCS, or Azure Blob for scenario and report storage",
    status: "not_connected",
    details: "No bucket configured",
    logo: "S3",
  },
  {
    name: "Internal API / Webhook",
    desc: "Send job notifications and results to your internal systems",
    status: "not_connected",
    details: "No endpoint configured",
    logo: "API",
  },
  {
    name: "IonQ",
    desc: "Access IonQ trapped-ion quantum hardware for benchmarking",
    status: "not_connected",
    details: "Coming soon",
    logo: "IQ",
  },
  {
    name: "Amazon Braket",
    desc: "Access multiple quantum hardware providers through AWS Braket",
    status: "not_connected",
    details: "Coming soon",
    logo: "AB",
  },
];

export function IntegrationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 style={{ fontSize: "20px", fontWeight: 600 }}>Integrations</h1>
        <p className="text-muted-foreground" style={{ fontSize: "13px" }}>Connect external services and quantum backends</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {integrations.map((int) => (
          <div key={int.name} className="bg-card rounded-xl border border-border p-5 flex gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              int.status === "connected" ? "bg-qp-cyan/10" : "bg-muted"
            }`}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: int.status === "connected" ? "#06b6d4" : "#636882" }}>
                {int.logo}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 style={{ fontSize: "14px", fontWeight: 600 }}>{int.name}</h3>
                {int.status === "connected" ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600" style={{ fontSize: "10px" }}>
                    <CheckCircle className="w-3 h-3" /> Connected
                  </span>
                ) : int.details === "Coming soon" ? (
                  <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground" style={{ fontSize: "10px" }}>Coming soon</span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600" style={{ fontSize: "10px" }}>
                    <AlertTriangle className="w-3 h-3" /> Not connected
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mb-2" style={{ fontSize: "12px", lineHeight: 1.5 }}>{int.desc}</p>
              <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{int.details}</p>
            </div>
            <div className="shrink-0">
              {int.status === "connected" ? (
                <button className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </button>
              ) : int.details !== "Coming soon" ? (
                <button className="px-3 py-1.5 rounded-lg bg-qp-navy text-white hover:bg-qp-slate transition-colors" style={{ fontSize: "12px" }}>
                  Connect
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* No credentials warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#92400e" }}>Simulator-only mode active</p>
          <p style={{ fontSize: "12px", color: "#a16207", lineHeight: 1.5 }}>
            No hardware credentials are configured. Benchmark runs will execute on ideal and noisy simulators only. Connect IBM Quantum or another hardware provider to enable hardware execution.
          </p>
        </div>
      </div>
    </div>
  );
}
