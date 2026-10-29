"""Analysis result models: simplification, facts, verification, readability."""
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Simplification(Base):
    __tablename__ = "simplifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    language: Mapped[str] = mapped_column(String(20), default="English")
    simplified_text: Mapped[str] = mapped_column(Text, default="")
    explanation: Mapped[str] = mapped_column(Text, default="")
    model: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped["Document"] = relationship(back_populates="simplifications")


class ExtractedFact(Base):
    __tablename__ = "extracted_facts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String(60), default="Other")  # Date, Amount, Eligibility...
    label: Mapped[str] = mapped_column(String(255), default="")
    value: Mapped[str] = mapped_column(Text, default="")

    document: Mapped["Document"] = relationship(back_populates="facts")


class VerificationResult(Base):
    __tablename__ = "verification_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String(60), default="Other")
    label: Mapped[str] = mapped_column(String(255), default="")
    original_value: Mapped[str] = mapped_column(Text, default="")
    simplified_value: Mapped[str] = mapped_column(Text, default="")
    # VERIFIED | PARTIALLY_VERIFIED | CONFLICT | NOT_FOUND
    status: Mapped[str] = mapped_column(String(30), default="NOT_FOUND")
    explanation: Mapped[str] = mapped_column(Text, default="")

    document: Mapped["Document"] = relationship(back_populates="verifications")


class ReadabilityResult(Base):
    __tablename__ = "readability_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    target: Mapped[str] = mapped_column(String(20), default="original")  # original | simplified
    flesch_reading_ease: Mapped[float] = mapped_column(Float, default=0.0)
    flesch_kincaid_grade: Mapped[float] = mapped_column(Float, default=0.0)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    sentence_count: Mapped[int] = mapped_column(Integer, default=0)
    avg_sentence_length: Mapped[float] = mapped_column(Float, default=0.0)
    avg_word_length: Mapped[float] = mapped_column(Float, default=0.0)
    complex_word_count: Mapped[int] = mapped_column(Integer, default=0)
    level: Mapped[str] = mapped_column(String(40), default="")

    document: Mapped["Document"] = relationship(back_populates="readability_results")
