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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-8">
        Research History
      </h1>

      {loading && (
        <div className="text-center py-12 text-zinc-400 text-sm">Loading...</div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && researches.length === 0 && (
        <div className="text-center py-16">
          <p className="text-zinc-400 text-sm">No researches yet.</p>
          <Link
            href="/"
            className="mt-3 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Start your first research &rarr;
          </Link>
        </div>
      )}

      {!loading && researches.length > 0 && (
        <div className="space-y-2">
          {researches.map((r) => (
            <Link
              key={r.id}
              href={`/research/${r.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm hover:border-zinc-300 hover:shadow transition-all group"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors truncate">
                  {r.input_data.company_name}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
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
    pending: "bg-zinc-100 text-zinc-600",
    running: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    partial: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
