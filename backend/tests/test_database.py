from unittest.mock import MagicMock

from cryptography.fernet import Fernet

from crypto import encrypt_value
from models.database import ResearchDB, SettingsDB

TEST_KEY = Fernet.generate_key().decode()


def _make_chain_mock(return_data):
    """Create a mock that supports Supabase's chain pattern and returns data on .execute()."""
    mock = MagicMock()
    # Every method call returns the same mock (chaining)
    mock.insert.return_value = mock
    mock.update.return_value = mock
    mock.upsert.return_value = mock
    mock.select.return_value = mock
    mock.eq.return_value = mock
    mock.order.return_value = mock
    # .execute() returns a result with .data
    mock.execute.return_value = MagicMock(data=return_data)
    return mock


def _make_client_with_tables(**table_data):
    """Create a mock client where table(name) returns a chain mock with given data."""
    client = MagicMock()
    tables = {}
    for name, data in table_data.items():
        tables[name] = _make_chain_mock(data)
    client.table = MagicMock(side_effect=lambda name: tables[name])
    return client, tables


class TestResearchDB:
    def test_create_research(self):
        client, tables = _make_client_with_tables(
            researches=[{"id": "r1", "status": "pending"}]
        )
        db = ResearchDB(client)
        result = db.create_research("r1", {"company_name": "Acme"})
        assert result["id"] == "r1"
        assert result["status"] == "pending"
        tables["researches"].insert.assert_called_once()

    def test_update_status_completed_sets_completed_at(self):
        client, tables = _make_client_with_tables(
            researches=[{"id": "r1", "status": "completed", "completed_at": "2024-01-01"}]
        )
        db = ResearchDB(client)
        result = db.update_status("r1", "completed")
        assert result["status"] == "completed"
        call_args = tables["researches"].update.call_args[0][0]
        assert "completed_at" in call_args
        assert call_args["status"] == "completed"

    def test_update_status_running_no_completed_at(self):
        client, tables = _make_client_with_tables(
            researches=[{"id": "r1", "status": "running"}]
        )
        db = ResearchDB(client)
        db.update_status("r1", "running")
        call_args = tables["researches"].update.call_args[0][0]
        assert "completed_at" not in call_args
        assert call_args["status"] == "running"

    def test_save_step_result(self):
        client, tables = _make_client_with_tables(
            research_results=[{"research_id": "r1", "step": "researcher"}]
        )
        db = ResearchDB(client)
        result = db.save_step_result("r1", "researcher", {"data": "test"})
        assert result["step"] == "researcher"

    def test_get_research_found(self):
        client, tables = _make_client_with_tables(
            researches=[{"id": "r1", "status": "completed"}]
        )
        db = ResearchDB(client)
        result = db.get_research("r1")
        assert result is not None
        assert result["id"] == "r1"

    def test_get_research_not_found(self):
        client, tables = _make_client_with_tables(researches=[])
        db = ResearchDB(client)
        result = db.get_research("nonexistent")
        assert result is None

    def test_list_researches(self):
        client, tables = _make_client_with_tables(
            researches=[{"id": "r1"}, {"id": "r2"}]
        )
        db = ResearchDB(client)
        result = db.list_researches()
        assert len(result) == 2


class TestSettingsDB:
    def test_save_key_uses_upsert_with_on_conflict(self):
        client, tables = _make_client_with_tables(
            api_keys=[{"key_name": "anthropic", "encrypted_value": "enc"}]
        )
        db = SettingsDB(client, TEST_KEY)
        db.save_key("anthropic", "sk-test-123")
        tables["api_keys"].upsert.assert_called_once()
        call_kwargs = tables["api_keys"].upsert.call_args[1]
        assert call_kwargs["on_conflict"] == "key_name"

    def test_get_key_found(self):
        encrypted = encrypt_value("sk-real-key", TEST_KEY)
        client, tables = _make_client_with_tables(
            api_keys=[{"encrypted_value": encrypted}]
        )
        db = SettingsDB(client, TEST_KEY)
        result = db.get_key("anthropic")
        assert result == "sk-real-key"

    def test_get_key_not_found(self):
        client, tables = _make_client_with_tables(api_keys=[])
        db = SettingsDB(client, TEST_KEY)
        result = db.get_key("nonexistent")
        assert result is None

    def test_get_keys_masked(self):
        encrypted = encrypt_value("sk-ant-api03-secret-key", TEST_KEY)
        client, tables = _make_client_with_tables(
            api_keys=[{"key_name": "anthropic", "encrypted_value": encrypted}]
        )
        db = SettingsDB(client, TEST_KEY)
        result = db.get_keys_masked()
        assert "anthropic" in result
        assert "****" in result["anthropic"]
        assert "sk-ant-api03-secret-key" not in result["anthropic"]
