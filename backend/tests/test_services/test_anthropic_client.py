from unittest.mock import MagicMock, patch

import pytest
from pydantic import BaseModel

from services.anthropic_client import AnthropicClient, StructuredOutputError


class SampleOutput(BaseModel):
    name: str
    score: int


@pytest.fixture
def client():
    return AnthropicClient(api_key="sk-ant-test-key")


def _make_mock_response(text: str):
    mock_block = MagicMock()
    mock_block.type = "text"
    mock_block.text = text
    mock_resp = MagicMock()
    mock_resp.content = [mock_block]
    return mock_resp


def test_structured_output_success(client):
    mock_resp = _make_mock_response('{"name": "Acme", "score": 8}')
    with patch.object(client._client.messages, "create", return_value=mock_resp):
        result = client.generate_structured(
            system_prompt="You are a test agent.",
            user_message="Analyze Acme Corp.",
            output_schema=SampleOutput,
            model="claude-haiku-4-5-20251001",
        )
    assert isinstance(result, SampleOutput)
    assert result.name == "Acme"
    assert result.score == 8


def test_structured_output_with_markdown_fence(client):
    mock_resp = _make_mock_response('```json\n{"name": "Acme", "score": 8}\n```')
    with patch.object(client._client.messages, "create", return_value=mock_resp):
        result = client.generate_structured(
            system_prompt="Test",
            user_message="Test",
            output_schema=SampleOutput,
            model="claude-haiku-4-5-20251001",
        )
    assert result.name == "Acme"


def test_structured_output_invalid_json(client):
    mock_resp = _make_mock_response("This is not JSON at all")
    with patch.object(client._client.messages, "create", return_value=mock_resp):
        with pytest.raises(StructuredOutputError):
            client.generate_structured(
                system_prompt="Test",
                user_message="Test",
                output_schema=SampleOutput,
                model="claude-haiku-4-5-20251001",
            )


def test_generate_text_success(client):
    mock_resp = _make_mock_response("Here are 3 search queries:\n1. Acme Corp overview")
    with patch.object(client._client.messages, "create", return_value=mock_resp):
        result = client.generate_text(
            system_prompt="Generate search queries.",
            user_message="Research Acme Corp",
            model="claude-haiku-4-5-20251001",
        )
    assert "Acme Corp" in result
