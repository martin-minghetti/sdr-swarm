import asyncio
import logging
import time

from models.contracts import CompanyProfile
from models.inputs import ResearchInput
from services.anthropic_client import AnthropicClient
from services.apollo import ApolloClient
from services.scraper import WebScraper
from services.tavily import TavilyClient

logger = logging.getLogger(__name__)

QUERY_GENERATION_PROMPT = """You generate optimized web search queries for company research.
Given a company name and optional URL, generate 3-5 search queries that will find:
- Company overview and description
- Recent news, funding, acquisitions
- Technology stack and engineering blog
- Competitors and market position
Return ONLY the queries, one per line, numbered."""

SYNTHESIS_PROMPT = """You are a company research analyst. Given raw data from multiple sources
(web search results, website content, and enrichment data), synthesize a structured company profile.

Be precise about confidence levels:
- "high": fact appears in 2+ independent sources
- "medium": fact from one reliable source
- "low": inferred or from unreliable source

Include ALL sources in raw_sources.
Set website_extractable to false if no website content was provided."""


class ResearcherAgent:
    def __init__(
        self,
        anthropic_client: AnthropicClient,
        tavily_client: TavilyClient,
        scraper: WebScraper,
        apollo_client: ApolloClient | None = None,
    ):
        self._anthropic = anthropic_client
        self._tavily = tavily_client
        self._scraper = scraper
        self._apollo = apollo_client
        self.last_duration_ms: int = 0

    async def run_async(self, input_data: ResearchInput) -> CompanyProfile:
        start = time.monotonic()
        queries = self._generate_queries(input_data)
        search_results, scraper_result, apollo_result = await self._gather_data(
            queries,
            input_data.company_url,
        )
        raw_context = self._build_context(search_results, scraper_result, apollo_result)
        profile = self._synthesize(input_data.company_name, raw_context)
        self.last_duration_ms = int((time.monotonic() - start) * 1000)
        return profile

    def _generate_queries(self, input_data: ResearchInput) -> list[str]:
        url_hint = f" (website: {input_data.company_url})" if input_data.company_url else ""
        response = self._anthropic.generate_text(
            system_prompt=QUERY_GENERATION_PROMPT,
            user_message=f"Company: {input_data.company_name}{url_hint}",
            model="claude-haiku-4-5-20251001",
        )
        queries = []
        for line in response.strip().split("\n"):
            cleaned = line.strip().lstrip("0123456789.-) ").strip()
            if cleaned:
                queries.append(cleaned)
        return queries[:5]

    async def _gather_data(self, queries, company_url):
        tasks = [self._tavily.search_multiple(queries)]
        if company_url:
            tasks.append(self._scraper.scrape(company_url))
        else:
            tasks.append(self._noop())
        if self._apollo and company_url:
            domain = company_url.replace("https://", "").replace("http://", "").rstrip("/")
            tasks.append(self._apollo.enrich_company(domain))
        else:
            tasks.append(self._noop())

        results = await asyncio.gather(*tasks, return_exceptions=True)
        search_results = results[0] if not isinstance(results[0], Exception) else []
        scraper_result = results[1] if not isinstance(results[1], Exception) else None
        apollo_result = results[2] if not isinstance(results[2], Exception) else None
        return search_results, scraper_result, apollo_result

    @staticmethod
    async def _noop():
        return None

    def _build_context(self, search_results, scraper_result, apollo_result) -> str:
        parts = []
        if search_results:
            parts.append("## Web Search Results")
            for r in search_results:
                parts.append(f"**{r.title}** ({r.url})\n{r.content}\n")
        if scraper_result and scraper_result.extractable:
            parts.append(
                f"## Company Website Content\n"
                f"Title: {scraper_result.title}\n"
                f"{scraper_result.text}\n"
            )
        elif scraper_result and not scraper_result.extractable:
            parts.append(
                "## Company Website\n"
                "Note: Website uses client-side rendering. "
                "No content extracted.\n"
            )
        if apollo_result:
            techs = ", ".join(apollo_result.technologies)
            keywords = ", ".join(apollo_result.keywords)
            parts.append(
                f"## Apollo Enrichment Data\n"
                f"Name: {apollo_result.name}\n"
                f"Industry: {apollo_result.industry}\n"
                f"Employees: {apollo_result.estimated_num_employees}\n"
                f"Revenue: {apollo_result.annual_revenue_printed}\n"
                f"Technologies: {techs}\n"
                f"Keywords: {keywords}\n"
            )
        return "\n".join(parts) if parts else "No data gathered."

    def _synthesize(self, company_name: str, raw_context: str) -> CompanyProfile:
        return self._anthropic.generate_structured(
            system_prompt=SYNTHESIS_PROMPT,
            user_message=f"Research data for {company_name}:\n\n{raw_context}",
            output_schema=CompanyProfile,
            model="claude-sonnet-4-20250514",
        )
