import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException
from pydantic import ValidationError

from app.api.routes import documents as document_routes
from app.schemas import DocumentQARequest, DocumentQAResponse
from app.services import document_qa
from app.services.llm import LLMClient, LLMError, LLMNotConfiguredError


def make_document(text, pages=()):
    return SimpleNamespace(original_text=text, pages=list(pages))


class DocumentQATests(unittest.TestCase):
    @patch("app.services.document_qa.llm_client.complete_json")
    def test_answer_uses_page_reference_built_from_supplied_evidence(self, complete_json):
        page = SimpleNamespace(page_number=3, text="The application deadline is 30 June 2026.")
        document = make_document(page.text, [page])
        complete_json.return_value = {
            "answer": "The deadline is 30 June 2026.",
            "found": True,
            "evidence_ids": ["e1"],
            "page_number": 999,
            "excerpt": "forged citation",
        }

        response = document_qa.answer_question(document, "What is the application deadline?")

        self.assertTrue(response.found)
        self.assertEqual(response.references[0].page_number, 3)
        self.assertEqual(response.references[0].excerpt, page.text)
        self.assertNotEqual(response.references[0].excerpt, "forged citation")
        self.assertEqual(
            complete_json.call_args.kwargs["response_schema"],
            document_qa.DOCUMENT_QA_RESPONSE_SCHEMA,
        )

    @patch("app.services.document_qa.llm_client.complete_json")
    def test_valid_not_found_response_returns_canonical_not_found(self, complete_json):
        complete_json.return_value = {
            "found": False,
            "answer": "This information was not found in the document.",
            "evidence_ids": [],
        }

        response = document_qa.answer_question(
            make_document("The application deadline is 30 June 2026."),
            "What is the application deadline?",
        )

        self.assertFalse(response.found)
        self.assertEqual(response.answer, document_qa.NOT_FOUND_ANSWER)
        self.assertEqual(response.references, [])

    @patch("app.services.document_qa.llm_client.complete_json")
    def test_malformed_response_shape_raises_llm_error(self, complete_json):
        malformed_responses = [
            ["not", "an", "object"],
            {"found": "true", "answer": "Answer", "evidence_ids": ["e1"]},
            {"found": True, "answer": 42, "evidence_ids": ["e1"]},
            {"found": True, "answer": "Answer", "evidence_ids": "e1"},
            {"found": True, "answer": "Answer", "evidence_ids": [1]},
        ]
        document = make_document("The application deadline is 30 June 2026.")
        for malformed in malformed_responses:
            with self.subTest(malformed=malformed):
                complete_json.return_value = malformed
                with self.assertRaises(LLMError):
                    document_qa.answer_question(document, "What is the application deadline?")

    @patch("app.services.document_qa.llm_client.complete_json")
    def test_unmatched_question_abstains_without_calling_llm(self, complete_json):
        document = make_document("The application deadline is 30 June 2026.")

        response = document_qa.answer_question(document, "What is the capital of France?")

        self.assertFalse(response.found)
        self.assertEqual(response.references, [])
        self.assertEqual(response.answer, document_qa.NOT_FOUND_ANSWER)
        complete_json.assert_not_called()

    @patch("app.services.document_qa.llm_client.complete_json")
    def test_unvalidated_evidence_id_cannot_support_an_answer(self, complete_json):
        text = "The application deadline is 30 June 2026."
        complete_json.return_value = {
            "answer": "The deadline is 30 June 2026.",
            "found": True,
            "evidence_ids": ["not-supplied"],
        }

        response = document_qa.answer_question(make_document(text), "What is the deadline?")

        self.assertFalse(response.found)
        self.assertEqual(response.references, [])
        self.assertEqual(response.answer, document_qa.NOT_FOUND_ANSWER)

    @patch("app.services.document_qa.llm_client.complete_json")
    def test_evidence_sent_to_llm_is_bounded(self, complete_json):
        text = "\n\n".join(
            f"The scholarship deadline is 30 June 2026. Additional details {index}. "
            + ("irrelevant text " * 80)
            for index in range(30)
        )
        complete_json.return_value = {"answer": "Not found.", "found": False, "evidence_ids": []}

        document_qa.answer_question(make_document(text), "What is the scholarship deadline?")

        prompt = complete_json.call_args.args[1]
        context = prompt.split("Evidence JSON:\n", 1)[1].split("\n\nQuestion", 1)[0]
        self.assertLessEqual(len(context), document_qa.MAX_CONTEXT_CHARS)

    def test_page_records_are_used_only_when_they_match_original_text(self):
        page = SimpleNamespace(page_number=1, text="Page text differs from source.")
        document = make_document("The authoritative original text.", [page])

        segments = document_qa._document_segments(document)

        self.assertEqual(segments[0].source, "document")
        self.assertIsNone(segments[0].page_number)
        self.assertEqual(segments[0].text, document.original_text)

    def test_question_schema_rejects_blank_and_overlong_input(self):
        with self.assertRaises(ValidationError):
            DocumentQARequest(question="   ")
        with self.assertRaises(ValidationError):
            DocumentQARequest(question="x" * 1001)
        self.assertEqual(DocumentQARequest(question="  deadline?  ").question, "deadline?")

    @patch("app.api.routes.documents.document_qa.answer_question")
    def test_route_rejects_another_users_document_before_answering(self, answer_question):
        document = SimpleNamespace(owner_id=10)
        db = SimpleNamespace(get=lambda model, document_id: document)

        with self.assertRaises(HTTPException) as raised:
            document_routes.ask_document(
                4,
                DocumentQARequest(question="What is the deadline?"),
                SimpleNamespace(id=11),
                db,
            )

        self.assertEqual(raised.exception.status_code, 404)
        answer_question.assert_not_called()

    @patch("app.api.routes.documents.document_qa.answer_question")
    def test_route_maps_missing_llm_configuration_to_503(self, answer_question):
        document = SimpleNamespace(owner_id=10)
        db = SimpleNamespace(get=lambda model, document_id: document)
        answer_question.side_effect = LLMNotConfiguredError("No provider key")

        with self.assertRaises(HTTPException) as raised:
            document_routes.ask_document(
                4,
                DocumentQARequest(question="What is the deadline?"),
                SimpleNamespace(id=10),
                db,
            )

        self.assertEqual(raised.exception.status_code, 503)

    @patch("app.api.routes.documents.document_qa.answer_question")
    def test_route_maps_provider_failure_to_502(self, answer_question):
        document = SimpleNamespace(owner_id=10)
        db = SimpleNamespace(get=lambda model, document_id: document)
        answer_question.side_effect = LLMError("Provider unavailable")

        with self.assertRaises(HTTPException) as raised:
            document_routes.ask_document(
                4,
                DocumentQARequest(question="What is the deadline?"),
                SimpleNamespace(id=10),
                db,
            )

        self.assertEqual(raised.exception.status_code, 502)

    @patch("app.api.routes.documents.document_qa.answer_question")
    def test_owner_can_ask_without_running_analysis(self, answer_question):
        document = SimpleNamespace(owner_id=10, status="pending")
        db = SimpleNamespace(get=lambda model, document_id: document)
        expected = DocumentQAResponse(answer="Deadline is 30 June.", found=True, references=[])
        answer_question.return_value = expected

        response = document_routes.ask_document(
            4,
            DocumentQARequest(question="What is the deadline?"),
            SimpleNamespace(id=10),
            db,
        )

        self.assertIs(response, expected)
        answer_question.assert_called_once_with(document, "What is the deadline?")

    def test_gemini_structured_json_configuration_is_opt_in(self):
        from unittest.mock import MagicMock

        with patch("google.generativeai.configure") as configure, patch(
            "google.generativeai.GenerativeModel"
        ) as model_factory:
            model = MagicMock()
            model.generate_content.return_value.text = "{}"
            model_factory.return_value = model
            client = LLMClient()

            client._gemini(
                "system",
                "prompt",
                0.0,
                response_schema=document_qa.DOCUMENT_QA_RESPONSE_SCHEMA,
            )
            structured_config = model.generate_content.call_args.kwargs["generation_config"]
            self.assertEqual(structured_config["response_mime_type"], "application/json")
            self.assertEqual(
                structured_config["response_schema"],
                document_qa.DOCUMENT_QA_RESPONSE_SCHEMA,
            )

            model.generate_content.reset_mock()
            client._gemini("system", "prompt", 0.2)
            default_config = model.generate_content.call_args.kwargs["generation_config"]
            self.assertEqual(
                default_config,
                {"temperature": 0.2, "max_output_tokens": client.max_tokens},
            )
            configure.assert_called()

    def test_gemini_provider_failure_is_wrapped_as_llm_error(self):
        from unittest.mock import MagicMock

        with patch("google.generativeai.configure"), patch(
            "google.generativeai.GenerativeModel"
        ) as model_factory:
            model = MagicMock()
            model.generate_content.side_effect = RuntimeError("provider unavailable")
            model_factory.return_value = model

            with self.assertRaisesRegex(LLMError, "Gemini request failed"):
                LLMClient()._gemini("system", "prompt", 0.0)


if __name__ == "__main__":
    unittest.main()
