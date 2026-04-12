"use client";

import { useState } from "react";
import type { StepResult, CompanyProfile, OpportunityBrief, OutreachDraft, QualityReport } from "@/lib/api";

interface Props {
  results: StepResult[];
}

const TABS = [
  { key: "researcher", label: "Company Profile" },
  { key: "analyst", label: "Opportunity Analysis" },
  { key: "writer", label: "Outreach Draft" },
  { key: "scorer", label: "Quality Report" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ResultTabs({ results }: Props) {
  const resultMap = Object.fromEntries(results.map((r) => [r.step, r.result_data]));
  const availableTabs = TABS.filter((t) => resultMap[t.key]);
  const [active, setActive] = useState<TabKey>(availableTabs[0]?.key ?? "researcher");

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        No results yet.
      </div>
    );
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6">
        {TABS.map((tab) => {
          const available = !!resultMap[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => available && setActive(tab.key)}
              disabled={!available}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                active === tab.key
                  ? "shadow-[var(--shadow-neu-inset)] text-accent font-semibold"
                  : available
                  ? "shadow-[var(--shadow-neu-sm)] text-text-secondary hover:shadow-[var(--shadow-neu-raised)] hover:text-text-primary"
                  : "text-text-muted opacity-40 cursor-not-allowed"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {active === "researcher" && resultMap.researcher && (
          <CompanyProfileView data={resultMap.researcher as CompanyProfile} />
        )}
        {active === "analyst" && resultMap.analyst && (
          <OpportunityAnalysisView data={resultMap.analyst as OpportunityBrief} />
        )}
        {active === "writer" && resultMap.writer && (
          <OutreachDraftView data={resultMap.writer as OutreachDraft} />
        )}
        {active === "scorer" && resultMap.scorer && (
          <QualityReportView data={resultMap.scorer as QualityReport} />
        )}
      </div>
    </div>
  );
}

/* -- Confidence Badge ---------------------------------------- */

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const styles = {
    high: "text-[var(--color-status-completed)] bg-[var(--color-status-completed-bg)]",
    medium: "text-[var(--color-status-pending)] bg-[var(--color-status-pending-bg)]",
    low: "text-[var(--color-status-failed)] bg-[var(--color-status-failed-bg)]",
  };
  return (
    <span className={`inline-flex items-center rounded-xl px-2 py-0.5 text-[11px] font-semibold capitalize ${styles[level]}`}>
      {level}
    </span>
  );
}

/* -- Company Profile Tab ------------------------------------- */

function CompanyProfileView({ data }: { data: CompanyProfile }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{data.company_name}</h3>
        <p className="mt-1 text-sm text-text-secondary">{data.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard label="Industry" value={data.industry} />
        {data.size && (
          <InfoCard label="Company Size" value={data.size.value}>
            <ConfidenceBadge level={data.size.confidence} />
          </InfoCard>
        )}
        {data.funding && (
          <InfoCard label="Funding" value={data.funding.value}>
            <ConfidenceBadge level={data.funding.confidence} />
          </InfoCard>
        )}
      </div>

      {data.tech_stack.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Tech Stack</h4>
          <div className="flex flex-wrap gap-2">
            {data.tech_stack.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-xl bg-surface-0 px-3 py-1.5 text-xs font-medium text-text-secondary shadow-[var(--shadow-neu-sm)]"
              >
                {t.value}
                <ConfidenceBadge level={t.confidence} />
              </span>
            ))}
          </div>
        </div>
      )}

      {data.recent_news.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Recent News</h4>
          <ul className="space-y-2">
            {data.recent_news.map((news, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                <div>
                  <span className="text-text-primary">{news.fact}</span>
                  <span className="ml-2 text-text-muted text-xs">({news.source})</span>
                  <span className="ml-1.5"><ConfidenceBadge level={news.confidence} /></span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.raw_sources.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Sources</h4>
          <ul className="space-y-1">
            {data.raw_sources.map((src, i) => (
              <li key={i} className="text-xs text-text-muted font-mono truncate">{src}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface-0 p-4 shadow-[var(--shadow-neu-inset)]">
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-sm font-semibold text-text-primary">{value}</p>
        {children}
      </div>
    </div>
  );
}

/* -- Opportunity Analysis Tab -------------------------------- */

function OpportunityAnalysisView({ data }: { data: OpportunityBrief }) {
  const scoreColor =
    data.opportunity_score >= 7
      ? "text-[var(--color-status-completed)]"
      : data.opportunity_score >= 4
      ? "text-[var(--color-status-pending)]"
      : "text-[var(--color-status-failed)]";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className={`flex items-center justify-center w-16 h-16 rounded-2xl shadow-[var(--shadow-neu-raised)] text-2xl font-bold font-mono ${scoreColor}`}>
          {data.opportunity_score}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Opportunity Score</p>
          <p className="text-xs text-text-muted">out of 10</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-1">Opportunity Fit</h4>
        <p className="text-sm text-text-secondary leading-relaxed">{data.opportunity_fit}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-1">Reasoning</h4>
        <p className="text-sm text-text-secondary leading-relaxed">{data.reasoning}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-2">Pain Points</h4>
        <ul className="space-y-1.5">
          {data.pain_points.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-2">Expected Objections</h4>
        <ul className="space-y-1.5">
          {data.expected_objections.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-status-pending)] shrink-0" />
              {o}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* -- Outreach Draft Tab -------------------------------------- */

function OutreachDraftView({ data }: { data: OutreachDraft }) {
  const [variant, setVariant] = useState<"formal" | "casual">("formal");
  const email = data[variant];

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl bg-surface-0 shadow-[var(--shadow-neu-inset)] p-1">
        {(["formal", "casual"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              variant === v
                ? "shadow-[var(--shadow-neu-raised)] text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {v === "formal" ? "Formal" : "Casual"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-surface-0 shadow-[var(--shadow-neu-raised)] overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Subject</p>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">{email.subject}</p>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{email.body}</p>
        </div>

        <div className="border-t border-border px-5 py-3 bg-surface-2/30">
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">Call to Action</p>
          <p className="mt-0.5 text-sm text-accent font-medium">{email.call_to_action}</p>
        </div>
      </div>
    </div>
  );
}

/* -- Quality Report Tab -------------------------------------- */

function QualityReportView({ data }: { data: QualityReport }) {
  const confStyles = {
    high: "text-[var(--color-status-completed)] bg-[var(--color-status-completed-bg)]",
    medium: "text-[var(--color-status-pending)] bg-[var(--color-status-pending-bg)]",
    low: "text-[var(--color-status-failed)] bg-[var(--color-status-failed-bg)]",
  };

  const total = data.verified_facts + data.inferred_facts + data.uncertain_facts;
  const verifiedPct = total ? Math.round((data.verified_facts / total) * 100) : 0;
  const inferredPct = total ? Math.round((data.inferred_facts / total) * 100) : 0;
  const uncertainPct = total ? Math.round((data.uncertain_facts / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-text-primary">Overall Confidence:</span>
        <span className={`inline-flex items-center rounded-xl px-3 py-1 text-sm font-semibold capitalize ${confStyles[data.overall_confidence]}`}>
          {data.overall_confidence}
        </span>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Fact Breakdown</h4>
        <div className="grid grid-cols-3 gap-3">
          <FactStat label="Verified" count={data.verified_facts} pct={verifiedPct} color="completed" />
          <FactStat label="Inferred" count={data.inferred_facts} pct={inferredPct} color="pending" />
          <FactStat label="Uncertain" count={data.uncertain_facts} pct={uncertainPct} color="failed" />
        </div>
        {total > 0 && (
          <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-surface-0 shadow-[var(--shadow-neu-inset)] p-[2px]">
            <div className="bg-[var(--color-status-completed)] rounded-full transition-all" style={{ width: `${verifiedPct}%` }} />
            <div className="bg-[var(--color-status-pending)] transition-all" style={{ width: `${inferredPct}%` }} />
            <div className="bg-[var(--color-status-failed)] rounded-full transition-all" style={{ width: `${uncertainPct}%` }} />
          </div>
        )}
      </div>

      {data.research_gaps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Research Gaps</h4>
          <ul className="space-y-1.5">
            {data.research_gaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--color-status-pending)] shrink-0" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Recommendations</h4>
          <ul className="space-y-1.5">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.sources_used.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Sources Used ({data.sources_used.length})</h4>
          <ul className="space-y-1">
            {data.sources_used.map((src, i) => (
              <li key={i} className="text-xs text-text-muted font-mono truncate">{src}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FactStat({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  return (
    <div className="rounded-2xl bg-surface-0 p-3 text-center shadow-[var(--shadow-neu-inset)]">
      <p className={`text-2xl font-bold font-mono text-[var(--color-status-${color})]`}>{count}</p>
      <p className="text-xs text-text-muted mt-0.5">{label} ({pct}%)</p>
    </div>
  );
}
