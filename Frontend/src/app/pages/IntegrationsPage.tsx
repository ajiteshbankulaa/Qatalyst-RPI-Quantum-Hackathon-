import { api } from "../api";
import { EmptyState, LoadingState, PageHeader, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function IntegrationsPage() {
  const { data, loading, error, reload } = useAsyncData(api.integrations, []);

  if (loading) return <LoadingState label="Loading integrations..." />;
  if (error || !data) {
    return (
      <EmptyState
        title="Integrations unavailable"
        description={error ?? "Could not load integration status."}
        action={
          <button onClick={() => void reload()} className="rounded-2xl bg-qp-navy px-4 py-2 text-[13px] text-white">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Integrations"
        title="Execution and compiler connectivity"
        description="Visibility into qBraid, Qiskit, IBM Quantum, and simulator readiness. Missing credentials do not hard-fail the product; they produce a transparent degraded mode instead."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {data.providers.map((provider) => (
          <SectionPanel key={provider.provider} title={provider.provider} subtitle={provider.mode}>
            <div className="flex items-center justify-between">
              <StatusPill label={provider.available ? "Available" : "Unavailable"} tone={provider.available ? "good" : "warn"} />
            </div>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-[11px] leading-5 text-slate-100">
              {JSON.stringify(provider.details, null, 2)}
            </pre>
          </SectionPanel>
        ))}
      </div>
    </div>
  );
}
