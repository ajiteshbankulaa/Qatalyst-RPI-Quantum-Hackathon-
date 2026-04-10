import { api } from "../api";
import { EmptyState, LoadingState, PageHeader, SectionPanel, StatusPill } from "../components/product";
import { useAsyncData } from "../useAsyncData";

export function SettingsPage() {
  const { data, loading, error } = useAsyncData(
    async () => {
      const [health, integrations] = await Promise.all([api.health(), api.integrations()]);
      return { health, integrations };
    },
    [],
  );

  if (loading) return <LoadingState label="Loading settings..." />;
  if (error || !data) return <EmptyState title="Settings unavailable" description={error ?? "Could not load settings state."} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="MVP settings are intentionally narrow: service health, execution posture, and workspace operating assumptions. Storage remains SQLite-backed with a clean migration path to PostgreSQL."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionPanel title="Service health" subtitle="FastAPI backend health endpoint">
          <div className="flex items-center gap-3">
            <StatusPill label={data.health.status} tone="good" />
            <p className="text-[13px] text-muted-foreground">{data.health.app}</p>
          </div>
        </SectionPanel>

        <SectionPanel title="Execution defaults" subtitle="Current runtime behavior for this workspace">
          <ul className="space-y-3 text-[13px] text-muted-foreground">
            <li>Primary wedge: wildfire resilience on 10x10 editable grids.</li>
            <li>Persistence: SQLite with typed API contracts and modular services.</li>
            <li>Fallback policy: simulator-only mode when IBM credentials are missing.</li>
            <li>Benchmark policy: qBraid-centered execution integrity only when actual capability exists.</li>
          </ul>
        </SectionPanel>
      </div>

      <SectionPanel title="Provider snapshot" subtitle="Mirrors the integrations page for operational visibility">
        <div className="flex flex-wrap gap-2">
          {data.integrations.providers.map((provider) => (
            <StatusPill key={provider.provider} label={`${provider.provider}: ${provider.mode}`} tone={provider.available ? "good" : "warn"} />
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}
