import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from models.contracts import (
    CompanyProfile,
    EmailVariant,
    OpportunityBrief,
    OutreachDraft,
    QualityReport,
)
from models.inputs import ResearchInput
from orchestrator import Orchestrator, SSEEvent


def _make_profile():
    return CompanyProfile(
        company_name="Acme Corp",
        description="A test company",
        industry="SaaS",
    )


def _make_brief():
    return OpportunityBrief(
        pain_points=["scaling"],
        opportunity_fit="Good fit for automation",
        expected_objections=["budget"],
        opportunity_score=7,
        reasoning="Strong signals",
    )


def _make_draft():
    return OutreachDraft(
        formal=EmailVariant(subject="Hi", body="Hello", call_to_action="Let's chat"),
        casual=EmailVariant(subject="Hey", body="Hey there", call_to_action="Coffee?"),
    )


def _make_report():
    return QualityReport(
        overall_confidence="high",
        verified_facts=5,
        inferred_facts=2,
        uncertain_facts=1,
        sources_used=["web", "apollo"],
        research_gaps=["funding details"],
        recommendations=["Verify funding"],
    )


def _make_input():
    return ResearchInput(
        company_name="Acme Corp",
        service_to_sell="AI automation",
        seller_context="We do AI",
    )


async def _collect_events(orchestrator, input_data, research_id):
    events = []
    async for event in orchestrator.run(input_data, research_id):
        events.append(event)
    return events


class TestOrchestrator:
    @pytest.mark.asyncio
    async def test_full_pipeline_success(self):
        researcher = MagicMock()
        researcher.run_async = AsyncMock(return_value=_make_profile())
        analyst = MagicMock()
        analyst.run = MagicMock(return_value=_make_brief())
        writer = MagicMock()
        writer.run = MagicMock(return_value=_make_draft())
        scorer = MagicMock()
        scorer.run = MagicMock(return_value=_make_report())
        db = MagicMock()

        orch = Orchestrator(researcher, analyst, writer, scorer, db)
        events = await _collect_events(orch, _make_input(), "r1")

        # All 4 steps should have start + complete events
        event_types = [e.event for e in events]
        assert event_types.count("step_start") == 4
        assert event_types.count("step_complete") == 4
        assert "research_complete" in event_types

        # DB should be updated to completed
        db.update_status.assert_any_call("r1", "running")
        db.update_status.assert_any_call("r1", "completed")

        # All 4 step results saved
        assert db.save_step_result.call_count == 4

    @pytest.mark.asyncio
    async def test_writer_failure_partial_result(self):
        researcher = MagicMock()
        researcher.run_async = AsyncMock(return_value=_make_profile())
        analyst = MagicMock()
        analyst.run = MagicMock(return_value=_make_brief())
        writer = MagicMock()
        writer.run = MagicMock(side_effect=Exception("Writer broke"))
        scorer = MagicMock()
        db = MagicMock()

        orch = Orchestrator(researcher, analyst, writer, scorer, db)
        events = await _collect_events(orch, _make_input(), "r1")

        event_types = [e.event for e in events]
        assert "step_error" in event_types
        error_events = [e for e in events if e.event == "step_error"]
        assert error_events[0].data["step"] == "writer"

        # Scorer should NOT have run
        scorer.run.assert_not_called()

        # Status should be partial
        db.update_status.assert_any_call("r1", "partial")

        # Only 2 results saved (researcher + analyst)
        assert db.save_step_result.call_count == 2

    @pytest.mark.asyncio
    async def test_researcher_failure_stops_pipeline(self):
        researcher = MagicMock()
        researcher.run_async = AsyncMock(side_effect=Exception("Research failed"))
        analyst = MagicMock()
        writer = MagicMock()
        scorer = MagicMock()
        db = MagicMock()

        orch = Orchestrator(researcher, analyst, writer, scorer, db)
        events = await _collect_events(orch, _make_input(), "r1")

        event_types = [e.event for e in events]
        assert "step_error" in event_types
        assert "research_complete" not in event_types

        # No other agents should run
        analyst.run.assert_not_called()
        writer.run.assert_not_called()
        scorer.run.assert_not_called()

        # Status failed
        db.update_status.assert_any_call("r1", "failed")

    @pytest.mark.asyncio
    async def test_sse_events_have_correct_format(self):
        researcher = MagicMock()
        researcher.run_async = AsyncMock(return_value=_make_profile())
        analyst = MagicMock()
        analyst.run = MagicMock(return_value=_make_brief())
        writer = MagicMock()
        writer.run = MagicMock(return_value=_make_draft())
        scorer = MagicMock()
        scorer.run = MagicMock(return_value=_make_report())
        db = MagicMock()

        orch = Orchestrator(researcher, analyst, writer, scorer, db)
        events = await _collect_events(orch, _make_input(), "r1")

        for event in events:
            assert isinstance(event, SSEEvent)
            assert isinstance(event.event, str)
            assert isinstance(event.data, dict)

        # Check step_start events have step name
        start_events = [e for e in events if e.event == "step_start"]
        steps = [e.data["step"] for e in start_events]
        assert steps == ["researcher", "analyst", "writer", "scorer"]
