"use client";

import { useState } from "react";
import type { ResearchInput } from "@/lib/api";

interface Props {
  onSubmit: (input: ResearchInput) => Promise<void>;
}

export default function ResearchForm({ onSubmit }: Props) {
  const [form, setForm] = useState<ResearchInput>({
    company_name: "",
    company_url: "",
    service_to_sell: "",
    seller_context: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({
        company_name: form.company_name,
        company_url: form.company_url || undefined,
        service_to_sell: form.service_to_sell || undefined,
        seller_context: form.seller_context || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="company_name" className="block text-sm font-medium text-text-primary mb-1.5">
          Company Name <span className="text-[var(--color-status-failed)]">*</span>
        </label>
        <input
          id="company_name"
          type="text"
          required
          placeholder="e.g. Stripe"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          className="w-full rounded-xl px-3.5 py-2.5 bg-surface-0 shadow-[var(--shadow-neu-inset)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        />
      </div>

      <div>
        <label htmlFor="company_url" className="block text-sm font-medium text-text-primary mb-1.5">
          Company URL
        </label>
        <input
          id="company_url"
          type="url"
          placeholder="https://stripe.com"
          value={form.company_url}
          onChange={(e) => setForm({ ...form, company_url: e.target.value })}
          className="w-full rounded-xl px-3.5 py-2.5 bg-surface-0 shadow-[var(--shadow-neu-inset)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        />
      </div>

      <div>
        <label htmlFor="service_to_sell" className="block text-sm font-medium text-text-primary mb-1.5">
          Service to Sell
        </label>
        <input
          id="service_to_sell"
          type="text"
          placeholder="e.g. AI-powered customer support platform"
          value={form.service_to_sell}
          onChange={(e) => setForm({ ...form, service_to_sell: e.target.value })}
          className="w-full rounded-xl px-3.5 py-2.5 bg-surface-0 shadow-[var(--shadow-neu-inset)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
        />
      </div>

      <div>
        <label htmlFor="seller_context" className="block text-sm font-medium text-text-primary mb-1.5">
          Seller Context
        </label>
        <textarea
          id="seller_context"
          rows={3}
          placeholder="Your company, value props, target persona..."
          value={form.seller_context}
          onChange={(e) => setForm({ ...form, seller_context: e.target.value })}
          className="w-full rounded-xl px-3.5 py-2.5 bg-surface-0 shadow-[var(--shadow-neu-inset)] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all resize-none"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-surface-0 shadow-[var(--shadow-neu-inset)] px-4 py-3 text-sm text-[var(--color-status-failed)]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !form.company_name.trim()}
        className="btn-neu-primary w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-neu-sm)] hover:shadow-[var(--shadow-neu-raised)] hover:bg-accent-dim focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Starting Research...
          </span>
        ) : (
          "Start Research"
        )}
      </button>
    </form>
  );
}
