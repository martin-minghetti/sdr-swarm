import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.tavily import TavilyClient, TavilyResult


@pytest.fixture
def fixtures():
    data = json.loads(
        (Path(__file__).parent.parent / "fixtures" / "tavily_responses.json").read_text()
    )
    return data


@pytest.fixture
def client():
    return TavilyClient(api_key="tvly-test-key")


@pytest.mark.asyncio
async def test_search_success(client, fixtures):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = fixtures["search_success"]
    mock_response.raise_for_status = lambda: None

    with patch.object(client._http, "post", new=AsyncMock(return_value=mock_response)):
        results = await client.search("Acme Corp company overview")

    assert len(results) == 3
    assert isinstance(results[0], TavilyResult)
    assert results[0].title == "Acme Corp - About Us"
    assert results[0].score == 0.95


@pytest.mark.asyncio
async def test_search_empty_results(client, fixtures):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = fixtures["search_empty"]
    mock_response.raise_for_status = lambda: None

    with patch.object(client._http, "post", new=AsyncMock(return_value=mock_response)):
        results = await client.search("nonexistent company xyz123")

    assert results == []


@pytest.mark.asyncio
async def test_search_api_error(client):
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_response.raise_for_status.side_effect = Exception("Rate limited")

    with patch.object(client._http, "post", new=AsyncMock(return_value=mock_response)):
        results = await client.search("Acme Corp")

    assert results == []


@pytest.mark.asyncio
async def test_search_multiple_queries(client, fixtures):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = fixtures["search_success"]
    mock_response.raise_for_status = lambda: None

    with patch.object(client._http, "post", new=AsyncMock(return_value=mock_response)):
        results = await client.search_multiple(
            ["Acme Corp overview", "Acme Corp funding", "Acme Corp tech stack"]
        )

    assert len(results) == 9  # 3 results × 3 queries
