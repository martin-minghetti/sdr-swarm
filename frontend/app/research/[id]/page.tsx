"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import { getResearch, getStreamUrl, type Research, type StepResult } from "@/lib/api";
import { subscribeToStream } from "@/lib/sse";
import ProgressTracker, { type StepState } from "@/components/ProgressTracker";
import ResultTabs from "@/components/ResultTabs";

const STEP_DEFS = [
  { id: "researcher", label: "Researcher", icon: "\uD83D\uDD0D" },
  { id: "analyst", label: "Analyst", icon: "\uD83D\uDCCA" },
  { id: "writer", label: "Writer", icon: "\u270D\uFE0F" },
  { id: "scorer", label: "Scorer", icon: "\u2705" },
];

function buildSteps(statuses: Record<string, "pending" | "running" | "completed" | "failed">, errors: Record<string, string>): StepState[] {
  return STEP_DEFS.map((def) => ({
    ...def,
    status: statuses[def.id] || "pending",
    error: errors[def.id],
  }));
}

export default function ResearchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [research, setResearch] = useState<Research | null>(null);
  const [results, setResults] = useState<StepResult[]>([]);
  const [stepStatuses, setStepStatuses] = useState<Record<string, "pending" | "running" | "completed" | "failed">>({});
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscribedRef = useRef(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function init() {
      try {
        const data = await getResearch(id);
        setResearch(data.research);
        setResults(data.results);

        if (["completed", "partial", "failed"].includes(data.research.status)) {
          const statuses: Record<string, "pending" | "running" | "completed" | "failed"> = {};
          for (const r of data.results) {
            statuses[r.step] = "completed";
          }
          if (data.research.status === "failed") {
            for (const def of STEP_DEFS) {
              if (!statuses[def.id]) {
                statuses[def.id] = "failed";
                break;
              }
            }
          }
          setStepStatuses(statuses);
          setComplete(true);
          return;
        }

        if (!subscribedRef.current) {
          subscribedRef.current = true;
          cleanup = subscribeToStream(getStreamUrl(id), {
            onStepStart: (step) => {
              setStepStatuses((prev) => ({ ...prev, [step]: "running" }));
            },
            onStepComplete: (step) => {
              setStepStatuses((prev) => ({ ...prev, [step]: "completed" }));
            },
            onStepError: (step, err) => {
              setStepStatuses((prev) => ({ ...prev, [step]: "failed" }));
              setStepErrors((prev) => ({ ...prev, [step]: err }));
            },
            onResearchComplete: async () => {
              try {
                const final = await getResearch(id);
                setResearch(final.research);
                setResults(final.results);
              } catch {
                // Results will show what we have
              }
              setComplete(true);
            },
            onError: () => {
              getResearch(id)
                .then((final) => {
                  setResearch(final.research);
                  setResults(final.results);
                  if (["completed", "partial", "failed"].includes(final.research.status)) {
                    setComplete(true);
                  }
                })
                .catch(() => setError("Lost connection to research stream."));
            },
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load research.");
      }
    }

    init();
    return () => cleanup?.();
  }, [id]);

  const steps = buildSteps(stepStatuses, stepErrors);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/history"
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            &larr; All Researches
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-text-primary">
            {research?.input_data?.company_name || "Loading..."}
          </h1>
          {research && (
            <p className="mt-0.5 text-xs text-text-muted">
              Started {new Date(research.created_at).toLocaleString()}
            </p>
          )}
        </div>
        {research && <StatusPill status={research.status} />}
      </div>

      {error && (
        <div className="mb-6 rounded-xl shadow-[var(--shadow-neu-inset)] px-4 py-3 text-sm text-[var(--color-status-failed)]">
          {error}
        </div>
      )}

      {!complete && (
        <div className="mb-8 rounded-2xl bg-surface-0 p-6 shadow-[var(--shadow-neu-raised)] animate-fade-in">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Pipeline Progress</h2>
          <ProgressTracker steps={steps} />
        </div>
      )}

      {complete && results.length > 0 && (
        <div className="rounded-2xl bg-surface-0 p-6 shadow-[var(--shadow-neu-raised)] animate-fade-in">
          <ResultTabs results={results} />
        </div>
      )}

      {!complete && !error && results.length === 0 && Object.keys(stepStatuses).length === 0 && (
        <div className="text-center py-12 text-text-muted text-sm">
          Connecting to research pipeline...
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "text-[var(--color-status-pending)] bg-[var(--color-status-pending-bg)]",
    running: "text-[var(--color-status-running)] bg-[var(--color-status-running-bg)]",
    completed: "text-[var(--color-status-completed)] bg-[var(--color-status-completed-bg)]",
    partial: "text-[var(--color-status-partial)] bg-[var(--color-status-partial-bg)]",
    failed: "text-[var(--color-status-failed)] bg-[var(--color-status-failed-bg)]",
  };
  return (
    <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-semibold capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
