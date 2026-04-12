import json
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from agents.writer import WriterAgent, WriterInput
from models.contracts import CompanyProfile, OpportunityBrief, OutreachDraft
from services.anthropic_client import AnthropicClient


@pytest.fixture
def fixtures():
    return json.loads((Path(__file__).parent.parent / "fixtures" / "claude_responses.json").read_text())


@pytest.fixture
def mock_anthropic(fixtures):
    client = MagicMock(spec=AnthropicClient)
    client.generate_structured.return_value = OutreachDraft(**fixtures["writer_draft"])
    return client


@pytest.fixture
def sample_profile(fixtures):
    return CompanyProfile(**fixtures["researcher_profile"])


@pytest.fixture
def sample_brief(fixtures):
    return OpportunityBrief(**fixtures["analyst_brief"])


def test_writer_success(mock_anthropic, sample_profile, sample_brief):
    agent = WriterAgent(anthropic_client=mock_anthropic)
    result = agent.run(WriterInput(profile=sample_profile, brief=sample_brief, seller_context="I build AI tools"))
    assert isinstance(result, OutreachDraft)
    assert result.formal.subject != ""
    assert result.casual.subject != ""


def test_writer_prompt_includes_context(mock_anthropic, sample_profile, sample_brief):
    agent = WriterAgent(anthropic_client=mock_anthropic)
    agent.run(WriterInput(profile=sample_profile, brief=sample_brief, seller_context="I build AI tools for SMBs"))
    call_args = mock_anthropic.generate_structured.call_args
    assert "AI tools for SMBs" in call_args.kwargs["user_message"]
