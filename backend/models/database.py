from datetime import datetime, timezone

from crypto import decrypt_value, encrypt_value, mask_key


class ResearchDB:
    def __init__(self, client):
        self._client = client

    def create_research(self, research_id: str, input_data: dict) -> dict:
        row = {
            "id": research_id,
            "status": "pending",
            "input_data": input_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        result = self._client.table("researches").insert(row).execute()
        return result.data[0]

    def update_status(self, research_id: str, status: str) -> dict:
        update = {"status": status}
        if status in ("completed", "partial", "failed"):
            update["completed_at"] = datetime.now(timezone.utc).isoformat()
        result = (
            self._client.table("researches")
            .update(update)
            .eq("id", research_id)
            .execute()
        )
        return result.data[0]

    def save_step_result(self, research_id: str, step: str, result_data: dict) -> dict:
        row = {
            "research_id": research_id,
            "step": step,
            "result_data": result_data,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        result = self._client.table("research_results").insert(row).execute()
        return result.data[0]

    def get_research(self, research_id: str) -> dict | None:
        result = (
            self._client.table("researches")
            .select("*")
            .eq("id", research_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def get_research_results(self, research_id: str) -> list[dict]:
        result = (
            self._client.table("research_results")
            .select("*")
            .eq("research_id", research_id)
            .execute()
        )
        return result.data

    def list_researches(self) -> list[dict]:
        result = (
            self._client.table("researches")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return result.data


class SettingsDB:
    def __init__(self, client, encryption_key: str):
        self._client = client
        self._encryption_key = encryption_key

    def save_key(self, key_name: str, key_value: str) -> dict:
        encrypted = encrypt_value(key_value, self._encryption_key)
        row = {
            "key_name": key_name,
            "encrypted_value": encrypted,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        result = (
            self._client.table("api_keys")
            .upsert(row, on_conflict="key_name")
            .execute()
        )
        return result.data[0]

    def get_key(self, key_name: str) -> str | None:
        result = (
            self._client.table("api_keys")
            .select("encrypted_value")
            .eq("key_name", key_name)
            .execute()
        )
        if not result.data:
            return None
        return decrypt_value(result.data[0]["encrypted_value"], self._encryption_key)

    def get_all_keys(self) -> dict[str, str]:
        result = (
            self._client.table("api_keys")
            .select("key_name, encrypted_value")
            .execute()
        )
        return {
            row["key_name"]: decrypt_value(row["encrypted_value"], self._encryption_key)
            for row in result.data
        }

    def get_keys_masked(self) -> dict[str, str]:
        result = (
            self._client.table("api_keys")
            .select("key_name, encrypted_value")
            .execute()
        )
        return {
            row["key_name"]: mask_key(
                decrypt_value(row["encrypted_value"], self._encryption_key)
            )
            for row in result.data
        }
