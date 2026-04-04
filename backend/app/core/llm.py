"""
LLM Provider for Anthropic Claude API integration.

Provides a clean interface for calling LLM models while
abstracting the specific provider implementation.
"""
from typing import Optional
import logging
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class LLMProvider:
    """Provider for Anthropic LLM API calls."""

    @staticmethod
    def complete(
        system_prompt: str,
        user_message: str,
        max_tokens: int = 1000,
    ) -> tuple[str, int]:
        """
        Call Anthropic Claude API with system prompt and user message.

        Returns (response_text, tokens_used).
        """
        try:
            # Import settings here to avoid circular imports
            from app.core.config import settings

            if not settings.anthropic_api_key:
                logger.error("Anthropic API key not configured")
                raise ValueError("LLM service not available: API key not configured")

            client = Anthropic(api_key=settings.anthropic_api_key)

            logger.info(f"LLM request: max_tokens={max_tokens}")

            message = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=max_tokens,
                system=[system_prompt],
                messages=[
                    {"role": "user", "content": user_message}
                ],
            )

            # Extract response and usage
            response_text = message.content[0].text
            tokens_used = message.usage.output_tokens

            logger.info(f"LLM response generated: tokens_used={tokens_used}")

            return response_text, tokens_used

        except Exception as e:
            logger.error(f"LLM request failed: {e}")
            raise
