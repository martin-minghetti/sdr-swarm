import json
import logging
import re

import anthropic
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class StructuredOutputError(Exception):
    """Raised when Claude's response can't be parsed into the expected schema."""

    pass


class AnthropicClient:
    def __init__(self, api_key: str):
        self._client = anthropic.Anthropic(api_key=api_key)

    def generate_structured(
        self,
        system_prompt: str,
        user_message: str,
        output_schema: type[BaseModel],
        model: str,
        max_tokens: int = 4096,
    ) -> BaseModel:
        schema_json = json.dumps(output_schema.model_json_schema(), indent=2)
        full_prompt = (
            f"{user_message}\n\nRespond with ONLY valid JSON matching this schema:\n{schema_json}"
        )

        response = self._client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": full_prompt}],
        )

        text = response.content[0].text

        # Strip markdown fences if present
        cleaned = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)

        try:
            data = json.loads(cleaned)
            return output_schema.model_validate(data)
        except (json.JSONDecodeError, Exception) as e:
            raise StructuredOutputError(
                f"Failed to parse response into {output_schema.__name__}: {e}\n"
                f"Raw response: {text[:500]}"
            ) from e

    def generate_text(
        self,
        system_prompt: str,
        user_message: str,
        model: str,
        max_tokens: int = 1024,
    ) -> str:
        response = self._client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text
