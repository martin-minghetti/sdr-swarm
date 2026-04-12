from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.scraper import ScraperResult, WebScraper


@pytest.fixture
def scraper():
    return WebScraper()


SAMPLE_HTML = """
<html>
<head><title>Acme Corp - Building the Future</title></head>
<body>
<nav><a href="/about">About</a><a href="/pricing">Pricing</a></nav>
<main>
<h1>We build enterprise widgets</h1>
<p>Acme Corp is a leading manufacturer serving 500+ clients worldwide.</p>
<p>Our AI-powered platform helps companies streamline operations.</p>
</main>
<footer>Copyright 2026 Acme Corp</footer>
</body>
</html>
"""

EMPTY_HTML = "<html><body><script>React app loading...</script></body></html>"


@pytest.mark.asyncio
async def test_scrape_success(scraper):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = SAMPLE_HTML
    mock_response.raise_for_status = lambda: None

    with patch.object(scraper._http, "get", new=AsyncMock(return_value=mock_response)):
        result = await scraper.scrape("https://acme.com")

    assert isinstance(result, ScraperResult)
    assert "enterprise widgets" in result.text
    assert result.title == "Acme Corp - Building the Future"
    assert result.extractable is True


@pytest.mark.asyncio
async def test_scrape_spa_no_content(scraper):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = EMPTY_HTML
    mock_response.raise_for_status = lambda: None

    with patch.object(scraper._http, "get", new=AsyncMock(return_value=mock_response)):
        result = await scraper.scrape("https://spa-app.com")

    assert result.extractable is False
    assert result.text == ""


@pytest.mark.asyncio
async def test_scrape_timeout(scraper):
    with patch.object(
        scraper._http, "get", new=AsyncMock(side_effect=Exception("Connection timeout"))
    ):
        result = await scraper.scrape("https://slow-site.com")

    assert result is None
