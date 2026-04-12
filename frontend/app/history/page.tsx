"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHistory, type Research } from "@/lib/api";

export default function HistoryPage() {
  const [researches, setResearches] = useState<Research[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHistory()
      .then((res) => setResearches(res.researches))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-text-primary tracking-tight mb-8">
        Research History
      </h1>

      {loading && (
        <div className="text-center py-12 text-text-muted text-sm">Loading...</div>
      )}

      {error && (
        <div className="rounded-xl shadow-[var(--shadow-neu-inset)] px-4 py-3 text-sm text-[var(--color-status-failed)]">
          {error}
        </div>
      )}

      {!loading && !error && researches.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted text-sm">No researches yet.</p>
          <Link
            href="/new"
            className="mt-3 inline-flex items-center text-sm font-medium text-accent hover:text-accent-dim transition-colors"
          >
            Start your first research &rarr;
          </Link>
        </div>
      )}

      {!loading && researches.length > 0 && (
        <div className="space-y-3">
          {researches.map((r) => (
            <Link
              key={r.id}
              href={`/research/${r.id}`}
              className="flex items-center justify-between rounded-2xl bg-surface-0 px-5 py-4 shadow-[var(--shadow-neu-raised)] hover:shadow-[var(--shadow-neu-hover)] transition-shadow duration-200 group"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                  {r.input_data?.company_name || "Unknown"}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {new Date(r.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "text-[var(--color-status-pending)] bg-[var(--color-status-pending-bg)]",
    running: "text-[var(--color-status-running)] bg-[var(--color-status-running-bg)]",
    completed: "text-[var(--color-status-completed)] bg-[var(--color-status-completed-bg)]",
    partial: "text-[var(--color-status-partial)] bg-[var(--color-status-partial-bg)]",
    failed: "text-[var(--color-status-failed)] bg-[var(--color-status-failed-bg)]",
  };
  return (
    <span className={`shrink-0 inline-flex items-center rounded-xl px-2.5 py-1 text-[11px] font-semibold capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
