"""LLM provider abstraction.

A thin, configurable layer so the simplification / fact-extraction / verification
services never talk to a vendor SDK directly. The default provider is Anthropic
(Claude), but ``LLM_PROVIDER`` can select OpenAI, an OpenAI-compatible endpoint,
or Google Gemini without changing any calling code.

If no API key is configured the layer raises ``LLMNotConfiguredError`` so the API
can return an honest, actionable error instead of fabricating results.
"""
from __future__ import annotations

import json
import re
from typing import Any

from app.config import settings


class LLMError(RuntimeError):
    """Generic failure while talking to the LLM provider."""


class LLMNotConfiguredError(LLMError):
    """Raised when the selected provider has no API key configured."""


def _extract_json(text: str) -> Any:
    """Best-effort parse of a JSON object/array possibly wrapped in prose or fences."""
    text = text.strip()
    # Strip ```json ... ``` fences if present.
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Fallback: grab the outermost {...} or [...] block.
    for opener, closer in (("{", "}"), ("[", "]")):
        start = text.find(opener)
        end = text.rfind(closer)
        if start != -1 and end != -1 and end > start:
            snippet = text[start : end + 1]
            try:
                return json.loads(snippet)
            except json.JSONDecodeError:
                continue
    raise LLMError("Could not parse JSON from the model response.")


def _to_json_schema(value: Any) -> Any:
    """Convert Gemini-style schema type names to standard JSON Schema types."""
    if isinstance(value, list):
        return [_to_json_schema(item) for item in value]
    if not isinstance(value, dict):
        return value

    converted = {}
    for key, item in value.items():
        if key == "type" and isinstance(item, str):
            converted[key] = item.lower()
        else:
            converted[key] = _to_json_schema(item)
    if converted.get("type") == "object":
        converted.setdefault("additionalProperties", False)
    return converted


class LLMClient:
    """Dispatches completion calls to the configured provider."""

    def __init__(self) -> None:
        self.provider = (settings.llm_provider or "anthropic").lower()
        self.model = settings.llm_model
        self.max_tokens = settings.llm_max_tokens

    # ---- public API ----
    def is_configured(self) -> bool:
        if self.provider == "anthropic":
            return bool(settings.anthropic_api_key)
        if self.provider in ("openai", "openai_compatible"):
            return bool(settings.openai_api_key)
        if self.provider == "openrouter":
            return bool(settings.openrouter_api_key)
        if self.provider == "gemini":
            return bool(settings.google_api_key)
        return False

    def complete(
        self,
        system: str,
        prompt: str,
        temperature: float = 0.2,
        *,
        response_schema: dict[str, Any] | None = None,
        reasoning: dict[str, Any] | None = None,
    ) -> str:
        if not self.is_configured():
            raise LLMNotConfiguredError(
                f"No API key configured for provider '{self.provider}'. "
                "Set the matching key in backend/.env (e.g. ANTHROPIC_API_KEY)."
            )
        if self.provider == "anthropic":
            return self._anthropic(system, prompt, temperature)
        if self.provider in ("openai", "openai_compatible"):
            return self._openai(system, prompt, temperature)
        if self.provider == "openrouter":
            return self._openrouter(
                system,
                prompt,
                temperature,
                response_schema=response_schema,
                reasoning=reasoning,
            )
        if self.provider == "gemini":
            return self._gemini(system, prompt, temperature, response_schema=response_schema)
        raise LLMError(f"Unknown LLM provider '{self.provider}'.")

    def complete_json(
        self,
        system: str,
        prompt: str,
        temperature: float = 0.0,
        *,
        response_schema: dict[str, Any] | None = None,
        reasoning: dict[str, Any] | None = None,
    ) -> Any:
        raw = self.complete(
            system,
            prompt,
            temperature,
            response_schema=response_schema,
            reasoning=reasoning,
        )
        return _extract_json(raw)

    # ---- providers ----
    def _anthropic(self, system: str, prompt: str, temperature: float) -> str:
        try:
            import anthropic
        except ImportError as exc:  # pragma: no cover
            raise LLMError("The 'anthropic' package is not installed.") from exc
        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        # NOTE: temperature/top_p/top_k are intentionally NOT sent to Anthropic.
        # Current Claude models (e.g. Sonnet 5.5) reject non-default sampling
        # params with a 400 error, so we rely on the model default. The
        # `temperature` arg is still honoured by the OpenAI/Gemini providers.
        try:
            msg = client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"Anthropic request failed: {exc}") from exc
        return "".join(block.text for block in msg.content if block.type == "text")

    def _openai(self, system: str, prompt: str, temperature: float) -> str:
        try:
            from openai import OpenAI
        except ImportError as exc:  # pragma: no cover
            raise LLMError("The 'openai' package is not installed.") from exc
        kwargs: dict[str, Any] = {"api_key": settings.openai_api_key}
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url
        client = OpenAI(**kwargs)
        try:
            resp = client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
            )
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"OpenAI request failed: {exc}") from exc
        return resp.choices[0].message.content or ""

    def _openrouter(
        self,
        system: str,
        prompt: str,
        temperature: float,
        *,
        response_schema: dict[str, Any] | None = None,
        reasoning: dict[str, Any] | None = None,
    ) -> str:
        try:
            from openai import OpenAI
        except ImportError as exc:  # pragma: no cover
            raise LLMError("The 'openai' package is not installed.") from exc

        client = OpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
        )
        request: dict[str, Any] = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        }
        if response_schema is not None:
            request["response_format"] = {
                "type": "json_schema",
                "json_schema": {
                    "name": "document_qa_response",
                    "strict": True,
                    "schema": _to_json_schema(response_schema),
                },
            }
            request["extra_body"] = {"provider": {"require_parameters": True}}
        if reasoning is not None:
            request.setdefault("extra_body", {})["reasoning"] = reasoning
        try:
            resp = client.chat.completions.create(**request)
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"OpenRouter request failed: {exc}") from exc
        return resp.choices[0].message.content or ""

    def _gemini(
        self,
        system: str,
        prompt: str,
        temperature: float,
        *,
        response_schema: dict[str, Any] | None = None,
    ) -> str:
        try:
            import google.generativeai as genai
        except ImportError as exc:  # pragma: no cover
            raise LLMError("The 'google-generativeai' package is not installed.") from exc
        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel(self.model, system_instruction=system)
        generation_config: dict[str, Any] = {
            "temperature": temperature,
            "max_output_tokens": self.max_tokens,
        }
        if response_schema is not None:
            generation_config["response_mime_type"] = "application/json"
            generation_config["response_schema"] = response_schema
        try:
            resp = model.generate_content(
                prompt,
                generation_config=generation_config,
            )
        except Exception as exc:  # noqa: BLE001
            raise LLMError(f"Gemini request failed: {exc}") from exc
        return resp.text or ""


llm_client = LLMClient()
