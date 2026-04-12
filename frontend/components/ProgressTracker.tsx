"use client";

export type StepStatus = "pending" | "running" | "completed" | "failed";

export interface StepState {
  id: string;
  label: string;
  icon: string;
  status: StepStatus;
  error?: string;
}

interface Props {
  steps: StepState[];
}

const statusStyles: Record<StepStatus, string> = {
  pending: "bg-surface-0 shadow-[var(--shadow-neu-sm)] text-text-muted",
  running: "bg-surface-0 shadow-[var(--shadow-neu-hover)] text-accent",
  completed: "bg-surface-0 shadow-[var(--shadow-neu-inset)] text-[var(--color-status-completed)]",
  failed: "bg-surface-0 shadow-[var(--shadow-neu-inset)] text-[var(--color-status-failed)]",
};

const connectorStyles: Record<StepStatus, string> = {
  pending: "bg-surface-3",
  running: "bg-accent/40 animate-pulse",
  completed: "bg-[var(--color-status-completed)]/60",
  failed: "bg-[var(--color-status-failed)]/40",
};

export default function ProgressTracker({ steps }: Props) {
  return (
    <div className="space-y-0">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-stretch gap-4">
          <div className="flex flex-col items-center w-12 shrink-0">
            <div
              className={`relative flex items-center justify-center w-12 h-12 rounded-xl text-lg transition-all duration-500 ${statusStyles[step.status]}`}
            >
              {step.status === "running" && (
                <span className="absolute inset-0 rounded-xl shadow-[var(--shadow-neu-hover)] animate-ping opacity-20" />
              )}
              <span className="relative z-10">{step.icon}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-0.5 flex-1 min-h-6 transition-colors duration-500 ${connectorStyles[step.status]}`}
              />
            )}
          </div>

          <div className="pt-2.5 pb-6 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-text-primary">{step.label}</span>
              <StatusBadge status={step.status} />
            </div>
            {step.status === "running" && (
              <p className="mt-1 text-xs text-accent animate-pulse">Processing...</p>
            )}
            {step.status === "failed" && step.error && (
              <p className="mt-1 text-xs text-[var(--color-status-failed)]">{step.error}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: StepStatus }) {
  const styles: Record<StepStatus, string> = {
    pending: "text-text-muted bg-surface-2",
    running: "text-accent bg-[var(--color-status-running-bg)]",
    completed: "text-[var(--color-status-completed)] bg-[var(--color-status-completed-bg)]",
    failed: "text-[var(--color-status-failed)] bg-[var(--color-status-failed-bg)]",
  };
  const labels: Record<StepStatus, string> = {
    pending: "Waiting",
    running: "Running",
    completed: "Done",
    failed: "Failed",
  };
  return (
    <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
