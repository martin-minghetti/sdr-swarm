import asyncio
import json
import uuid
from typing import AsyncGenerator

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from supabase import create_client

from config import settings
from models.database import ResearchDB, SettingsDB
from models.inputs import ResearchInput

app = FastAPI(title="SDR Swarm API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory SSE streams
_active_streams: dict[str, asyncio.Queue] = {}


# --- Dependency factories (patchable in tests) ---


def get_supabase_client():
    return create_client(settings.supabase_url, settings.supabase_key)


def get_research_db(client=Depends(get_supabase_client)):
    return ResearchDB(client)


def get_settings_db(client=Depends(get_supabase_client)):
    return SettingsDB(client, settings.encryption_key)


# --- Request models ---


class SettingsRequest(BaseModel):
    keys: dict[str, str]


# --- Helpers ---


def _build_orchestrator(research_db: ResearchDB, api_keys: dict[str, str]):
    """Build orchestrator with real agent instances using stored API keys."""
    from agents.analyst import AnalystAgent
    from agents.researcher import ResearcherAgent
    from agents.scorer import ScorerAgent
    from agents.writer import WriterAgent
    from orchestrator import Orchestrator
    from services.anthropic_client import AnthropicClient
    from services.apollo import ApolloClient
    from services.scraper import WebScraper
    from services.tavily import TavilyClient

    anthropic_client = AnthropicClient(api_key=api_keys.get("anthropic", ""))
    tavily_client = TavilyClient(api_key=api_keys.get("tavily", ""))
    scraper = WebScraper()
    apollo_client = (
        ApolloClient(api_key=api_keys["apollo"]) if "apollo" in api_keys else None
    )

    researcher = ResearcherAgent(anthropic_client, tavily_client, scraper, apollo_client)
    analyst = AnalystAgent(anthropic_client)
    writer = WriterAgent(anthropic_client)
    scorer = ScorerAgent(anthropic_client)

    return Orchestrator(researcher, analyst, writer, scorer, research_db)


async def _run_pipeline(orchestrator, input_data: ResearchInput, research_id: str):
    """Run the orchestrator pipeline and push events to the SSE queue."""
    queue = _active_streams.get(research_id)
    try:
        async for event in orchestrator.run(input_data, research_id):
            if queue:
                await queue.put(event)
    finally:
        if queue:
            await queue.put(None)  # Signal stream end


async def _sse_generator(research_id: str) -> AsyncGenerator[str, None]:
    """Generate SSE events from the queue."""
    queue = _active_streams.get(research_id)
    if not queue:
        return
    while True:
        event = await queue.get()
        if event is None:
            break
        yield f"event: {event.event}\ndata: {json.dumps(event.data)}\n\n"


# --- Endpoints ---


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/research")
async def create_research(
    input_data: ResearchInput,
    background_tasks: BackgroundTasks,
    research_db: ResearchDB = Depends(get_research_db),
    settings_db: SettingsDB = Depends(get_settings_db),
):
    # Check that required keys exist
    api_keys = settings_db.get_all_keys()
    required = ["anthropic", "tavily"]
    missing = [k for k in required if k not in api_keys]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing API keys: {', '.join(missing)}")

    research_id = str(uuid.uuid4())
    research_db.create_research(research_id, input_data.model_dump())

    # Set up SSE queue
    _active_streams[research_id] = asyncio.Queue()

    # Build orchestrator and start pipeline
    orchestrator = _build_orchestrator(research_db, api_keys)
    background_tasks.add_task(_run_pipeline, orchestrator, input_data, research_id)

    return {"id": research_id}


@app.get("/api/research/{research_id}")
def get_research(
    research_id: str,
    research_db: ResearchDB = Depends(get_research_db),
):
    research = research_db.get_research(research_id)
    if not research:
        raise HTTPException(status_code=404, detail="Research not found")
    results = research_db.get_research_results(research_id)
    return {"research": research, "results": results}


@app.get("/api/research/{research_id}/stream")
async def stream_research(research_id: str):
    if research_id not in _active_streams:
        raise HTTPException(status_code=404, detail="No active stream for this research")
    return StreamingResponse(
        _sse_generator(research_id),
        media_type="text/event-stream",
    )


@app.get("/api/history")
def get_history(research_db: ResearchDB = Depends(get_research_db)):
    return {"researches": research_db.list_researches()}


@app.post("/api/settings")
def save_settings(
    request: SettingsRequest,
    settings_db: SettingsDB = Depends(get_settings_db),
):
    saved = {}
    for key_name, key_value in request.keys.items():
        settings_db.save_key(key_name, key_value)
        saved[key_name] = True
    return {"saved": saved}


@app.get("/api/settings")
def get_settings(settings_db: SettingsDB = Depends(get_settings_db)):
    return {"keys": settings_db.get_keys_masked()}


@app.post("/api/settings/validate")
def validate_settings(settings_db: SettingsDB = Depends(get_settings_db)):
    keys = settings_db.get_all_keys()
    results = {}
    for key_name, key_value in keys.items():
        results[key_name] = bool(key_value and len(key_value) > 5)
    return {"valid": results}
