import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.apollo import ApolloClient, ApolloOrganization


@pytest.fixture
def fixtures():
    data = json.loads(
        (Path(__file__).parent.parent / "fixtures" / "apollo_responses.json").read_text()
    )
    return data


@pytest.fixture
def client():
    return ApolloClient(api_key="apollo-test-key")


@pytest.mark.asyncio
async def test_enrich_success(client, fixtures):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = fixtures["enrich_success"]
    mock_response.raise_for_status = lambda: None

    with patch.object(client._http, "post", new=AsyncMock(return_value=mock_response)):
        result = await client.enrich_company("acme.com")

    assert isinstance(result, ApolloOrganization)
    assert result.name == "Acme Corp"
    assert result.estimated_num_employees == 150
    assert "React" in result.technologies


@pytest.mark.asyncio
async def test_enrich_not_found(client, fixtures):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = fixtures["enrich_not_found"]
    mock_response.raise_for_status = lambda: None

    with patch.object(client._http, "post", new=AsyncMock(return_value=mock_response)):
        result = await client.enrich_company("nonexistent.com")

    assert result is None


@pytest.mark.asyncio
async def test_enrich_api_error(client):
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.raise_for_status.side_effect = Exception("Unauthorized")

    with patch.object(client._http, "post", new=AsyncMock(return_value=mock_response)):
        result = await client.enrich_company("acme.com")

    assert result is None
