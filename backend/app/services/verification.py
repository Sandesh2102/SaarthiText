"""Factual verification: compare extracted facts against the simplified text.

For every important fact found in the ORIGINAL document, the model checks how it
is represented in the SIMPLIFIED text and assigns one of four statuses. This is
computed from the actual original and simplified text, not hardcoded.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

from app.services.fact_extraction import Fact
from app.services.llm import llm_client

VALID_STATUSES = {"VERIFIED", "PARTIALLY_VERIFIED", "CONFLICT", "NOT_FOUND"}

SYSTEM_PROMPT = (
    "You are a meticulous fact-checker. You compare facts from an original public "
    "document against a simplified version and judge whether each fact was faithfully "
    "preserved. You prioritise factual preservation over simplification. You are strict: "
    "if a number, date, amount or eligibility condition changed or disappeared, you flag it."
)


@dataclass
class Verification:
    category: str
    label: str
    original_value: str
    simplified_value: str
    status: str
    explanation: str


def verify(facts: List[Fact], simplified_text_en: str) -> List[Verification]:
    if not facts:
        return []

    fact_lines = [
        {"id": i, "category": f.category, "label": f.label, "original_value": f.value}
        for i, f in enumerate(facts)
    ]

    prompt = (
        "Here are important facts extracted from the ORIGINAL document (JSON array):\n"
        f"{fact_lines}\n\n"
        "Here is the SIMPLIFIED version of the document:\n"
        f"=== SIMPLIFIED TEXT START ===\n{simplified_text_en}\n=== SIMPLIFIED TEXT END ===\n\n"
        "For EACH fact, decide how it appears in the simplified text and assign a status:\n"
        "- VERIFIED: the fact is present and fully consistent (same value/meaning).\n"
        "- PARTIALLY_VERIFIED: present but less specific or slightly incomplete.\n"
        "- CONFLICT: present but the value or meaning was changed/contradicted.\n"
        "- NOT_FOUND: the fact is missing from the simplified text.\n\n"
        "Return a JSON array; one object per fact with keys: \"id\" (matching the input id), "
        "\"status\", \"simplified_value\" (how it appears in the simplified text, or empty "
        "string if missing), and \"explanation\" (one short sentence). Return ONLY JSON."
    )

    data = llm_client.complete_json(SYSTEM_PROMPT, prompt)
    if isinstance(data, dict):
        for key in ("results", "verifications", "data", "items"):
            if isinstance(data.get(key), list):
                data = data[key]
                break
    if not isinstance(data, list):
        data = []

    by_id = {}
    for item in data:
        if isinstance(item, dict) and "id" in item:
            try:
                by_id[int(item["id"])] = item
            except (ValueError, TypeError):
                continue

    results: List[Verification] = []
    for i, f in enumerate(facts):
        item = by_id.get(i, {})
        status = str(item.get("status", "NOT_FOUND")).strip().upper().replace(" ", "_")
        if status not in VALID_STATUSES:
            status = "NOT_FOUND"
        results.append(
            Verification(
                category=f.category,
                label=f.label,
                original_value=f.value,
                simplified_value=str(item.get("simplified_value", "")).strip(),
                status=status,
                explanation=str(item.get("explanation", "")).strip(),
            )
        )
    return results


def summarise(verifications: List[Verification]) -> dict:
    total = len(verifications)
    counts = {"VERIFIED": 0, "PARTIALLY_VERIFIED": 0, "CONFLICT": 0, "NOT_FOUND": 0}
    for v in verifications:
        counts[v.status] = counts.get(v.status, 0) + 1
    score = 0.0
    if total:
        score = round(
            (counts["VERIFIED"] + 0.5 * counts["PARTIALLY_VERIFIED"]) / total * 100, 1
        )
    return {
        "verified": counts["VERIFIED"],
        "partially_verified": counts["PARTIALLY_VERIFIED"],
        "conflict": counts["CONFLICT"],
        "not_found": counts["NOT_FOUND"],
        "total": total,
        "score": score,
    }
