from pydantic import BaseModel

from agents.base import BaseAgent
from config import settings
from models.contracts import CompanyProfile, OpportunityBrief, OutreachDraft
from services.anthropic_client import AnthropicClient


class WriterInput(BaseModel):
    profile: CompanyProfile
    brief: OpportunityBrief
    seller_context: str | None = None


class WriterAgent(BaseAgent):
    system_prompt = """You are an expert B2B outreach copywriter. Given a company profile
and opportunity analysis, write two email variants:

1. **Formal**: Professional tone, suitable for enterprise/corporate contacts
2. **Casual**: Friendly tone, suitable for startups/SMBs

Rules:
- Reference specific facts about the company (shows you did research)
- Connect their pain points to the seller's service
- Keep emails under 150 words each
- Include a clear, low-commitment call to action
- Never be pushy or salesy — be helpful and specific"""

    model = settings.agent_model
    input_schema = WriterInput
    output_schema = OutreachDraft

    def __init__(self, anthropic_client: AnthropicClient):
        super().__init__(anthropic_client)

    def build_user_message(self, input_data: WriterInput) -> str:
        parts = [
            f"## Company Profile\n{input_data.profile.model_dump_json(indent=2)}",
            f"\n## Opportunity Analysis\n{input_data.brief.model_dump_json(indent=2)}",
        ]
        if input_data.seller_context:
            parts.append(f"\n## About the Seller\n{input_data.seller_context}")
        return "\n".join(parts)
