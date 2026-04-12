import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_KEY", "")
    encryption_key: str = os.getenv("ENCRYPTION_KEY", "")
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Model defaults
    agent_model: str = "claude-sonnet-4-20250514"
    scorer_model: str = "claude-haiku-4-5-20251001"

    # Retry defaults
    max_retries: int = 2
    backoff_base: float = 1.0


settings = Settings()
