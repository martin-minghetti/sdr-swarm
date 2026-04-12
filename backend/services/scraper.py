import logging

import httpx
from bs4 import BeautifulSoup
from pydantic import BaseModel

logger = logging.getLogger(__name__)

MIN_CONTENT_LENGTH = 100


class ScraperResult(BaseModel):
    title: str
    text: str
    extractable: bool


class WebScraper:
    def __init__(self):
        self._http = httpx.AsyncClient(
            timeout=15.0,
            follow_redirects=True,
            headers={"User-Agent": "SDR-Swarm-Bot/1.0 (research tool)"},
        )

    async def scrape(self, url: str) -> ScraperResult | None:
        try:
            response = await self._http.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()

            title = soup.title.string.strip() if soup.title and soup.title.string else ""
            text = soup.get_text(separator=" ", strip=True)

            if len(text) < MIN_CONTENT_LENGTH:
                return ScraperResult(title=title, text="", extractable=False)

            return ScraperResult(title=title, text=text[:5000], extractable=True)
        except Exception:
            logger.warning("Scraping failed for URL: %s", url, exc_info=True)
            return None

    async def close(self):
        await self._http.aclose()
