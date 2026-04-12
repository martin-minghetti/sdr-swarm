from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from crypto import encrypt_value
from cryptography.fernet import Fernet

TEST_ENCRYPTION_KEY = Fernet.generate_key().decode()


def _mock_research_db():
    db = MagicMock()
    db.create_research.return_value = {"id": "r1", "status": "pending"}
    db.get_research.return_value = {"id": "r1", "status": "completed", "input_data": {}}
    db.get_research_results.return_value = [
        {"step": "researcher", "result_data": {"company_name": "Acme"}}
    ]
    db.list_researches.return_value = [
        {"id": "r1", "status": "completed"},
        {"id": "r2", "status": "running"},
    ]
    return db


def _mock_settings_db():
    db = MagicMock()
    db.get_all_keys.return_value = {"anthropic": "sk-test", "tavily": "tvly-test"}
    db.get_keys_masked.return_value = {
        "anthropic": "sk-t...****test",
        "tavily": "tvly...****test",
    }
    db.save_key.return_value = {"key_name": "anthropic"}
    return db


@pytest.fixture
def client():
    """Create test client with mocked dependencies."""
    mock_rdb = _mock_research_db()
    mock_sdb = _mock_settings_db()

    # Import app and override dependencies
    from main import app, get_research_db, get_settings_db, get_supabase_client

    app.dependency_overrides[get_supabase_client] = lambda: MagicMock()
    app.dependency_overrides[get_research_db] = lambda: mock_rdb
    app.dependency_overrides[get_settings_db] = lambda: mock_sdb

    test_client = TestClient(app)
    test_client._mock_rdb = mock_rdb  # type: ignore[attr-defined]
    test_client._mock_sdb = mock_sdb  # type: ignore[attr-defined]

    yield test_client

    app.dependency_overrides.clear()


class TestAPI:
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_create_research(self, client):
        with patch("main._build_orchestrator") as mock_build:
            mock_build.return_value = MagicMock()
            response = client.post(
                "/api/research",
                json={
                    "company_name": "Acme Corp",
                    "company_url": "https://acme.com",
                    "service_to_sell": "AI tools",
                },
            )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        # Research should have been created in DB
        client._mock_rdb.create_research.assert_called_once()

    def test_create_research_missing_company_name(self, client):
        response = client.post(
            "/api/research",
            json={"company_url": "https://acme.com"},
        )
        assert response.status_code == 422

    def test_get_research_by_id(self, client):
        response = client.get("/api/research/r1")
        assert response.status_code == 200
        data = response.json()
        assert data["research"]["id"] == "r1"
        assert len(data["results"]) == 1

    def test_get_history(self, client):
        response = client.get("/api/history")
        assert response.status_code == 200
        data = response.json()
        assert len(data["researches"]) == 2

    def test_save_settings(self, client):
        response = client.post(
            "/api/settings",
            json={"keys": {"anthropic": "sk-new-key", "tavily": "tvly-new"}},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["saved"]["anthropic"] is True
        assert client._mock_sdb.save_key.call_count == 2

    def test_get_settings_masked(self, client):
        response = client.get("/api/settings")
        assert response.status_code == 200
        data = response.json()
        assert "anthropic" in data["keys"]
        assert "****" in data["keys"]["anthropic"]
