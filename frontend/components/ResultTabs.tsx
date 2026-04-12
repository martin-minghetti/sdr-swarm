"use client";

import { useState } from "react";
import type { StepResult, CompanyProfile, OpportunityBrief, OutreachDraft, QualityReport } from "@/lib/api";

interface Props {
  results: StepResult[];
}

const TABS = [
  { key: "researcher", label: "Company Profile", icon: "building-2" },
  { key: "analyst", label: "Opportunity Analysis", icon: "chart-bar" },
  { key: "writer", label: "Outreach Draft", icon: "pen-tool" },
  { key: "scorer", label: "Quality Report", icon: "shield-check" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ResultTabs({ results }: Props) {
  const resultMap = Object.fromEntries(results.map((r) => [r.step, r.result_data]));
  const availableTabs = TABS.filter((t) => resultMap[t.key]);
  const [active, setActive] = useState<TabKey>(availableTabs[0]?.key ?? "researcher");

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No results yet.
      </div>
    );
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-zinc-200">
        {TABS.map((tab) => {
          const available = !!resultMap[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => available && setActive(tab.key)}
              disabled={!available}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active === tab.key
                  ? "border-blue-600 text-blue-600"
                  : available
                  ? "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                  : "border-transparent text-zinc-300 cursor-not-allowed"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="pt-6">
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

/* ── Confidence Badge ────────────────────────────────── */

function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${styles[level]}`}>
      {level}
    </span>
  );
}

/* ── Company Profile Tab ─────────────────────────────── */

function CompanyProfileView({ data }: { data: CompanyProfile }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900">{data.company_name}</h3>
        <p className="mt-1 text-sm text-zinc-600">{data.description}</p>
      </div>

      {/* Key Info Grid */}
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

      {/* Tech Stack */}
      {data.tech_stack.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-700 mb-2">Tech Stack</h4>
          <div className="flex flex-wrap gap-2">
            {data.tech_stack.map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700"
              >
                {t.value}
                <ConfidenceBadge level={t.confidence} />
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent News */}
      {data.recent_news.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-700 mb-2">Recent News</h4>
          <ul className="space-y-2">
            {data.recent_news.map((news, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-zinc-400">--</span>
                <div>
                  <span className="text-zinc-800">{news.fact}</span>
                  <span className="ml-2 text-zinc-400 text-xs">({news.source})</span>
                  <span className="ml-1.5"><ConfidenceBadge level={news.confidence} /></span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {data.raw_sources.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-700 mb-2">Sources</h4>
          <ul className="space-y-1">
            {data.raw_sources.map((src, i) => (
              <li key={i} className="text-xs text-zinc-500 truncate">{src}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-sm font-semibold text-zinc-900">{value}</p>
        {children}
      </div>
    </div>
  );
}

/* ── Opportunity Analysis Tab ────────────────────────── */

function OpportunityAnalysisView({ data }: { data: OpportunityBrief }) {
  const scoreColor =
    data.opportunity_score >= 7
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : data.opportunity_score >= 4
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center justify-center w-16 h-16 rounded-xl border-2 text-2xl font-bold ${scoreColor}`}>
          {data.opportunity_score}
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">Opportunity Score</p>
          <p className="text-xs text-zinc-500">out of 10</p>
        </div>
      </div>

      {/* Fit */}
      <div>
        <h4 className="text-sm font-semibold text-zinc-700 mb-1">Opportunity Fit</h4>
        <p className="text-sm text-zinc-600 leading-relaxed">{data.opportunity_fit}</p>
      </div>

      {/* Reasoning */}
      <div>
        <h4 className="text-sm font-semibold text-zinc-700 mb-1">Reasoning</h4>
        <p className="text-sm text-zinc-600 leading-relaxed">{data.reasoning}</p>
      </div>

      {/* Pain Points */}
      <div>
        <h4 className="text-sm font-semibold text-zinc-700 mb-2">Pain Points</h4>
        <ul className="space-y-1.5">
          {data.pain_points.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Objections */}
      <div>
        <h4 className="text-sm font-semibold text-zinc-700 mb-2">Expected Objections</h4>
        <ul className="space-y-1.5">
          {data.expected_objections.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              {o}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Outreach Draft Tab ──────────────────────────────── */

function OutreachDraftView({ data }: { data: OutreachDraft }) {
  const [variant, setVariant] = useState<"formal" | "casual">("formal");
  const email = data[variant];

  return (
    <div className="space-y-4">
      {/* Variant toggle */}
      <div className="inline-flex rounded-lg bg-zinc-100 p-1">
        {(["formal", "casual"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              variant === v
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {v === "formal" ? "Formal" : "Casual"}
          </button>
        ))}
      </div>

      {/* Email preview */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
        {/* Subject */}
        <div className="border-b border-zinc-100 px-5 py-3">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Subject</p>
          <p className="mt-0.5 text-sm font-semibold text-zinc-900">{email.subject}</p>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{email.body}</p>
        </div>

        {/* CTA */}
        <div className="border-t border-zinc-100 px-5 py-3 bg-zinc-50/50">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Call to Action</p>
          <p className="mt-0.5 text-sm text-blue-600 font-medium">{email.call_to_action}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Quality Report Tab ──────────────────────────────── */

function QualityReportView({ data }: { data: QualityReport }) {
  const confColor = {
    high: "bg-emerald-100 text-emerald-700 border-emerald-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    low: "bg-red-100 text-red-700 border-red-200",
  };

  const total = data.verified_facts + data.inferred_facts + data.uncertain_facts;
  const verifiedPct = total ? Math.round((data.verified_facts / total) * 100) : 0;
  const inferredPct = total ? Math.round((data.inferred_facts / total) * 100) : 0;
  const uncertainPct = total ? Math.round((data.uncertain_facts / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Overall confidence */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-zinc-700">Overall Confidence:</span>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold capitalize ${confColor[data.overall_confidence]}`}>
          {data.overall_confidence}
        </span>
      </div>

      {/* Fact breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-zinc-700 mb-3">Fact Breakdown</h4>
        <div className="grid grid-cols-3 gap-3">
          <FactStat label="Verified" count={data.verified_facts} pct={verifiedPct} color="emerald" />
          <FactStat label="Inferred" count={data.inferred_facts} pct={inferredPct} color="amber" />
          <FactStat label="Uncertain" count={data.uncertain_facts} pct={uncertainPct} color="red" />
        </div>
        {/* Bar */}
        {total > 0 && (
          <div className="mt-3 flex h-2 rounded-full overflow-hidden bg-zinc-100">
            <div className="bg-emerald-500 transition-all" style={{ width: `${verifiedPct}%` }} />
            <div className="bg-amber-400 transition-all" style={{ width: `${inferredPct}%` }} />
            <div className="bg-red-400 transition-all" style={{ width: `${uncertainPct}%` }} />
          </div>
        )}
      </div>

      {/* Research Gaps */}
      {data.research_gaps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-700 mb-2">Research Gaps</h4>
          <ul className="space-y-1.5">
            {data.research_gaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-700 mb-2">Recommendations</h4>
          <ul className="space-y-1.5">
            {data.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      {data.sources_used.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-700 mb-2">Sources Used ({data.sources_used.length})</h4>
          <ul className="space-y-1">
            {data.sources_used.map((src, i) => (
              <li key={i} className="text-xs text-zinc-500 truncate">{src}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FactStat({ label, count, pct, color }: { label: string; count: number; pct: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    red: "text-red-600",
  };
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 text-center">
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{count}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label} ({pct}%)</p>
    </div>
  );
}
