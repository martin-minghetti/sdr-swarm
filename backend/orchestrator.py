import logging
from dataclasses import dataclass, field
from typing import AsyncGenerator

from agents.analyst import AnalystInput
from agents.scorer import ScorerInput
from agents.writer import WriterInput
from models.inputs import ResearchInput

logger = logging.getLogger(__name__)


@dataclass
class SSEEvent:
    event: str
    data: dict = field(default_factory=dict)


class Orchestrator:
    def __init__(self, researcher, analyst, writer, scorer, research_db):
        self._researcher = researcher
        self._analyst = analyst
        self._writer = writer
        self._scorer = scorer
        self._db = research_db

    async def run(
        self,
        input_data: ResearchInput,
        research_id: str,
    ) -> AsyncGenerator[SSEEvent, None]:
        self._db.update_status(research_id, "running")

        # Step 1: Researcher
        yield SSEEvent(event="step_start", data={"step": "researcher"})
        try:
            profile = await self._researcher.run_async(input_data)
            self._db.save_step_result(research_id, "researcher", profile.model_dump())
            yield SSEEvent(event="step_complete", data={"step": "researcher"})
        except Exception as e:
            logger.error("Researcher failed: %s", e)
            yield SSEEvent(event="step_error", data={"step": "researcher", "error": str(e)})
            self._db.update_status(research_id, "failed")
            return

        # Step 2: Analyst
        yield SSEEvent(event="step_start", data={"step": "analyst"})
        try:
            analyst_input = AnalystInput(
                profile=profile,
                service_to_sell=input_data.service_to_sell,
                seller_context=input_data.seller_context,
            )
            brief = self._analyst.run(analyst_input)
            self._db.save_step_result(research_id, "analyst", brief.model_dump())
            yield SSEEvent(event="step_complete", data={"step": "analyst"})
        except Exception as e:
            logger.error("Analyst failed: %s", e)
            yield SSEEvent(event="step_error", data={"step": "analyst", "error": str(e)})
            self._db.update_status(research_id, "partial")
            return

        # Step 3: Writer
        draft = None
        yield SSEEvent(event="step_start", data={"step": "writer"})
        try:
            writer_input = WriterInput(
                profile=profile,
                brief=brief,
                seller_context=input_data.seller_context,
            )
            draft = self._writer.run(writer_input)
            self._db.save_step_result(research_id, "writer", draft.model_dump())
            yield SSEEvent(event="step_complete", data={"step": "writer"})
        except Exception as e:
            logger.error("Writer failed: %s", e)
            yield SSEEvent(event="step_error", data={"step": "writer", "error": str(e)})

        # Step 4: Scorer (only if writer succeeded)
        if draft is not None:
            yield SSEEvent(event="step_start", data={"step": "scorer"})
            try:
                scorer_input = ScorerInput(
                    profile=profile,
                    brief=brief,
                    draft=draft,
                )
                report = self._scorer.run(scorer_input)
                self._db.save_step_result(research_id, "scorer", report.model_dump())
                yield SSEEvent(event="step_complete", data={"step": "scorer"})
            except Exception as e:
                logger.error("Scorer failed: %s", e)
                yield SSEEvent(event="step_error", data={"step": "scorer", "error": str(e)})

        # Final status
        if draft is None:
            self._db.update_status(research_id, "partial")
        else:
            self._db.update_status(research_id, "completed")

        yield SSEEvent(event="research_complete", data={"research_id": research_id})
