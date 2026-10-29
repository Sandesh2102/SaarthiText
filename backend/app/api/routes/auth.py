"""Authentication & profile routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models import Document, User, VerificationResult
from app.schemas import (
    PasswordReset,
    SUPPORTED_LANGUAGES,
    Token,
    UserCreate,
    UserLogin,
    UserOut,
    UserStats,
    UserUpdate,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _validate_language(language: str) -> str:
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported language. Choose one of: {', '.join(SUPPORTED_LANGUAGES)}.",
        )
    return language


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)):
    _validate_language(payload.preferred_language)
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        preferred_language=payload.preferred_language,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    token = create_access_token(user.id)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/forgot-password")
def forgot_password(payload: PasswordReset, db: Session = Depends(get_db)):
    """Simplified reset flow (no email server): verifies the email exists and sets
    a new password. In production this would send a tokenised reset link."""
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user:
        # Avoid user enumeration in a real system; for this project we respond clearly.
        raise HTTPException(status_code=404, detail="No account found with that email.")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password updated. You can now log in with your new password."}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()
    if payload.preferred_language is not None:
        current_user.preferred_language = _validate_language(payload.preferred_language)
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.get("/me/stats", response_model=UserStats)
def my_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc_count = db.scalar(
        select(func.count(Document.id)).where(Document.owner_id == current_user.id)
    ) or 0
    processed = db.scalar(
        select(func.count(Document.id)).where(
            Document.owner_id == current_user.id,
            Document.status.in_(["verified", "warning"]),
        )
    ) or 0
    verified_facts = db.scalar(
        select(func.count(VerificationResult.id))
        .join(Document, Document.id == VerificationResult.document_id)
        .where(Document.owner_id == current_user.id, VerificationResult.status == "VERIFIED")
    ) or 0
    conflicts = db.scalar(
        select(func.count(VerificationResult.id))
        .join(Document, Document.id == VerificationResult.document_id)
        .where(Document.owner_id == current_user.id, VerificationResult.status == "CONFLICT")
    ) or 0
    return UserStats(
        documents_processed=doc_count,
        simplifications_completed=processed,
        facts_verified=verified_facts,
        conflicts_found=conflicts,
    )
