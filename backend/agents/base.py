import logging
import time
from abc import ABC, abstractmethod

from pydantic import BaseModel

from services.anthropic_client import AnthropicClient, StructuredOutputError

logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    system_prompt: str
    model: str
    input_schema: type[BaseModel]
    output_schema: type[BaseModel]
    max_retries: int = 2

    def __init__(self, anthropic_client: AnthropicClient):
        self._anthropic = anthropic_client
        self.last_duration_ms: int = 0

    @abstractmethod
    def build_user_message(self, input_data: BaseModel) -> str:
        ...

    def run(self, input_data: BaseModel) -> BaseModel:
        start = time.monotonic()
        user_message = self.build_user_message(input_data)
        last_error: StructuredOutputError | None = None

        for attempt in range(1 + self.max_retries):
            try:
                result = self._anthropic.generate_structured(
                    system_prompt=self.system_prompt,
                    user_message=user_message,
                    output_schema=self.output_schema,
                    model=self.model,
                )
                self.last_duration_ms = int((time.monotonic() - start) * 1000)
                return result
            except StructuredOutputError as e:
                last_error = e
                logger.warning(
                    "Agent %s attempt %d/%d failed: %s",
                    self.__class__.__name__,
                    attempt + 1,
                    1 + self.max_retries,
                    e,
                )

        self.last_duration_ms = int((time.monotonic() - start) * 1000)
        raise last_error  # type: ignore[misc]
