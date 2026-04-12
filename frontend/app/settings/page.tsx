"use client";

import ApiKeySettings from "@/components/ApiKeySettings";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          Settings
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          SDR Swarm uses your own API keys (BYOK). Keys are encrypted before
          storage and never logged. You control your costs and rate limits.
        </p>
      </div>

      {/* Key explanations */}
      <div className="rounded-2xl bg-surface-0 p-5 shadow-[var(--shadow-neu-inset)] mb-6">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">
          What each key does
        </p>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold text-text-primary">Anthropic</span>
            <span className="text-text-muted"> — required</span>
            <p className="text-text-secondary mt-0.5">
              Powers all four AI agents (Claude Sonnet for research, analysis and writing; Haiku for scoring).
              Get your key at{" "}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-dim">
                console.anthropic.com
              </a>
            </p>
          </div>
          <div>
            <span className="font-semibold text-text-primary">Tavily</span>
            <span className="text-text-muted"> — required</span>
            <p className="text-text-secondary mt-0.5">
              Web search engine used by the Researcher agent to find company information.
              Free tier gives 1,000 searches/month at{" "}
              <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-dim">
                tavily.com
              </a>
            </p>
          </div>
          <div>
            <span className="font-semibold text-text-primary">Apollo</span>
            <span className="text-text-muted"> — optional</span>
            <p className="text-text-secondary mt-0.5">
              B2B enrichment data — adds company size, funding, employee count, and contact info.
              The pipeline works without it, but results are richer with it.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-0 p-6 shadow-[var(--shadow-neu-raised)]">
        <ApiKeySettings />
      </div>
    </div>
  );
}
