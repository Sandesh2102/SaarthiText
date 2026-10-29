"""Full analysis pipeline orchestration.

Runs: simplification -> fact extraction -> factual verification -> readability,
persists every result, and sets the document status. Nothing is fabricated: if
the LLM is not configured or fails, the document is marked ``failed`` with a
clear message and the error is raised to the caller.
"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import (
    Document,
    ExtractedFact,
    ReadabilityResult,
    Simplification,
    VerificationResult,
)
from app.services import fact_extraction, readability, simplification, verification
from app.services.llm import LLMError, LLMNotConfiguredError


class PipelineError(Exception):
    def __init__(self, message: str, *, configured: bool = True):
        super().__init__(message)
        self.configured = configured


def _clear_previous(db: Session, document: Document) -> None:
    for collection in (
        document.simplifications,
        document.facts,
        document.verifications,
        document.readability_results,
    ):
        for row in list(collection):
            db.delete(row)
    db.flush()


def run_pipeline(db: Session, document: Document, language: str) -> Document:
    document.status = "processing"
    document.status_message = "Analysing document…"
    document.target_language = language
    db.commit()

    try:
        text = document.original_text or ""
        if not text.strip():
            raise PipelineError("The document has no text to analyse.")

        # 1. Simplify (constrained prompting, preserves facts)
        simp = simplification.simplify(text, language)

        # 2. Extract important facts from the original
        facts = fact_extraction.extract_facts(text)

        # 3. Verify facts against the simplified (English) rendering
        verifications = verification.verify(facts, simp.simplified_text_en)

        # 4. Readability — original vs simplified (English rendering for comparability)
        read_original = readability.analyse(text, "original")
        read_simplified = readability.analyse(simp.simplified_text_en, "simplified")

    except LLMNotConfiguredError as exc:
        document.status = "failed"
        document.status_message = str(exc)
        db.commit()
        raise PipelineError(str(exc), configured=False) from exc
    except (LLMError, PipelineError, ValueError) as exc:
        document.status = "failed"
        document.status_message = str(exc)
        db.commit()
        raise PipelineError(str(exc)) from exc

    # Persist results (replace any previous run)
    _clear_previous(db, document)

    db.add(Simplification(
        document_id=document.id,
        language=simp.language,
        simplified_text=simp.simplified_text,
        explanation=simp.explanation,
        model=simp.model,
    ))
    for f in facts:
        db.add(ExtractedFact(
            document_id=document.id, category=f.category, label=f.label, value=f.value,
        ))
    for v in verifications:
        db.add(VerificationResult(
            document_id=document.id, category=v.category, label=v.label,
            original_value=v.original_value, simplified_value=v.simplified_value,
            status=v.status, explanation=v.explanation,
        ))
    for r in (read_original, read_simplified):
        db.add(ReadabilityResult(document_id=document.id, **r.as_dict()))

    summary = verification.summarise(verifications)
    if summary["conflict"] > 0:
        document.status = "warning"
        document.status_message = f"{summary['conflict']} fact(s) may conflict with the original."
    elif summary["not_found"] > 0:
        document.status = "warning"
        document.status_message = f"{summary['not_found']} fact(s) were not found in the simplified text."
    else:
        document.status = "verified"
        document.status_message = "All key facts were preserved."

    db.commit()
    db.refresh(document)
    return document
