from pydantic import BaseModel

from agents.base import BaseAgent
from config import settings
from models.contracts import CompanyProfile, OpportunityBrief
from services.anthropic_client import AnthropicClient


class AnalystInput(BaseModel):
    profile: CompanyProfile
    service_to_sell: str | None = None
    seller_context: str | None = None


class AnalystAgent(BaseAgent):
    system_prompt = """You are a B2B sales analyst. Given a company research profile,
analyze the opportunity for selling a specific service. Be specific and grounded in the data.

Score opportunity 1-10:
- 1-3: Poor fit, unlikely to convert
- 4-6: Moderate fit, worth exploring
- 7-8: Strong fit, good opportunity
- 9-10: Excellent fit, high priority target

Base your analysis ONLY on facts from the profile. Do not invent information."""

    model = settings.agent_model
    input_schema = AnalystInput
    output_schema = OpportunityBrief

    def __init__(self, anthropic_client: AnthropicClient):
        super().__init__(anthropic_client)

    def build_user_message(self, input_data: AnalystInput) -> str:
        parts = [f"## Company Profile\n{input_data.profile.model_dump_json(indent=2)}"]
        if input_data.service_to_sell:
            parts.append(f"\n## Service to Sell\n{input_data.service_to_sell}")
        if input_data.seller_context:
            parts.append(f"\n## Seller Context\n{input_data.seller_context}")
        return "\n".join(parts)
