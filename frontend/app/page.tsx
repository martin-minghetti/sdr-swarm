"use client";

import { useRouter } from "next/navigation";
import ResearchForm from "@/components/ResearchForm";
import { startResearch, type ResearchInput } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  const handleSubmit = async (input: ResearchInput) => {
    const { id } = await startResearch(input);
    router.push(`/research/${id}`);
  };

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          New Research
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Enter a company name to start an AI-powered sales research pipeline.
          Four specialized agents will research, analyze, draft outreach, and score the results.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ResearchForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
