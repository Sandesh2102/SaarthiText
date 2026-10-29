"""SaarthiText FastAPI application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, documents
from app.config import settings
from app.database import init_db
from app.schemas import SUPPORTED_LANGUAGES
from app.services.llm import llm_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="SaarthiText API",
    description="Simplification and factual verification of public information.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")


@app.get("/api/health", tags=["meta"])
def health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "environment": settings.environment,
    }


@app.get("/api/meta", tags=["meta"])
def meta():
    """Public configuration the frontend needs: supported languages and whether
    the LLM is configured (so the UI can warn honestly instead of failing silently)."""
    return {
        "languages": SUPPORTED_LANGUAGES,
        "llm_provider": llm_client.provider,
        "llm_configured": llm_client.is_configured(),
        "max_upload_mb": settings.max_upload_mb,
    }
