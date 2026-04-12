const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ResearchInput {
  company_name: string;
  company_url?: string;
  service_to_sell?: string;
  seller_context?: string;
}

export interface DataPoint {
  value: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface SourcedFact {
  fact: string;
  source: string;
  confidence: "high" | "medium" | "low";
}

export interface CompanyProfile {
  company_name: string;
  description: string;
  industry: string;
  size?: DataPoint;
  tech_stack: DataPoint[];
  funding?: DataPoint;
  recent_news: SourcedFact[];
  website_extractable: boolean;
  raw_sources: string[];
}

export interface OpportunityBrief {
  pain_points: string[];
  opportunity_fit: string;
  expected_objections: string[];
  opportunity_score: number;
  reasoning: string;
}

export interface EmailVariant {
  subject: string;
  body: string;
  call_to_action: string;
}

export interface OutreachDraft {
  formal: EmailVariant;
  casual: EmailVariant;
}

export interface QualityReport {
  overall_confidence: "high" | "medium" | "low";
  verified_facts: number;
  inferred_facts: number;
  uncertain_facts: number;
  sources_used: string[];
  research_gaps: string[];
  recommendations: string[];
}

export interface Research {
  id: string;
  status: "pending" | "running" | "completed" | "partial" | "failed";
  input_data: ResearchInput;
  created_at: string;
  completed_at?: string;
}

export interface StepResult {
  id?: string;
  research_id: string;
  step: "researcher" | "analyst" | "writer" | "scorer";
  result_data: CompanyProfile | OpportunityBrief | OutreachDraft | QualityReport;
  created_at: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

export async function startResearch(input: ResearchInput): Promise<{ id: string }> {
  return apiFetch("/api/research", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getResearch(id: string): Promise<{ research: Research; results: StepResult[] }> {
  return apiFetch(`/api/research/${id}`);
}

export async function getHistory(): Promise<{ researches: Research[] }> {
  return apiFetch("/api/history");
}

export async function saveSettings(keys: Record<string, string>): Promise<{ saved: Record<string, boolean> }> {
  return apiFetch("/api/settings", {
    method: "POST",
    body: JSON.stringify({ keys }),
  });
}

export async function getSettings(): Promise<{ keys: Record<string, string> }> {
  return apiFetch("/api/settings");
}

export async function validateSettings(): Promise<{ valid: Record<string, boolean> }> {
  return apiFetch("/api/settings/validate", { method: "POST" });
}

export function getStreamUrl(researchId: string): string {
  return `${API_URL}/api/research/${researchId}/stream`;
}
