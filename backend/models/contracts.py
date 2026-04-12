from typing import Literal

from pydantic import BaseModel, Field


class DataPoint(BaseModel):
    """A single piece of data with confidence and source tracking."""

    value: str
    confidence: Literal["high", "medium", "low"]
    source: str


class SourcedFact(BaseModel):
    """A factual claim with its source and confidence."""

    fact: str
    source: str
    confidence: Literal["high", "medium", "low"]


class CompanyProfile(BaseModel):
    """Output of the Researcher agent."""

    company_name: str
    description: str
    industry: str
    size: DataPoint | None = None
    tech_stack: list[DataPoint] = Field(default_factory=list)
    funding: DataPoint | None = None
    recent_news: list[SourcedFact] = Field(default_factory=list)
    website_extractable: bool = True
    raw_sources: list[str] = Field(default_factory=list)


class OpportunityBrief(BaseModel):
    """Output of the Analyst agent."""

    pain_points: list[str]
    opportunity_fit: str
    expected_objections: list[str]
    opportunity_score: int = Field(ge=1, le=10)
    reasoning: str


class EmailVariant(BaseModel):
    """A single email variant (formal or casual)."""

    subject: str
    body: str
    call_to_action: str


class OutreachDraft(BaseModel):
    """Output of the Writer agent."""

    formal: EmailVariant
    casual: EmailVariant


class QualityReport(BaseModel):
    """Output of the Scorer agent."""

    overall_confidence: Literal["high", "medium", "low"]
    verified_facts: int
    inferred_facts: int
    uncertain_facts: int
    sources_used: list[str]
    research_gaps: list[str]
    recommendations: list[str]
