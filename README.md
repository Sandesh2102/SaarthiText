# SaarthiText

**An AI-powered platform for simplifying and factually verifying public information.**

SaarthiText takes complex government, health and welfare documents (PDF or pasted text) and
rewrites them into clear, low-literacy-friendly language in the reader's preferred Indian
language — while checking that the important facts (names, dates, amounts, eligibility,
deadlines, …) are preserved, and measuring how much easier the result is to read.

It is built around four academic objectives:

1. **LLM-based text simplification** using constrained prompting that preserves meaning.
2. **Factual-consistency checking** between the original and the simplified text.
3. **Readability evaluation** with Flesch Reading Ease and Flesch–Kincaid Grade Level (`textstat`).
4. **PDF support** for real government/health-scheme documents.

> Reference: Xu et al., *"Problems in Current Text Simplification Research: New Data Can Help,"* TACL 2015.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3, React Router, Axios |
| Backend | Python + FastAPI, SQLAlchemy 2 |
| Database | SQLite by default (zero setup); PostgreSQL-ready via `DATABASE_URL` |
| PDF extraction | PyMuPDF (`fitz`) |
| Readability | `textstat` |
| LLM | Configurable provider (Anthropic Claude by default; OpenAI / OpenAI-compatible / Gemini) |
| Reports | ReportLab (PDF) |

The frontend and backend communicate only through documented REST endpoints under `/api`.

---

## Getting started

You need **Python 3.10+** and **Node.js 18+** installed. Run the backend and frontend in two
separate terminals.

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Configure environment
copy .env.example .env        # Windows   (use: cp .env.example .env  on macOS/Linux)
# Then edit .env and set, at minimum:
#   SECRET_KEY           -> a long random string
#   ANTHROPIC_API_KEY    -> your API key (or configure another provider)

uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000` (interactive docs at `http://localhost:8000/docs`).
The SQLite database and tables are created automatically on first run.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies all `/api` requests to the backend on port 8000,
so no extra configuration is needed for local development.

---

## Configuring the LLM

Simplification, fact extraction and factual verification require an LLM API key. **No AI
output is ever faked** — if a key is not configured, the app clearly tells you so, and
uploading / text-extraction / readability still work.

Set these in `backend/.env`:

```
LLM_PROVIDER=anthropic
LLM_MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_API_KEY=sk-ant-...
```

Other providers are supported by changing `LLM_PROVIDER` to `openai`, `openai_compatible`
(set `OPENAI_BASE_URL`) or `gemini` (set `GOOGLE_API_KEY`), and adjusting `LLM_MODEL`.

---

## How it works (pipeline)

```
Upload PDF / paste text
      ↓  validate + extract (PyMuPDF)
Original text stored
      ↓  constrained LLM prompt
Simplified text (+ English rendering for metrics)
      ↓  LLM fact extraction
Important facts (names, dates, amounts, eligibility, deadlines …)
      ↓  LLM verification of each fact against the simplified text
Status per fact: VERIFIED / PARTIALLY_VERIFIED / CONFLICT / NOT_FOUND  → preservation score
      ↓  textstat
Readability (Flesch Reading Ease, FK Grade, word/sentence counts …) original vs simplified
      ↓
Results in the Document Viewer + downloadable PDF report
```

For non-English output, the simplifier also returns an English rendering so that readability
formulas (calibrated for English) and factual verification remain meaningful.

---

## API overview

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/signup`, `/api/auth/login` | Account + JWT token |
| `GET/PATCH` | `/api/auth/me` | Current user / update profile |
| `GET` | `/api/auth/me/stats` | Activity statistics |
| `POST` | `/api/documents/text` | Create a document from pasted text |
| `POST` | `/api/documents/upload` | Upload & validate a PDF, extract text |
| `POST` | `/api/documents/{id}/process` | Run the full analysis pipeline |
| `GET` | `/api/documents` | List (search / filter / sort) |
| `GET/DELETE` | `/api/documents/{id}` | Fetch detail / delete |
| `GET` | `/api/documents/{id}/report` | Download the PDF report |
| `GET` | `/api/meta` | Supported languages, LLM status, upload limit |

---

## Accessibility & responsiveness

The interface targets low-literacy readers: high-contrast colours, large readable type,
clear navigation, keyboard focus rings, ARIA labelling, a browser-based **read-aloud**
feature (Web Speech API) for every simplified text, and native-script rendering (Noto Sans)
for all supported Indian languages. Layouts are responsive across desktop, tablet and mobile.

Supported languages: English, Telugu, Hindi, Tamil, Kannada, Malayalam, Marathi, Bengali.

---

## Notes & limitations

- **PDFs must contain extractable text.** Scanned/image-only PDFs are detected and rejected
  with a clear message (OCR is out of scope).
- **PDF reports** render Latin text reliably; for non-English scripts the on-screen text and
  read-aloud feature are the most faithful output.
- Authentication is intentionally lightweight (JWT) — there are no payments, social features
  or complex admin systems, by design.


## Project structure

```
SaarthiText/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # auth + documents endpoints
│   │   ├── core/            # security (JWT, password hashing)
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── services/        # llm, pdf, simplification, facts, verification, readability, reporting, pipeline
│   │   ├── config.py        # env-based settings
│   │   ├── database.py      # engine/session/init
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/             # axios client + API wrappers
    │   ├── components/      # ui / layout / viewer components
    │   ├── context/         # Auth + Toast providers
    │   ├── pages/           # Landing, Login, Dashboard, Upload, Documents, DocumentViewer, Profile …
    │   └── utils/
    ├── package.json
    └── .env.example
```

---
