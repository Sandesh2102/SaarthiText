"""Document ingestion, processing, retrieval and reporting routes."""
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import settings
from app.database import get_db
from app.models import Document, DocumentPage, User
from app.schemas import (
    DocumentDetail,
    DocumentQARequest,
    DocumentQAResponse,
    DocumentSummary,
    FactOut,
    ProcessRequest,
    ReadabilityOut,
    SUPPORTED_LANGUAGES,
    SimplificationOut,
    TextInput,
    VerificationOut,
    VerificationSummary,
)
from app.services import document_qa, reporting, verification as verification_service
from app.services.document_processing import DocumentProcessingError, extract_text_from_pdf, normalise_text
from app.services.llm import LLMError, LLMNotConfiguredError
from app.services.pipeline import PipelineError, run_pipeline

router = APIRouter(prefix="/documents", tags=["documents"])

MAX_TEXT_CHARS = 50_000


def _owned_document(doc_id: int, user: User, db: Session) -> Document:
    doc = db.get(Document, doc_id)
    if not doc or doc.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


def _serialize_detail(doc: Document) -> DocumentDetail:
    simp = doc.simplifications[-1] if doc.simplifications else None
    verifications = [VerificationOut.model_validate(v) for v in doc.verifications]
    summary = None
    if verifications:
        from app.services.verification import Verification as V

        raw = [
            V(v.category, v.label, v.original_value, v.simplified_value, v.status, v.explanation)
            for v in doc.verifications
        ]
        summary = VerificationSummary(**verification_service.summarise(raw))
    return DocumentDetail(
        id=doc.id,
        title=doc.title,
        source_type=doc.source_type,
        original_filename=doc.original_filename,
        status=doc.status,
        status_message=doc.status_message,
        target_language=doc.target_language,
        original_text=doc.original_text,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        simplification=SimplificationOut.model_validate(simp) if simp else None,
        facts=[FactOut.model_validate(f) for f in doc.facts],
        verifications=verifications,
        readability=[ReadabilityOut.model_validate(r) for r in doc.readability_results],
        verification_summary=summary,
    )


def _validate_language(language: str) -> str:
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported language. Choose one of: {', '.join(SUPPORTED_LANGUAGES)}.",
        )
    return language


@router.post("/text", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
def create_from_text(
    payload: TextInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    text = normalise_text(payload.text)
    if len(text) < 20:
        raise HTTPException(status_code=422, detail="Please provide at least a few sentences of text.")
    if len(text) > MAX_TEXT_CHARS:
        raise HTTPException(status_code=422, detail=f"Text is too long (max {MAX_TEXT_CHARS} characters).")
    doc = Document(
        owner_id=current_user.id,
        title=payload.title.strip()[:255],
        source_type="text",
        original_text=text,
        status="pending",
        target_language=current_user.preferred_language,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _serialize_detail(doc)


@router.post("/upload", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filename = (file.filename or "document.pdf").strip()
    if not filename.lower().endswith(".pdf") or (file.content_type and "pdf" not in file.content_type):
        raise HTTPException(status_code=422, detail="Only PDF files are supported.")

    data = await file.read()
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File is too large. Maximum size is {settings.max_upload_mb} MB.",
        )

    try:
        extraction = extract_text_from_pdf(data)
    except DocumentProcessingError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    title = filename.rsplit(".", 1)[0][:255] or "Uploaded document"
    doc = Document(
        owner_id=current_user.id,
        title=title,
        source_type="pdf",
        original_filename=filename[:255],
        original_text=normalise_text(extraction.full_text),
        status="pending",
        target_language=current_user.preferred_language,
    )
    db.add(doc)
    db.flush()
    for idx, page_text in enumerate(extraction.pages, start=1):
        db.add(DocumentPage(document_id=doc.id, page_number=idx, text=page_text))
    db.commit()
    db.refresh(doc)
    return _serialize_detail(doc)


@router.post("/{doc_id}/process", response_model=DocumentDetail)
def process_document(
    doc_id: int,
    payload: ProcessRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    language = _validate_language(payload.language)
    doc = _owned_document(doc_id, current_user, db)
    try:
        run_pipeline(db, doc, language)
    except PipelineError as exc:
        code = 503 if not exc.configured else 502
        raise HTTPException(status_code=code, detail=str(exc)) from exc
    db.refresh(doc)
    return _serialize_detail(doc)


@router.post("/{doc_id}/ask", response_model=DocumentQAResponse)
def ask_document(
    doc_id: int,
    payload: DocumentQARequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = _owned_document(doc_id, current_user, db)
    try:
        return document_qa.answer_question(doc, payload.question)
    except LLMNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("", response_model=List[DocumentSummary])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: Optional[str] = Query(default=None),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    sort: str = Query(default="newest"),
):
    stmt = select(Document).where(Document.owner_id == current_user.id)
    if search:
        stmt = stmt.where(Document.title.ilike(f"%{search.strip()}%"))
    if status_filter:
        stmt = stmt.where(Document.status == status_filter)
    if sort == "oldest":
        stmt = stmt.order_by(Document.created_at.asc())
    elif sort == "title":
        stmt = stmt.order_by(Document.title.asc())
    else:
        stmt = stmt.order_by(Document.created_at.desc())
    docs = db.scalars(stmt).all()
    return [DocumentSummary.model_validate(d) for d in docs]


@router.get("/{doc_id}", response_model=DocumentDetail)
def get_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _serialize_detail(_owned_document(doc_id, current_user, db))


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = _owned_document(doc_id, current_user, db)
    db.delete(doc)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{doc_id}/report")
def download_report(
    doc_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = _owned_document(doc_id, current_user, db)
    if not doc.simplifications:
        raise HTTPException(status_code=409, detail="This document has not been analysed yet.")
    from app.services.verification import Verification as V

    raw = [
        V(v.category, v.label, v.original_value, v.simplified_value, v.status, v.explanation)
        for v in doc.verifications
    ]
    summary = verification_service.summarise(raw)
    pdf_bytes = reporting.build_report_pdf(doc, summary)
    safe_title = "".join(c for c in doc.title if c.isalnum() or c in " -_").strip() or "report"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="SaarthiText-{safe_title}.pdf"'},
    )
