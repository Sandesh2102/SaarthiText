"""Document and page models."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[str] = mapped_column(String(20), default="text")  # pdf | text
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_text: Mapped[str] = mapped_column(Text, default="")

    # pending | extracting | processing | verified | warning | failed
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True)
    status_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    target_language: Mapped[str] = mapped_column(String(20), default="English")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    owner: Mapped["User"] = relationship(back_populates="documents")
    pages: Mapped[list["DocumentPage"]] = relationship(
        back_populates="document", cascade="all, delete-orphan", order_by="DocumentPage.page_number"
    )
    simplifications: Mapped[list["Simplification"]] = relationship(
        back_populates="document", cascade="all, delete-orphan", order_by="Simplification.id"
    )
    facts: Mapped[list["ExtractedFact"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
    verifications: Mapped[list["VerificationResult"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )
    readability_results: Mapped[list["ReadabilityResult"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentPage(Base):
    __tablename__ = "document_pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, default="")

    document: Mapped["Document"] = relationship(back_populates="pages")
