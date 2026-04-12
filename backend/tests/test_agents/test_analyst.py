import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from agents.analyst import AnalystAgent, AnalystInput
from models.contracts import CompanyProfile, OpportunityBrief
from services.anthropic_client import AnthropicClient


@pytest.fixture
def fixtures():
    fixtures_path = Path(__file__).parent.parent / "fixtures" / "claude_responses.json"
    return json.loads(fixtures_path.read_text())


@pytest.fixture
def sample_profile(fixtures):
    return CompanyProfile(**fixtures["researcher_profile"])


@pytest.fixture
def mock_anthropic(fixtures):
    client = MagicMock(spec=AnthropicClient)
    client.generate_structured.return_value = OpportunityBrief(**fixtures["analyst_brief"])
    return client


def test_analyst_success(mock_anthropic, sample_profile):
    agent = AnalystAgent(anthropic_client=mock_anthropic)
    result = agent.run(AnalystInput(
        profile=sample_profile,
        service_to_sell="AI automation",
        seller_context="I build AI tools",
    ))
    assert isinstance(result, OpportunityBrief)
    assert 1 <= result.opportunity_score <= 10
    assert len(result.pain_points) > 0


def test_analyst_without_service(mock_anthropic, sample_profile):
    agent = AnalystAgent(anthropic_client=mock_anthropic)
    result = agent.run(AnalystInput(profile=sample_profile))
    assert isinstance(result, OpportunityBrief)


def test_analyst_prompt_includes_company(mock_anthropic, sample_profile):
    agent = AnalystAgent(anthropic_client=mock_anthropic)
    agent.run(AnalystInput(profile=sample_profile, service_to_sell="AI automation"))
    call_args = mock_anthropic.generate_structured.call_args
    assert "Acme Corp" in call_args.kwargs["user_message"]
    assert "AI automation" in call_args.kwargs["user_message"]
