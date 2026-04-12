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
  pending: "border-zinc-200 bg-zinc-50 text-zinc-400",
  running: "border-blue-400 bg-blue-50 text-blue-600 shadow-md shadow-blue-100",
  completed: "border-emerald-400 bg-emerald-50 text-emerald-600",
  failed: "border-red-400 bg-red-50 text-red-600",
};

const connectorStyles: Record<StepStatus, string> = {
  pending: "bg-zinc-200",
  running: "bg-blue-300 animate-pulse",
  completed: "bg-emerald-400",
  failed: "bg-red-300",
};

export default function ProgressTracker({ steps }: Props) {
  return (
    <div className="space-y-0">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-stretch gap-4">
          {/* Timeline column */}
          <div className="flex flex-col items-center w-12 shrink-0">
            {/* Icon circle */}
            <div
              className={`relative flex items-center justify-center w-12 h-12 rounded-xl border-2 text-lg transition-all duration-500 ${statusStyles[step.status]}`}
            >
              {step.status === "running" && (
                <span className="absolute inset-0 rounded-xl border-2 border-blue-400 animate-ping opacity-30" />
              )}
              <span className="relative z-10">{step.icon}</span>
            </div>
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={`w-0.5 flex-1 min-h-6 transition-colors duration-500 ${connectorStyles[step.status]}`}
              />
            )}
          </div>

          {/* Content */}
          <div className="pt-2.5 pb-6 min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-zinc-900">{step.label}</span>
              <StatusBadge status={step.status} />
            </div>
            {step.status === "running" && (
              <p className="mt-1 text-xs text-blue-600 animate-pulse">Processing...</p>
            )}
            {step.status === "failed" && step.error && (
              <p className="mt-1 text-xs text-red-600">{step.error}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: StepStatus }) {
  const styles: Record<StepStatus, string> = {
    pending: "bg-zinc-100 text-zinc-500",
    running: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
  };
  const labels: Record<StepStatus, string> = {
    pending: "Waiting",
    running: "Running",
    completed: "Done",
    failed: "Failed",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
