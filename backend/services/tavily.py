import logging

import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)

TAVILY_API_URL = "https://api.tavily.com/search"


class TavilyResult(BaseModel):
    title: str
    url: str
    content: str
    score: float


class TavilyClient:
    def __init__(self, api_key: str):
        self._api_key = api_key
        self._http = httpx.AsyncClient(timeout=30.0)

    async def search(self, query: str) -> list[TavilyResult]:
        try:
            response = await self._http.post(
                TAVILY_API_URL,
                json={
                    "api_key": self._api_key,
                    "query": query,
                    "search_depth": "advanced",
                    "max_results": 5,
                },
            )
            response.raise_for_status()
            data = response.json()
            return [TavilyResult(**r) for r in data.get("results", [])]
        except Exception:
            logger.warning("Tavily search failed for query: %s", query, exc_info=True)
            return []

    async def search_multiple(self, queries: list[str]) -> list[TavilyResult]:
        import asyncio

        results_lists = await asyncio.gather(*[self.search(q) for q in queries])
        combined: list[TavilyResult] = []
        for results in results_lists:
            combined.extend(results)
        return combined

    async def close(self):
        await self._http.aclose()
