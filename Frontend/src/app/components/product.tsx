import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import type { CellState } from "../types";

const stateStyles: Record<CellState, string> = {
  empty: "bg-white border-slate-200",
  dry_brush: "bg-amber-200 border-amber-300",
  tree: "bg-emerald-200 border-emerald-300",
  water: "bg-sky-200 border-sky-300",
  protected: "bg-cyan-200 border-cyan-300",
  intervention: "bg-violet-200 border-violet-300",
  ignition: "bg-red-300 border-red-400",
};

const stateLabels: Record<CellState, string> = {
  empty: "Empty",
  dry_brush: "Dry Brush",
  tree: "Tree",
  water: "Water",
  protected: "Protected",
  intervention: "Intervention",
  ignition: "Ignition",
};

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function toastSuccess(message: string, description?: string) {
  toast.success(message, { description });
}

export function toastError(message: string, description?: string) {
  toast.error(message, { description });
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-qp-cyan">{eyebrow}</p> : null}
        <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-foreground">{title}</h1>
        {description ? <p className="mt-2 text-[13px] leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionPanel({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("rounded-2xl border border-border bg-card/90 p-5 shadow-[0_20px_60px_-42px_rgba(15,23,41,0.35)]", className)}>
      {title ? (
        <div className="mb-4">
          <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-[12px] leading-5 text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white/80 p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-[24px] font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-[12px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warn" | "accent" }) {
  const toneClass =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700"
      : tone === "accent"
        ? "bg-cyan-50 text-cyan-700"
        : "bg-slate-100 text-slate-600";
  return <span className={cx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium", toneClass)}>{label}</span>;
}

export function Notice({
  tone = "info",
  title,
  description,
}: {
  tone?: "info" | "success" | "warn" | "error";
  title: string;
  description: string;
}) {
  const styles =
    tone === "success"
      ? {
          wrap: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
          icon: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />,
        }
      : tone === "warn"
        ? {
            wrap: "border-amber-200 bg-amber-50/80 text-amber-900",
            icon: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />,
          }
        : tone === "error"
          ? {
              wrap: "border-red-200 bg-red-50/80 text-red-900",
              icon: <XCircle className="mt-0.5 h-4 w-4 shrink-0" />,
            }
          : {
              wrap: "border-cyan-200 bg-cyan-50/70 text-cyan-900",
              icon: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />,
            };
  return (
    <div className={cx("rounded-2xl border px-4 py-3 text-[12px]", styles.wrap)}>
      <div className="flex items-start gap-3">
        {styles.icon}
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 leading-5">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function SimulatorBanner({ simulatorOnly, qbraidReady }: { simulatorOnly: boolean; qbraidReady: boolean }) {
  if (!simulatorOnly && qbraidReady) {
    return null;
  }
  return (
    <Notice
      tone="warn"
      title="Simulator-only mode"
      description={
        !qbraidReady
          ? "IBM hardware execution is unavailable and qBraid or Qiskit readiness is incomplete. Benchmark outputs stay honest and degraded states are labeled explicitly."
          : "IBM hardware execution is unavailable. The workflow stays usable through simulator-backed execution and the UI labels hardware availability clearly."
      }
    />
  );
}

export function LoadingState({ label = "Loading workspace data..." }: { label?: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/50">
      <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 text-center">
      <AlertTriangle className="h-6 w-6 text-qp-cyan" />
      <h3 className="mt-4 text-[16px] font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-[13px] leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ScenarioGrid({
  grid,
  selected,
  onSelect,
  editable = false,
  brushState,
  scoreLookup,
}: {
  grid: CellState[][];
  selected?: [number, number] | null;
  onSelect?: (row: number, col: number) => void;
  editable?: boolean;
  brushState?: CellState;
  scoreLookup?: Record<string, number>;
}) {
  return (
    <div className="rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,247,250,0.92))] p-6">
      <div className="grid grid-cols-10 gap-1.5">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const score = scoreLookup?.[`${rowIndex}-${colIndex}`];
            const isSelected = selected?.[0] === rowIndex && selected?.[1] === colIndex;
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                type="button"
                onClick={() => onSelect?.(rowIndex, colIndex)}
                className={cx(
                  "relative aspect-square rounded-md border transition-all",
                  stateStyles[cell],
                  editable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-sm" : "cursor-default",
                  isSelected && "ring-2 ring-qp-cyan ring-offset-2 ring-offset-background",
                )}
                title={`${rowIndex},${colIndex} - ${stateLabels[cell]}${brushState && editable ? ` -> ${stateLabels[brushState]}` : ""}`}
              >
                {typeof score === "number" ? (
                  <span className="absolute inset-x-0 bottom-1 text-center text-[9px] font-semibold text-slate-700">
                    {(score * 100).toFixed(0)}
                  </span>
                ) : null}
              </button>
            );
          }),
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.entries(stateStyles) as [CellState, string][]).map(([state, cls]) => (
          <div key={state} className="flex items-center gap-1.5">
            <div className={cx("h-3 w-3 rounded-sm border", cls)} />
            <span className="text-[10px] text-muted-foreground">{stateLabels[state]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
