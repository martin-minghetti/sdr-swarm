import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

from agents.researcher import ResearcherAgent
from models.contracts import CompanyProfile
from models.inputs import ResearchInput
from services.anthropic_client import AnthropicClient


@pytest.fixture
def fixtures():
    return json.loads(
        (Path(__file__).parent.parent / "fixtures" / "claude_responses.json").read_text()
    )


@pytest.fixture
def mock_anthropic(fixtures):
    client = MagicMock(spec=AnthropicClient)
    client.generate_text.return_value = fixtures["researcher_queries"]
    client.generate_structured.return_value = CompanyProfile(**fixtures["researcher_profile"])
    return client


@pytest.fixture
def mock_tavily():
    from services.tavily import TavilyClient, TavilyResult

    client = AsyncMock(spec=TavilyClient)
    client.search_multiple.return_value = [
        TavilyResult(
            title="Acme Corp - About Us",
            url="https://acme.com/about",
            content="Acme Corp is a leading manufacturer.",
            score=0.95,
        )
    ]
    return client


@pytest.fixture
def mock_scraper():
    from services.scraper import ScraperResult, WebScraper

    scraper = AsyncMock(spec=WebScraper)
    scraper.scrape.return_value = ScraperResult(
        title="Acme Corp", text="We build enterprise widgets.", extractable=True
    )
    return scraper


@pytest.fixture
def mock_apollo():
    from services.apollo import ApolloClient, ApolloOrganization

    client = AsyncMock(spec=ApolloClient)
    client.enrich_company.return_value = ApolloOrganization(
        name="Acme Corp",
        industry="Manufacturing",
        estimated_num_employees=150,
        technologies=["React", "Python"],
    )
    return client


@pytest.mark.asyncio
async def test_researcher_full_pipeline(mock_anthropic, mock_tavily, mock_scraper, mock_apollo):
    agent = ResearcherAgent(
        anthropic_client=mock_anthropic,
        tavily_client=mock_tavily,
        scraper=mock_scraper,
        apollo_client=mock_apollo,
    )
    result = await agent.run_async(
        ResearchInput(company_name="Acme Corp", company_url="https://acme.com")
    )
    assert isinstance(result, CompanyProfile)
    assert result.company_name == "Acme Corp"
    mock_anthropic.generate_text.assert_called_once()
    mock_anthropic.generate_structured.assert_called_once()
    mock_tavily.search_multiple.assert_called_once()
    mock_scraper.scrape.assert_called_once()
    mock_apollo.enrich_company.assert_called_once()


@pytest.mark.asyncio
async def test_researcher_without_apollo(mock_anthropic, mock_tavily, mock_scraper):
    agent = ResearcherAgent(
        anthropic_client=mock_anthropic,
        tavily_client=mock_tavily,
        scraper=mock_scraper,
        apollo_client=None,
    )
    result = await agent.run_async(ResearchInput(company_name="Acme Corp"))
    assert isinstance(result, CompanyProfile)


@pytest.mark.asyncio
async def test_researcher_scraper_fails(mock_anthropic, mock_tavily, mock_apollo):
    failing_scraper = AsyncMock()
    failing_scraper.scrape.return_value = None
    agent = ResearcherAgent(
        anthropic_client=mock_anthropic,
        tavily_client=mock_tavily,
        scraper=failing_scraper,
        apollo_client=mock_apollo,
    )
    result = await agent.run_async(
        ResearchInput(company_name="Acme Corp", company_url="https://acme.com")
    )
    assert isinstance(result, CompanyProfile)


@pytest.mark.asyncio
async def test_researcher_generates_queries(mock_anthropic, mock_tavily, mock_scraper):
    agent = ResearcherAgent(
        anthropic_client=mock_anthropic,
        tavily_client=mock_tavily,
        scraper=mock_scraper,
        apollo_client=None,
    )
    await agent.run_async(ResearchInput(company_name="Acme Corp"))
    call_args = mock_anthropic.generate_text.call_args
    assert "Acme Corp" in call_args.kwargs["user_message"]
