from unittest.mock import MagicMock

import pytest
from pydantic import BaseModel

from agents.base import BaseAgent
from services.anthropic_client import StructuredOutputError


class MockInput(BaseModel):
    query: str


class MockOutput(BaseModel):
    answer: str


class ConcreteAgent(BaseAgent):
    system_prompt = "You are a test agent."
    model = "claude-haiku-4-5-20251001"
    input_schema = MockInput
    output_schema = MockOutput

    def build_user_message(self, input_data: MockInput) -> str:
        return f"Process this: {input_data.query}"


def test_agent_run_success():
    mock_client = MagicMock()
    mock_client.generate_structured.return_value = MockOutput(answer="42")
    agent = ConcreteAgent(anthropic_client=mock_client)

    result = agent.run(MockInput(query="What is the answer?"))

    assert isinstance(result, MockOutput)
    assert result.answer == "42"
    mock_client.generate_structured.assert_called_once()


def test_agent_retry_on_parse_failure():
    mock_client = MagicMock()
    mock_client.generate_structured.side_effect = [
        StructuredOutputError("Bad JSON"),
        MockOutput(answer="42"),
    ]
    agent = ConcreteAgent(anthropic_client=mock_client)

    result = agent.run(MockInput(query="What is the answer?"))

    assert isinstance(result, MockOutput)
    assert result.answer == "42"
    assert mock_client.generate_structured.call_count == 2


def test_agent_raises_after_max_retries():
    mock_client = MagicMock()
    mock_client.generate_structured.side_effect = StructuredOutputError("Bad JSON")
    agent = ConcreteAgent(anthropic_client=mock_client)

    with pytest.raises(StructuredOutputError):
        agent.run(MockInput(query="What is the answer?"))

    assert mock_client.generate_structured.call_count == 3  # initial + 2 retries


def test_agent_tracks_duration():
    mock_client = MagicMock()
    mock_client.generate_structured.return_value = MockOutput(answer="42")
    agent = ConcreteAgent(anthropic_client=mock_client)

    agent.run(MockInput(query="test"))
    assert agent.last_duration_ms >= 0
