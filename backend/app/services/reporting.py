"""PDF report generation using ReportLab.

Produces a clean, printable report summarising the simplification, extracted
facts, factual-verification results and readability analysis for a document.
Falls back gracefully across fonts; browser-based print (frontend) is available
for scripts not covered by the bundled PDF font.
"""
from __future__ import annotations

import io
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

BRAND = colors.HexColor("#1d4ed8")
INK = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#475569")

STATUS_COLORS = {
    "VERIFIED": colors.HexColor("#047857"),
    "PARTIALLY_VERIFIED": colors.HexColor("#b45309"),
    "CONFLICT": colors.HexColor("#b91c1c"),
    "NOT_FOUND": colors.HexColor("#6b7280"),
}

_FONT = "Helvetica"
_FONT_BOLD = "Helvetica-Bold"


def _register_unicode_font() -> None:
    """Use a broader-coverage TTF if available (Latin/European scripts)."""
    global _FONT, _FONT_BOLD
    candidates = [
        ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
         "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    for regular, bold in candidates:
        if os.path.exists(regular) and os.path.exists(bold):
            try:
                pdfmetrics.registerFont(TTFont("Body", regular))
                pdfmetrics.registerFont(TTFont("Body-Bold", bold))
                _FONT, _FONT_BOLD = "Body", "Body-Bold"
            except Exception:  # noqa: BLE001
                pass
            return


_register_unicode_font()


def _styles():
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle("t", parent=base["Title"], fontName=_FONT_BOLD,
                                 textColor=INK, fontSize=20, spaceAfter=4),
        "sub": ParagraphStyle("s", fontName=_FONT, textColor=MUTED, fontSize=10,
                              spaceAfter=12),
        "h2": ParagraphStyle("h2", fontName=_FONT_BOLD, textColor=BRAND, fontSize=13,
                             spaceBefore=14, spaceAfter=6),
        "body": ParagraphStyle("b", fontName=_FONT, textColor=INK, fontSize=10,
                               leading=15, alignment=TA_LEFT, spaceAfter=6),
        "small": ParagraphStyle("sm", fontName=_FONT, textColor=MUTED, fontSize=9,
                                leading=13),
    }
    return styles


def _p(text, style):
    safe = (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(safe, style)


def build_report_pdf(document, verification_summary: dict) -> bytes:
    s = _styles()
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4, title=f"SaarthiText Report - {document.title}",
        leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm, bottomMargin=16 * mm,
    )
    story = []

    story.append(_p("SaarthiText — Understanding Report", s["title"]))
    created = document.created_at.strftime("%d %b %Y") if document.created_at else datetime.now().strftime("%d %b %Y")
    story.append(_p(f"{document.title}  •  Language: {document.target_language}  •  {created}", s["sub"]))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#e2e8f0")))

    # Verification summary band
    story.append(_p("Factual Verification Summary", s["h2"]))
    vs = verification_summary or {}
    summary_data = [[
        _p(f"<b>{vs.get('score', 0)}%</b><br/>Preservation", s["small"]),
        _p(f"<b>{vs.get('verified', 0)}</b><br/>Verified", s["small"]),
        _p(f"<b>{vs.get('partially_verified', 0)}</b><br/>Partial", s["small"]),
        _p(f"<b>{vs.get('conflict', 0)}</b><br/>Conflict", s["small"]),
        _p(f"<b>{vs.get('not_found', 0)}</b><br/>Not found", s["small"]),
    ]]
    t = Table(summary_data, colWidths=[34 * mm] * 5)
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t)

    # Simplified text
    simp = document.simplifications[-1] if document.simplifications else None
    story.append(_p("Simplified Explanation", s["h2"]))
    story.append(_p(simp.simplified_text if simp else "Not available.", s["body"]))
    if simp and simp.explanation:
        story.append(_p(f"<i>What changed: {simp.explanation}</i>", s["small"]))

    # Facts
    if document.facts:
        story.append(_p("Important Facts", s["h2"]))
        rows = [[_p("<b>Category</b>", s["small"]), _p("<b>Fact</b>", s["small"]),
                 _p("<b>Value</b>", s["small"])]]
        for f in document.facts:
            rows.append([_p(f.category, s["small"]), _p(f.label, s["small"]), _p(f.value, s["small"])])
        ft = Table(rows, colWidths=[28 * mm, 50 * mm, 90 * mm], repeatRows=1)
        ft.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(ft)

    # Verification details
    if document.verifications:
        story.append(_p("Verification Details", s["h2"]))
        rows = [[_p("<b>Fact</b>", s["small"]), _p("<b>Original</b>", s["small"]),
                 _p("<b>Simplified</b>", s["small"]), _p("<b>Status</b>", s["small"])]]
        for v in document.verifications:
            color = STATUS_COLORS.get(v.status, MUTED)
            status_para = Paragraph(
                f'<font color="{color.hexval()[2:]}"><b>{v.status.replace("_", " ")}</b></font>',
                s["small"],
            )
            rows.append([_p(v.label, s["small"]), _p(v.original_value, s["small"]),
                         _p(v.simplified_value or "—", s["small"]), status_para])
        vt = Table(rows, colWidths=[40 * mm, 48 * mm, 48 * mm, 28 * mm], repeatRows=1)
        vt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(vt)

    # Readability
    if document.readability_results:
        story.append(_p("Readability Analysis", s["h2"]))
        rows = [[_p("<b>Version</b>", s["small"]), _p("<b>Reading Ease</b>", s["small"]),
                 _p("<b>Grade Level</b>", s["small"]), _p("<b>Avg Sentence</b>", s["small"]),
                 _p("<b>Level</b>", s["small"])]]
        for r in sorted(document.readability_results, key=lambda x: x.target):
            rows.append([
                _p(r.target.title(), s["small"]),
                _p(str(r.flesch_reading_ease), s["small"]),
                _p(str(r.flesch_kincaid_grade), s["small"]),
                _p(str(r.avg_sentence_length), s["small"]),
                _p(r.level, s["small"]),
            ])
        rt = Table(rows, colWidths=[32 * mm, 32 * mm, 32 * mm, 34 * mm, 34 * mm], repeatRows=1)
        rt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(rt)

    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", color=colors.HexColor("#e2e8f0")))
    story.append(_p("Generated by SaarthiText. Simplified content is produced by an AI model; "
                    "please verify critical details against the original official document.", s["small"]))

    doc.build(story)
    return buf.getvalue()
