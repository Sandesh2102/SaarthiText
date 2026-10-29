"""Text simplification via constrained LLM prompting.

The prompt is deliberately strict: the model must preserve every fact (names,
dates, numbers, amounts, eligibility, deadlines, locations, requirements,
warnings) and must never invent information or alter values. It returns the
plain-language version in the user's chosen language plus an English rendering
used for readability scoring and factual verification.
"""
from __future__ import annotations

from dataclasses import dataclass

from app.services.llm import llm_client

SYSTEM_PROMPT = (
        "You are SaarthiText. You rewrite government notices, welfare schemes, "
        "and health or public-service information for readers with limited literacy. "
        "Make difficult information genuinely easier to understand while preserving "
        "every fact and the source's meaning."
)

RULES = """SIMPLIFICATION GOAL — follow these rules:
- Rewrite the source for a reader with limited literacy. Preserve every fact and
    the source's meaning, but do not preserve difficult wording or sentence structure.
- For each sentence that is formal, dense, bureaucratic, or difficult, replace
    difficult or administrative words with common, familiar words where the meaning stays the same.
- Rewrite long or passive constructions in direct, active language where appropriate.
- Split sentences containing multiple ideas into shorter sentences when this improves clarity.
- Prefer short sentences, generally around 15-20 words where practical.
- Do not copy a difficult source sentence unchanged merely to avoid changing it.
- Do not make only cosmetic synonym substitutions when the sentence structure itself is difficult.
- Make the result clearly easier to understand for a reader with limited literacy.
- If a source sentence is already short, clear, and easy to understand, it may remain unchanged
    when rewriting would make it less clear or less accurate.

FACTUAL PRESERVATION — preserve these values exactly as written:
- Names, organizations, numerals, dates, deadlines, amounts, percentages,
    monetary values, locations, contact details, and official identifiers.
- Every eligibility condition, requirement, exception, warning, qualification,
    procedural step, and restriction. Preserve their scope and meaning.
- Do not add facts that are not present in the source.
- Do not remove facts, weaken or broaden eligibility conditions, or change the meaning
    or intent of the source.

MULTILINGUAL OUTPUT:
- Write simplified_text naturally and simply in the selected language.
- For multilingual requests, write simplified_text_en as a clear, simple English
    rendering of the same simplified meaning, not a word-for-word translation of
    difficult source wording.
- Preserve the same facts and conditions across both outputs.

EXAMPLES — these are illustrative only. Apply the principles to the supplied source;
do not copy these examples into unrelated documents.

SOURCE: "Applicants must provide a valid identity document, a current address proof, and a completed application form."
SIMPLIFIED:
"You must provide these documents:
1. Identity proof.
2. Address proof.
3. Completed application form."

SOURCE: "Applications missing required documents may be returned for correction."
SIMPLIFIED: "If required documents are missing, the application may be sent back for correction."

SOURCE: "Information provided in the application must be consistent with the attached documents."
SIMPLIFIED: "The information in your application must match the attached documents."

The explanation must briefly describe the actual simplification changes made. Do not claim
that a change was made if the corresponding change did not occur."""

SIMPLIFICATION_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "simplified_text": {"type": "STRING"},
        "explanation": {"type": "STRING"},
    },
    "required": ["simplified_text", "explanation"],
}

MULTILINGUAL_SIMPLIFICATION_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "simplified_text": {"type": "STRING"},
        "simplified_text_en": {"type": "STRING"},
        "explanation": {"type": "STRING"},
    },
    "required": ["simplified_text", "simplified_text_en", "explanation"],
}


@dataclass
class SimplificationOutput:
    simplified_text: str          # in the target language (what the user reads)
    simplified_text_en: str       # English rendering (for metrics + verification)
    explanation: str              # short note on what was made simpler
    language: str
    model: str


def simplify(text: str, language: str = "English") -> SimplificationOutput:
    language = language or "English"
    is_english = language.strip().lower() == "english"

    if is_english:
        output_instructions = (
            "Return a JSON object with keys:\n"
            '  "simplified_text": the simplified version in clear English,\n'
            '  "explanation": 1-3 short sentences describing what you made simpler '
            "(e.g. shorter sentences, simpler words), without adding facts.\n"
        )
    else:
        output_instructions = (
            f"Return a JSON object with keys:\n"
            f'  "simplified_text": the simplified version written in {language} '
            f"(make it natural and simple; preserve numerals, names and amounts exactly as in the source),\n"
            f'  "simplified_text_en": a clear, simple English rendering of the same simplified meaning, not a word-for-word translation,\n'
            f'  "explanation": 1-3 short sentences in English describing what you made simpler.\n'
        )

    prompt = (
        f"{RULES}\n\n"
        f"Rewrite the following public-information text so it is easy to understand.\n"
        f"Target language for the reader: {language}.\n\n"
        f"{output_instructions}\n"
        f"Respond with ONLY the JSON object.\n\n"
        f"=== SOURCE TEXT START ===\n{text}\n=== SOURCE TEXT END ==="
    )

    response_schema = (
        SIMPLIFICATION_RESPONSE_SCHEMA
        if is_english
        else MULTILINGUAL_SIMPLIFICATION_RESPONSE_SCHEMA
    )
    data = llm_client.complete_json(
        SYSTEM_PROMPT,
        prompt,
        response_schema=response_schema,
    )
    if not isinstance(data, dict):
        raise ValueError("Unexpected simplification response format.")

    simplified_value = data.get("simplified_text")
    explanation_value = data.get("explanation")
    simplified_en_value = data.get("simplified_text_en")
    if simplified_value is None:
        simplified_value = ""
    if explanation_value is None:
        explanation_value = ""
    if simplified_en_value is None:
        simplified_en_value = ""
    if not all(
        isinstance(value, str)
        for value in (simplified_value, explanation_value, simplified_en_value)
    ):
        raise ValueError("The model returned an invalid simplification response.")

    simplified = simplified_value.strip()
    simplified_en = simplified_en_value.strip()
    if is_english or not simplified_en:
        simplified_en = simplified if is_english else (simplified_en or simplified)
    explanation = explanation_value.strip()

    if not simplified:
        raise ValueError("The model did not return any simplified text.")

    return SimplificationOutput(
        simplified_text=simplified,
        simplified_text_en=simplified_en or simplified,
        explanation=explanation,
        language=language,
        model=llm_client.model,
    )
