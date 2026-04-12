import logging

import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)

APOLLO_API_URL = "https://api.apollo.io/v1/organizations/enrich"


class ApolloOrganization(BaseModel):
    name: str
    website_url: str | None = None
    industry: str | None = None
    estimated_num_employees: int | None = None
    annual_revenue_printed: str | None = None
    technologies: list[str] = []
    keywords: list[str] = []
    linkedin_url: str | None = None


class ApolloClient:
    def __init__(self, api_key: str):
        self._api_key = api_key
        self._http = httpx.AsyncClient(timeout=30.0)

    async def enrich_company(self, domain: str) -> ApolloOrganization | None:
        try:
            response = await self._http.post(
                APOLLO_API_URL,
                json={"api_key": self._api_key, "domain": domain},
            )
            response.raise_for_status()
            data = response.json()
            org = data.get("organization")
            if org is None:
                return None
            return ApolloOrganization(**org)
        except Exception:
            logger.warning("Apollo enrichment failed for domain: %s", domain, exc_info=True)
            return None

    async def close(self):
        await self._http.aclose()
