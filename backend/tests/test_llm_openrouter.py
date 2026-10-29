import json
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.config import settings
from app.services import document_qa
from app.services.document_qa import DOCUMENT_QA_RESPONSE_SCHEMA
from app.services.llm import LLMClient, LLMError, _to_json_schema


class OpenRouterProviderTests(unittest.TestCase):
    def setUp(self):
        self.patches = [
            patch.object(settings, "llm_provider", "openrouter"),
            patch.object(settings, "llm_model", "qwen/qwen3.8-27b:free"),
            patch.object(settings, "llm_max_tokens", 4000),
            patch.object(settings, "openrouter_api_key", "test-openrouter-key"),
            patch.object(
                settings,
                "openrouter_base_url",
                "https://openrouter.example.test/api/v1",
            ),
        ]
        for active_patch in self.patches:
            active_patch.start()
        self.addCleanup(self._stop_patches)
        self.client = LLMClient()

    def _stop_patches(self):
        for active_patch in reversed(self.patches):
            active_patch.stop()

    @staticmethod
    def make_sdk_response(content):
        response = MagicMock()
        response.choices[0].message.content = content
        return response

    def test_openrouter_provider_is_selected_and_uses_its_key(self):
        self.assertEqual(self.client.provider, "openrouter")
        self.assertTrue(self.client.is_configured())

    @patch("openai.OpenAI")
    def test_openrouter_uses_configured_base_url_for_text_completion(self, openai_client):
        mock_client = openai_client.return_value
        mock_client.chat.completions.create.return_value = self.make_sdk_response("Hello")

        result = self.client.complete("system", "prompt")

        self.assertEqual(result, "Hello")
        openai_client.assert_called_once_with(
            api_key="test-openrouter-key",
            base_url="https://openrouter.example.test/api/v1",
        )
        request = mock_client.chat.completions.create.call_args.kwargs
        self.assertEqual(request["model"], "qwen/qwen3.8-27b:free")
        self.assertNotIn("response_format", request)

    @patch("openai.OpenAI")
    def test_complete_json_without_schema_does_not_force_json_mode(self, openai_client):
        mock_client = openai_client.return_value
        mock_client.chat.completions.create.return_value = self.make_sdk_response('{"ok": true}')

        result = self.client.complete_json("system", "prompt")

        self.assertEqual(result, {"ok": True})
        request = mock_client.chat.completions.create.call_args.kwargs
        self.assertNotIn("response_format", request)
        self.assertNotIn("extra_body", request)

    @patch("openai.OpenAI")
    def test_complete_json_with_schema_sends_strict_json_schema(self, openai_client):
        mock_client = openai_client.return_value
        mock_client.chat.completions.create.return_value = self.make_sdk_response(
            '{"found": true, "answer": "A", "evidence_ids": ["e1"]}'
        )

        result = self.client.complete_json(
            "system",
            "prompt",
            response_schema=DOCUMENT_QA_RESPONSE_SCHEMA,
        )

        self.assertTrue(result["found"])
        request = mock_client.chat.completions.create.call_args.kwargs
        self.assertEqual(
            request["response_format"],
            {
                "type": "json_schema",
                "json_schema": {
                    "name": "document_qa_response",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "found": {"type": "boolean"},
                            "answer": {"type": "string"},
                            "evidence_ids": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                        "required": ["found", "answer", "evidence_ids"],
                        "additionalProperties": False,
                    },
                },
            },
        )
        self.assertEqual(
            request["extra_body"],
            {"provider": {"require_parameters": True}},
        )

    @patch("openai.OpenAI")
    def test_openrouter_forwards_optional_reasoning_configuration(self, openai_client):
        mock_client = openai_client.return_value
        mock_client.chat.completions.create.return_value = self.make_sdk_response('{"ok": true}')

        result = self.client.complete_json(
            "system",
            "prompt",
            reasoning={"effort": "none"},
        )

        self.assertEqual(result, {"ok": True})
        request = mock_client.chat.completions.create.call_args.kwargs
        self.assertEqual(
            request["extra_body"],
            {"reasoning": {"effort": "none"}},
        )

    def test_gemini_schema_types_convert_recursively_to_json_schema(self):
        converted = _to_json_schema(
            {
                "type": "OBJECT",
                "properties": {
                    "enabled": {"type": "BOOLEAN"},
                    "label": {"type": "STRING"},
                    "items": {
                        "type": "ARRAY",
                        "items": {"type": "INTEGER"},
                    },
                },
            }
        )

        self.assertEqual(converted["type"], "object")
        self.assertEqual(converted["properties"]["enabled"]["type"], "boolean")
        self.assertEqual(converted["properties"]["label"]["type"], "string")
        self.assertEqual(converted["properties"]["items"]["type"], "array")
        self.assertEqual(converted["properties"]["items"]["items"]["type"], "integer")
        self.assertIs(converted["additionalProperties"], False)

    @patch("openai.OpenAI")
    def test_document_qa_uses_structured_output_and_backend_page_references(self, openai_client):
        page = SimpleNamespace(page_number=2, text="Applications close on 15 July 2026.")
        document = SimpleNamespace(original_text=page.text, pages=[page])
        response_body = {
            "found": True,
            "answer": "Applications close on 15 July 2026.",
            "evidence_ids": ["e1"],
        }
        mock_client = openai_client.return_value
        mock_client.chat.completions.create.return_value = self.make_sdk_response(
            json.dumps(response_body)
        )
        with patch.object(document_qa.llm_client, "provider", "openrouter"), patch.object(
            document_qa.llm_client, "model", "qwen/qwen3.8-27b:free"
        ):
            result = document_qa.answer_question(document, "When do applications close?")

        self.assertTrue(result.found)
        self.assertEqual(result.references[0].page_number, 2)
        self.assertEqual(result.references[0].excerpt, page.text)
        request = mock_client.chat.completions.create.call_args.kwargs
        schema = request["response_format"]["json_schema"]["schema"]
        self.assertEqual(
            request["response_format"]["type"],
            "json_schema",
        )
        self.assertEqual(
            request["response_format"]["json_schema"]["name"],
            "document_qa_response",
        )
        self.assertTrue(request["response_format"]["json_schema"]["strict"])
        self.assertEqual(
            request["extra_body"]["provider"],
            {"require_parameters": True},
        )
        self.assertNotIn("reasoning", request["extra_body"])
        self.assertEqual(schema["properties"]["found"]["type"], "boolean")
        self.assertEqual(schema["properties"]["evidence_ids"]["items"]["type"], "string")

    @patch("openai.OpenAI")
    def test_openrouter_provider_failure_is_wrapped(self, openai_client):
        openai_client.return_value.chat.completions.create.side_effect = RuntimeError(
            "provider unavailable"
        )

        with self.assertRaisesRegex(LLMError, "OpenRouter request failed"):
            self.client.complete("system", "prompt")

    def test_gemini_provider_selection_and_schema_dispatch_are_unchanged(self):
        with patch.object(settings, "llm_provider", "gemini"), patch.object(
            settings, "llm_model", "existing-gemini-model"
        ), patch.object(settings, "llm_max_tokens", 4000):
            client = LLMClient()
        with patch.object(client, "_gemini", return_value='{"ok": true}') as gemini_call:
            result = client.complete_json(
                "system",
                "prompt",
                response_schema=DOCUMENT_QA_RESPONSE_SCHEMA,
            )

        self.assertEqual(result, {"ok": True})
        gemini_call.assert_called_once_with(
            "system",
            "prompt",
            0.0,
            response_schema=DOCUMENT_QA_RESPONSE_SCHEMA,
        )


if __name__ == "__main__":
    unittest.main()
