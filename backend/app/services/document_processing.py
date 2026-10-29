"""PDF document processing using PyMuPDF (fitz).

Validates the uploaded file is a real PDF, extracts text per page, and reports
clearly when a PDF has no extractable text (e.g. a scanned image-only PDF).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List

import fitz  # PyMuPDF


class DocumentProcessingError(Exception):
    """Raised when a document cannot be read or contains no extractable text."""


@dataclass
class ExtractionResult:
    pages: List[str] = field(default_factory=list)
    full_text: str = ""
    page_count: int = 0


def validate_pdf_bytes(data: bytes) -> None:
    """Lightweight validation that the bytes look like a PDF."""
    if not data:
        raise DocumentProcessingError("The uploaded file is empty.")
    if not data[:5].startswith(b"%PDF-"):
        raise DocumentProcessingError("The file does not appear to be a valid PDF.")


def extract_text_from_pdf(data: bytes) -> ExtractionResult:
    """Extract text from PDF bytes. Raises DocumentProcessingError on failure."""
    validate_pdf_bytes(data)
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception as exc:  # noqa: BLE001
        raise DocumentProcessingError("The PDF could not be opened. It may be corrupted.") from exc

    pages: List[str] = []
    try:
        for page in doc:
            pages.append(page.get_text("text").strip())
    finally:
        doc.close()

    full_text = "\n\n".join(p for p in pages if p).strip()
    if not full_text:
        raise DocumentProcessingError(
            "No readable text could be extracted. This PDF may be a scanned image. "
            "Please upload a text-based PDF or paste the text directly."
        )
    return ExtractionResult(pages=pages, full_text=full_text, page_count=len(pages))


def normalise_text(text: str) -> str:
    """Collapse excessive whitespace while preserving paragraph breaks."""
    lines = [ln.strip() for ln in text.splitlines()]
    cleaned: List[str] = []
    blank = False
    for ln in lines:
        if ln:
            cleaned.append(ln)
            blank = False
        elif not blank:
            cleaned.append("")
            blank = True
    return "\n".join(cleaned).strip()
