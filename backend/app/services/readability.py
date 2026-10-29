"""Readability analysis using the `textstat` library.

All numbers are computed directly from the supplied text — nothing is faked.
The Flesch formulas are calibrated for English, so metrics are most meaningful
for the English source and the English rendering of the simplification.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass

import textstat


@dataclass
class ReadabilityMetrics:
    target: str
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    word_count: int
    sentence_count: int
    avg_sentence_length: float
    avg_word_length: float
    complex_word_count: int
    level: str

    def as_dict(self) -> dict:
        return asdict(self)


def _reading_level(flesch_reading_ease: float) -> str:
    fre = flesch_reading_ease
    if fre >= 80:
        return "Very Easy"
    if fre >= 70:
        return "Easy"
    if fre >= 60:
        return "Fairly Easy"
    if fre >= 50:
        return "Standard"
    if fre >= 30:
        return "Difficult"
    return "Very Difficult"


def analyse(text: str, target: str) -> ReadabilityMetrics:
    text = (text or "").strip()
    if not text:
        return ReadabilityMetrics(target, 0.0, 0.0, 0, 0, 0.0, 0.0, 0, "N/A")

    words = max(textstat.lexicon_count(text, removepunct=True), 0)
    sentences = max(textstat.sentence_count(text), 1)
    syllables = textstat.syllable_count(text)
    complex_words = textstat.difficult_words(text)
    fre = round(textstat.flesch_reading_ease(text), 2)
    fk = round(textstat.flesch_kincaid_grade(text), 2)

    avg_sentence_length = round(words / sentences, 2) if sentences else 0.0
    # Approximate average syllables per word as a proxy for word complexity/length.
    avg_word_length = round(syllables / words, 2) if words else 0.0

    return ReadabilityMetrics(
        target=target,
        flesch_reading_ease=fre,
        flesch_kincaid_grade=fk,
        word_count=words,
        sentence_count=sentences,
        avg_sentence_length=avg_sentence_length,
        avg_word_length=avg_word_length,
        complex_word_count=complex_words,
        level=_reading_level(fre),
    )
