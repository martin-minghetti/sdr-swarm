from pydantic import BaseModel

from agents.base import BaseAgent
from config import settings
from models.contracts import CompanyProfile, OpportunityBrief, OutreachDraft, QualityReport
from services.anthropic_client import AnthropicClient


class ScorerInput(BaseModel):
    profile: CompanyProfile
    brief: OpportunityBrief
    draft: OutreachDraft


class ScorerAgent(BaseAgent):
    system_prompt = """You are a research quality auditor. Given a company profile,
opportunity analysis, and outreach draft, evaluate the overall quality of the research.

Check for:
- Facts with sources vs inferred claims
- Research gaps (important info not found)
- Consistency between profile, analysis, and outreach
- Whether the outreach references real facts from the profile

Rate overall_confidence:
- "high": >70% facts verified, no critical gaps
- "medium": 40-70% verified, some gaps
- "low": <40% verified, significant gaps

Be specific in recommendations — what concrete steps would improve this research?"""

    model = settings.scorer_model
    input_schema = ScorerInput
    output_schema = QualityReport

    def __init__(self, anthropic_client: AnthropicClient):
        super().__init__(anthropic_client)

    def build_user_message(self, input_data: ScorerInput) -> str:
        return (
            f"## Company Profile\n{input_data.profile.model_dump_json(indent=2)}\n\n"
            f"## Opportunity Analysis\n{input_data.brief.model_dump_json(indent=2)}\n\n"
            f"## Outreach Draft\n{input_data.draft.model_dump_json(indent=2)}"
        )
