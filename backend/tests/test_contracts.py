from models.contracts import (
    CompanyProfile,
    DataPoint,
    EmailVariant,
    OpportunityBrief,
    OutreachDraft,
    QualityReport,
    SourcedFact,
)
from models.inputs import ResearchInput


def test_research_input_minimal():
    inp = ResearchInput(company_name="Acme Corp")
    assert inp.company_name == "Acme Corp"
    assert inp.company_url is None
    assert inp.service_to_sell is None
    assert inp.seller_context is None


def test_research_input_full():
    inp = ResearchInput(
        company_name="Acme Corp",
        company_url="https://acme.com",
        service_to_sell="AI automation",
        seller_context="I build AI tools for SMBs",
    )
    assert inp.company_url == "https://acme.com"


def test_company_profile_with_data_points():
    profile = CompanyProfile(
        company_name="Acme Corp",
        description="A widget company",
        industry="Manufacturing",
        size=DataPoint(value="50-200 employees", confidence="medium", source="Tavily"),
        tech_stack=[DataPoint(value="React", confidence="high", source="BuiltWith via Tavily")],
        funding=None,
        recent_news=[SourcedFact(fact="Raised Series A", source="TechCrunch", confidence="high")],
        website_extractable=True,
        raw_sources=["https://acme.com", "https://techcrunch.com/acme"],
    )
    assert profile.company_name == "Acme Corp"
    assert profile.size is not None
    assert profile.size.confidence == "medium"
    assert len(profile.recent_news) == 1


def test_opportunity_brief():
    brief = OpportunityBrief(
        pain_points=["Manual customer support at scale"],
        opportunity_fit="High — they need automation for growing support volume",
        expected_objections=["Already using Zendesk", "Budget constraints"],
        opportunity_score=8,
        reasoning="Growing team + manual processes = strong fit for AI automation",
    )
    assert brief.opportunity_score == 8
    assert len(brief.pain_points) == 1


def test_opportunity_score_bounds():
    brief = OpportunityBrief(
        pain_points=[],
        opportunity_fit="Low",
        expected_objections=[],
        opportunity_score=5,
        reasoning="Neutral fit",
    )
    assert 1 <= brief.opportunity_score <= 10


def test_outreach_draft():
    draft = OutreachDraft(
        formal=EmailVariant(
            subject="Streamline Acme's customer support with AI",
            body="Dear Acme team...",
            call_to_action="Would 15 minutes this week work to explore this?",
        ),
        casual=EmailVariant(
            subject="Quick idea for Acme's support team",
            body="Hey! I noticed...",
            call_to_action="Want to hop on a quick call?",
        ),
    )
    assert "Acme" in draft.formal.subject


def test_quality_report():
    report = QualityReport(
        overall_confidence="medium",
        verified_facts=3,
        inferred_facts=2,
        uncertain_facts=1,
        sources_used=["https://acme.com", "Tavily search"],
        research_gaps=["No funding data found", "Tech stack partially inferred"],
        recommendations=["Verify company size via LinkedIn"],
    )
    assert report.verified_facts == 3
    assert len(report.research_gaps) == 2
