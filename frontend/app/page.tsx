import Link from "next/link";

const STEPS = [
  {
    icon: "1",
    title: "Researcher",
    desc: "Searches the web, scrapes the company website, and pulls enrichment data — all in parallel.",
  },
  {
    icon: "2",
    title: "Analyst",
    desc: "Synthesizes raw data into a structured brief: ICP fit, pain points, tech stack, and opportunity score.",
  },
  {
    icon: "3",
    title: "Writer",
    desc: "Drafts personalized cold emails and LinkedIn messages in formal and casual variants.",
  },
  {
    icon: "4",
    title: "Scorer",
    desc: "Evaluates output quality, flags low-confidence facts, and recommends next steps.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
          AI-Powered Sales Research
        </h1>
        <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-xl mx-auto">
          SDR Swarm runs a 4-agent pipeline that researches any company, analyzes
          the opportunity, drafts personalized outreach, and scores the result —
          in under 30 seconds, for less than $0.15.
        </p>
        <Link
          href="/new"
          className="btn-neu-primary mt-6 inline-flex items-center rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-neu-sm)] hover:shadow-[var(--shadow-neu-raised)] hover:bg-accent-dim"
        >
          Start a Research
        </Link>
      </div>

      {/* How it works */}
      <div className="mb-12">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-5 text-center">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl bg-surface-0 p-5 shadow-[var(--shadow-neu-raised)] hover:shadow-[var(--shadow-neu-hover)] transition-shadow duration-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-surface-0 shadow-[var(--shadow-neu-inset)] text-xs font-bold font-mono text-accent">
                  {step.icon}
                </span>
                <h3 className="text-sm font-semibold text-text-primary">
                  {step.title}
                </h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* BYOK */}
      <div className="rounded-2xl bg-surface-0 p-6 shadow-[var(--shadow-neu-raised)]">
        <h2 className="text-sm font-semibold text-text-primary mb-2">
          Bring Your Own Keys
        </h2>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          SDR Swarm uses your own API keys — nothing is stored on our servers
          beyond encrypted credentials in your Supabase instance. You control
          costs and rate limits. Each research costs ~$0.08–0.15.
        </p>
        <div className="flex flex-wrap gap-2">
          {["Anthropic Claude", "Tavily Search", "Apollo (optional)"].map((k) => (
            <span
              key={k}
              className="px-3 py-1 rounded-xl bg-surface-0 text-text-secondary text-xs font-mono shadow-[var(--shadow-neu-sm)]"
            >
              {k}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
