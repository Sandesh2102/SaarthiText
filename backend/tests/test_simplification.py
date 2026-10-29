import unittest
from unittest.mock import patch

from app.services import simplification


class SimplificationStructuredOutputTests(unittest.TestCase):
    @patch("app.services.simplification.llm_client.complete_json")
    def test_english_simplification_passes_schema_and_parses_string_fields(self, complete_json):
        complete_json.return_value = {
            "simplified_text": "  Clear text.  ",
            "explanation": "  Shorter words.  ",
        }

        result = simplification.simplify("Complex source text.", "English")

        self.assertEqual(result.simplified_text, "Clear text.")
        self.assertEqual(result.explanation, "Shorter words.")
        self.assertEqual(
            complete_json.call_args.kwargs["response_schema"],
            {
                "type": "OBJECT",
                "properties": {
                    "simplified_text": {"type": "STRING"},
                    "explanation": {"type": "STRING"},
                },
                "required": ["simplified_text", "explanation"],
            },
        )
        self.assertNotIn("reasoning", complete_json.call_args.kwargs)
        prompt = " ".join(
            f"{complete_json.call_args.args[0]} {complete_json.call_args.args[1]}".split()
        ).casefold()
        requirements = (
            "readers with limited literacy",
            "preserve every fact and the source's meaning",
            "replace difficult or administrative words with common, familiar words",
            "Split sentences containing multiple ideas into shorter sentences",
            "generally around 15-20 words",
            "Do not copy a difficult source sentence unchanged",
            "eligibility condition, requirement, exception, warning, qualification",
            "Do not add facts that are not present in the source",
            "The explanation must briefly describe the actual simplification changes made",
        )
        for requirement in requirements:
            with self.subTest(requirement=requirement):
                self.assertIn(requirement.casefold(), prompt)
        self.assertIn(
            '"the information in your application must match the attached documents."',
            prompt,
        )

    @patch("app.services.simplification.llm_client.complete_json")
    def test_non_english_schema_preserves_english_rendering_contract(self, complete_json):
        complete_json.return_value = {
            "simplified_text": "సులభమైన వాక్యం.",
            "simplified_text_en": "A simple sentence.",
            "explanation": "Shorter wording.",
        }

        result = simplification.simplify("Complex source text.", "Telugu")

        self.assertEqual(result.simplified_text, "సులభమైన వాక్యం.")
        self.assertEqual(result.simplified_text_en, "A simple sentence.")
        self.assertEqual(
            complete_json.call_args.kwargs["response_schema"],
            simplification.MULTILINGUAL_SIMPLIFICATION_RESPONSE_SCHEMA,
        )
        self.assertNotIn("reasoning", complete_json.call_args.kwargs)
        prompt = " ".join(
            f"{complete_json.call_args.args[0]} {complete_json.call_args.args[1]}".split()
        ).casefold()
        self.assertIn("write simplified_text naturally and simply in the selected language.", prompt)
        self.assertIn("not a word-for-word translation of", prompt)
        self.assertIn("preserve the same facts and conditions across both outputs.", prompt)

    @patch("app.services.simplification.llm_client.complete_json")
    def test_malformed_structured_output_is_rejected(self, complete_json):
        malformed_responses = [
            [],
            {"simplified_text": 12, "explanation": "A note."},
            {"simplified_text": "A sentence.", "explanation": ["not", "text"]},
        ]
        for malformed in malformed_responses:
            with self.subTest(malformed=malformed):
                complete_json.return_value = malformed
                with self.assertRaises(ValueError):
                    simplification.simplify("Complex source text.", "English")

    @patch("app.services.simplification.llm_client.complete_json")
    def test_empty_simplification_keeps_existing_error(self, complete_json):
        complete_json.return_value = {"simplified_text": "   ", "explanation": "No text."}

        with self.assertRaisesRegex(ValueError, "did not return any simplified text"):
            simplification.simplify("Complex source text.", "English")


if __name__ == "__main__":
    unittest.main()
