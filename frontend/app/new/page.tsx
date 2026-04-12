"use client";

import { useRouter } from "next/navigation";
import ResearchForm from "@/components/ResearchForm";
import { startResearch, type ResearchInput } from "@/lib/api";

export default function NewResearchPage() {
  const router = useRouter();

  const handleSubmit = async (input: ResearchInput) => {
    const { id } = await startResearch(input);
    router.push(`/research/${id}`);
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          New Research
        </h1>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          Enter a company to research. Four AI agents will investigate the company,
          analyze the opportunity, draft personalized outreach, and score the quality
          of the result.
        </p>
      </div>

      {/* Tips */}
      <div className="rounded-2xl bg-surface-0 p-5 shadow-[var(--shadow-neu-inset)] mb-6">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-3">
          Tips for better results
        </p>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            Include the company URL — it lets the Researcher scrape their homepage directly
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            Be specific about what you sell — &quot;AI customer support for e-commerce&quot; works better than &quot;software&quot;
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
            Add seller context — your company size, target persona, and unique value props help the Writer craft better outreach
          </li>
        </ul>
      </div>

      <div className="rounded-2xl bg-surface-0 p-6 shadow-[var(--shadow-neu-raised)]">
        <ResearchForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
