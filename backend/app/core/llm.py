"""
LLM Provider for Groq API integration.

Uses the groq Python SDK with llama-3.3-70b-versatile.
Free tier: 14,400 requests/day, works globally.
"""
import logging
from groq import Groq

logger = logging.getLogger(__name__)

MODEL_NAME = "llama-3.3-70b-versatile"


class LLMProvider:
    """Provider for Groq API calls."""

    @staticmethod
    def complete(
        system_prompt: str,
        user_message: str,
        max_tokens: int = 1000,
        history: list = None,
    ) -> tuple[str, int]:
        """
        Call Groq API with system prompt, optional conversation history, and user message.

        history: list of {"role": "user"|"assistant", "content": str} dicts (previous turns).
        Returns (response_text, tokens_used).
        """
        from app.core.config import settings

        if not settings.groq_api_key:
            logger.error("Groq API key not configured — set GROQ_API_KEY in .env")
            raise ValueError("LLM service not available: GROQ_API_KEY not set")

        client = Groq(api_key=settings.groq_api_key)

        messages_payload = [{"role": "system", "content": system_prompt}]
        if history:
            messages_payload.extend(history)
        messages_payload.append({"role": "user", "content": user_message})

        logger.info(f"LLM request: model={MODEL_NAME}, max_tokens={max_tokens}, history_turns={len(history or [])}")

        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages_payload,
                max_tokens=max_tokens,
            )
        except Exception as e:
            err_str = str(e)
            if "401" in err_str or "invalid_api_key" in err_str.lower():
                logger.error(f"Groq API key is invalid or expired. Raw error: {e}")
            elif "429" in err_str or "rate_limit" in err_str.lower():
                logger.error(f"Groq rate limit hit. Raw error: {e}")
            else:
                logger.error(f"Groq API call failed: {e}")
            raise

        response_text = response.choices[0].message.content
        tokens_used = response.usage.completion_tokens if response.usage else 0

        logger.info(f"LLM response generated: tokens_used={tokens_used}")

        return response_text, tokens_used
