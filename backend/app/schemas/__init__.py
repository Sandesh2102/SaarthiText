"""Pydantic schemas (request/response models)."""
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

SUPPORTED_LANGUAGES = [
    "English", "Telugu", "Hindi", "Tamil", "Kannada",
    "Malayalam", "Marathi", "Bengali",
]


# ---------- Auth / User ----------
class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    preferred_language: str = "English"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    preferred_language: Optional[str] = None


class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=6, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    preferred_language: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class UserStats(BaseModel):
    documents_processed: int
    simplifications_completed: int
    facts_verified: int
    conflicts_found: int


# ---------- Documents ----------
class TextInput(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    text: str = Field(min_length=1)


class ProcessRequest(BaseModel):
    language: str = "English"


class DocumentQARequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Question cannot be empty.")
        return value


class DocumentQAReference(BaseModel):
    source: Literal["page", "document"]
    page_number: Optional[int] = None
    excerpt: str


class DocumentQAResponse(BaseModel):
    answer: str
    found: bool
    references: List[DocumentQAReference] = Field(default_factory=list)


class DocumentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    source_type: str
    status: str
    target_language: str
    created_at: datetime
    updated_at: datetime


# ---------- Analysis ----------
class FactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: str
    label: str
    value: str


class VerificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    category: str
    label: str
    original_value: str
    simplified_value: str
    status: str
    explanation: str


class ReadabilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    target: str
    flesch_reading_ease: float
    flesch_kincaid_grade: float
    word_count: int
    sentence_count: int
    avg_sentence_length: float
    avg_word_length: float
    complex_word_count: int
    level: str


class SimplificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    language: str
    simplified_text: str
    explanation: str
    model: str
    created_at: datetime


class VerificationSummary(BaseModel):
    verified: int
    partially_verified: int
    conflict: int
    not_found: int
    total: int
    score: float  # 0-100 preservation score


class DocumentDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    source_type: str
    original_filename: Optional[str]
    status: str
    status_message: Optional[str]
    target_language: str
    original_text: str
    created_at: datetime
    updated_at: datetime
    simplification: Optional[SimplificationOut] = None
    facts: List[FactOut] = []
    verifications: List[VerificationOut] = []
    readability: List[ReadabilityOut] = []
    verification_summary: Optional[VerificationSummary] = None

class ActionGuideStep(BaseModel):
    title: str
    instruction: str
    references: List[DocumentQAReference] = Field(default_factory=list)


class ActionGuideResponse(BaseModel):
    summary: str
    steps: List[ActionGuideStep] = Field(default_factory=list)