"""Important-fact extraction from the original document via the LLM.

Returns a list of structured facts (category, label, value) found in the source.
The model is instructed to extract only facts present in the text — never invent.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import List

from app.services.llm import llm_client

CATEGORIES = [
    "Person", "Organization", "Date", "Deadline", "Amount", "Percentage",
    "Eligibility", "Location", "Requirement", "Contact", "Procedure", "Warning", "Other",
]

SYSTEM_PROMPT = (
    "You extract key factual information from public-information documents. "
    "You only extract facts explicitly present in the text. You never guess or invent."
)


@dataclass
class Fact:
    category: str
    label: str
    value: str


def extract_facts(text: str, max_facts: int = 20) -> List[Fact]:
    prompt = (
        "Extract the most important facts a reader must not miss from the text below.\n"
        f"Allowed categories: {', '.join(CATEGORIES)}.\n"
        "For each fact return an object with keys: \"category\", \"label\", \"value\".\n"
        "- \"label\" is a short name for the fact (e.g. 'Application deadline').\n"
        "- \"value\" is the exact fact as stated in the text (keep numbers/dates/amounts verbatim).\n"
        "Only include facts actually present in the text. Do NOT invent anything.\n"
        f"Return at most {max_facts} facts as a JSON array (no prose).\n\n"
        f"=== TEXT START ===\n{text}\n=== TEXT END ==="
    )
    data = llm_client.complete_json(SYSTEM_PROMPT, prompt)
    if isinstance(data, dict):
        # Model may wrap the list in a key.
        for key in ("facts", "data", "items", "results"):
            if isinstance(data.get(key), list):
                data = data[key]
                break
    if not isinstance(data, list):
        return []

    facts: List[Fact] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        category = str(item.get("category", "Other")).strip() or "Other"
        if category not in CATEGORIES:
            category = "Other"
        label = str(item.get("label", "")).strip()
        value = str(item.get("value", "")).strip()
        if value:
            facts.append(Fact(category=category, label=label or category, value=value))
    return facts[:max_facts]
