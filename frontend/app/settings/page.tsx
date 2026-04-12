"use client";

import ApiKeySettings from "@/components/ApiKeySettings";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Settings
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Configure API keys for the research pipeline. Anthropic and Tavily are required.
          Apollo is optional but enables contact enrichment.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ApiKeySettings />
      </div>
    </div>
  );
}
