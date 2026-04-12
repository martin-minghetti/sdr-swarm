from pydantic import BaseModel


class ResearchInput(BaseModel):
    company_name: str
    company_url: str | None = None
    service_to_sell: str | None = None
    seller_context: str | None = None
