import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from agents.scorer import ScorerAgent, ScorerInput
from models.contracts import CompanyProfile, OpportunityBrief, OutreachDraft, QualityReport
from services.anthropic_client import AnthropicClient


@pytest.fixture
def fixtures():
    return json.loads((Path(__file__).parent.parent / "fixtures" / "claude_responses.json").read_text())


@pytest.fixture
def mock_anthropic(fixtures):
    client = MagicMock(spec=AnthropicClient)
    client.generate_structured.return_value = QualityReport(**fixtures["scorer_report"])
    return client


def test_scorer_success(mock_anthropic, fixtures):
    agent = ScorerAgent(anthropic_client=mock_anthropic)
    result = agent.run(ScorerInput(
        profile=CompanyProfile(**fixtures["researcher_profile"]),
        brief=OpportunityBrief(**fixtures["analyst_brief"]),
        draft=OutreachDraft(**fixtures["writer_draft"]),
    ))
    assert isinstance(result, QualityReport)
    assert result.overall_confidence in ("high", "medium", "low")
    assert result.verified_facts >= 0


def test_scorer_uses_haiku(mock_anthropic, fixtures):
    agent = ScorerAgent(anthropic_client=mock_anthropic)
    agent.run(ScorerInput(
        profile=CompanyProfile(**fixtures["researcher_profile"]),
        brief=OpportunityBrief(**fixtures["analyst_brief"]),
        draft=OutreachDraft(**fixtures["writer_draft"]),
    ))
    call_args = mock_anthropic.generate_structured.call_args
    assert "haiku" in call_args.kwargs["model"]
