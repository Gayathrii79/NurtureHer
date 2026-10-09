"""Server-side PDF health report generation for the authenticated caller only.

Every query in this module is scoped to ``user.id`` so one mother's report can never
contain another user's health data.

The PDF is produced with fpdf2 (core fonts), therefore text is normalised to Latin-1
before writing; non-Latin scripts are transliterated to ``?`` rather than crashing the
export. This report is a screening summary, not a diagnosis.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.model_loader import pcos_model_source
from app.models.nutrition import HydrationLog
from app.models.pcos import PCOSPrediction
from app.models.ppd import PPDAssessment
from app.models.user import MotherProfile, User
from app.models.wellness import Cycle, Mood, Symptom

DISCLAIMER = (
    "NON-DIAGNOSTIC NOTICE: NurtureHer AI compiles self-reported wellness data and AI-assisted screening "
    "indications to support a clinical consultation. It does not provide a medical diagnosis, prescription "
    "or treatment. Always consult a qualified healthcare professional, ASHA worker or doctor for clinical "
    "confirmation. In case of acute pain, heavy bleeding, breathing distress or thoughts of self-harm, "
    "call emergency services (112) immediately."
)


def _clean(value: object) -> str:
    """Normalise any value to a Latin-1 safe string for the built-in PDF fonts."""
    if value is None:
        return "-"
    if isinstance(value, Enum):
        value = value.value
    if isinstance(value, (date, datetime)):
        return value.isoformat()[:10] if isinstance(value, date) and not isinstance(value, datetime) else value.strftime("%Y-%m-%d")
    text = str(value)
    return text.encode("latin-1", "replace").decode("latin-1")


class HealthReportPDF:
    def __init__(self) -> None:
        from fpdf import FPDF

        self.pdf = FPDF(format="A4")
        # Uncompressed so reviewers (and tests) can verify the report text directly.
        self.pdf.set_compression(False)
        self.pdf.set_auto_page_break(auto=True, margin=15)
        self.pdf.add_page()
        self.pdf.set_margins(15, 15, 15)

    def _heading(self, text: str) -> None:
        self.pdf.ln(4)
        self.pdf.set_font("Helvetica", "B", 12)
        self.pdf.set_text_color(30, 25, 60)
        self.pdf.multi_cell(0, 7, _clean(text), new_x="LMARGIN", new_y="NEXT")
        self.pdf.set_draw_color(124, 58, 237)
        self.pdf.set_line_width(0.6)
        y = self.pdf.get_y()
        self.pdf.line(15, y, 195, y)
        self.pdf.ln(2)

    def _kv(self, label: str, value: object) -> None:
        self.pdf.set_font("Helvetica", "B", 9)
        self.pdf.set_text_color(90, 85, 120)
        self.pdf.cell(52, 6, _clean(label), new_x="RIGHT", new_y="TOP")
        self.pdf.set_font("Helvetica", "", 9)
        self.pdf.set_text_color(25, 22, 45)
        self.pdf.multi_cell(0, 6, _clean(value), new_x="LMARGIN", new_y="NEXT")

    def _paragraph(self, text: str) -> None:
        self.pdf.set_font("Helvetica", "", 9)
        self.pdf.set_text_color(60, 56, 90)
        self.pdf.multi_cell(0, 5, _clean(text), new_x="LMARGIN", new_y="NEXT")

    def _table(self, headers: list[str], rows: list[list[object]], widths: list[int]) -> None:
        if not rows:
            self.pdf.set_font("Helvetica", "I", 9)
            self.pdf.set_text_color(120, 116, 150)
            self.pdf.multi_cell(0, 6, "No records yet.", new_x="LMARGIN", new_y="NEXT")
            return
        self.pdf.set_font("Helvetica", "B", 8)
        self.pdf.set_fill_color(237, 233, 254)
        self.pdf.set_text_color(40, 30, 80)
        for header, width in zip(headers, widths):
            self.pdf.cell(width, 7, _clean(header), border=1, fill=True)
        self.pdf.ln()
        self.pdf.set_font("Helvetica", "", 8)
        self.pdf.set_text_color(25, 22, 45)
        for row in rows:
            for value, width in zip(row, widths):
                self.pdf.cell(width, 7, _clean(value), border=1)
            self.pdf.ln()

    def render(self) -> bytes:
        return bytes(self.pdf.output())


async def build_health_report_pdf(db: AsyncSession, user: User) -> bytes:
    """Assemble the caller's own health data into a PDF and return its bytes."""
    profile = await db.scalar(select(MotherProfile).where(MotherProfile.user_id == user.id))
    moods = (
        (await db.execute(select(Mood).where(Mood.user_id == user.id).order_by(desc(Mood.created_at)).limit(15)))
        .scalars()
        .all()
    )
    symptoms = (
        (await db.execute(select(Symptom).where(Symptom.user_id == user.id).order_by(desc(Symptom.created_at)).limit(15)))
        .scalars()
        .all()
    )
    cycles = (
        (await db.execute(select(Cycle).where(Cycle.user_id == user.id).order_by(desc(Cycle.created_at)).limit(10)))
        .scalars()
        .all()
    )
    pcos_list = (
        (
            await db.execute(
                select(PCOSPrediction).where(PCOSPrediction.user_id == user.id).order_by(desc(PCOSPrediction.created_at))
            )
        )
        .scalars()
        .all()
    )
    ppd_list = (
        (
            await db.execute(
                select(PPDAssessment).where(PPDAssessment.user_id == user.id).order_by(desc(PPDAssessment.created_at))
            )
        )
        .scalars()
        .all()
    )
    hydration = await db.scalar(
        select(HydrationLog)
        .where(HydrationLog.user_id == user.id, HydrationLog.log_date == date.today())
    )

    report = HealthReportPDF()

    # Header
    report.pdf.set_font("Helvetica", "B", 16)
    report.pdf.set_text_color(109, 40, 217)
    report.pdf.multi_cell(0, 8, "NurtureHer AI - Maternal & Women's Health Report", new_x="LMARGIN", new_y="NEXT")
    report.pdf.set_font("Helvetica", "", 9)
    report.pdf.set_text_color(90, 85, 120)
    report.pdf.multi_cell(
        0,
        5,
        f"Generated {datetime.now().strftime('%Y-%m-%d %H:%M')} | Screening summary for clinical consultation",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    report.pdf.ln(2)

    report._heading("1. Patient / Profile")
    report._kv("Name", user.name)
    report._kv("Email", user.email)
    report._kv("Phone", user.phone or "-")
    report._kv("Role", user.role)
    if profile:
        report._kv("Age", f"{profile.age} years" if profile.age else "-")
        report._kv("Weight / Height", f"{profile.weight or '-'} kg / {profile.height or '-'} cm")
        bmi = None
        if profile.weight and profile.height:
            height_m = float(profile.height) / 100
            bmi = round(float(profile.weight) / (height_m * height_m), 1)
        report._kv("BMI", bmi if bmi else "-")
        report._kv("Blood group", profile.blood_group or "-")
        report._kv("Pregnancy status", profile.pregnancy_status or "-")
        report._kv("Expected / delivery date", profile.delivery_date or "-")
        report._kv("Emergency contact", profile.emergency_contact or "-")
        report._kv("District / Village", f"{profile.district or '-'} / {profile.village or '-'}")
    else:
        report._paragraph("No maternal health profile recorded yet.")

    report._heading("2. Wellness Summary")
    report._kv("Mood entries recorded", len(moods))
    report._kv("Symptom check-ins recorded", len(symptoms))
    report._kv("Cycle entries recorded", len(cycles))
    report._kv("Hydration today", f"{hydration.cups} / {hydration.target_cups} cups" if hydration else "Not logged today")
    if cycles:
        latest_cycle = cycles[0]
        report._kv("Last period date", latest_cycle.last_period_date)
        report._kv("Cycle length", f"{latest_cycle.cycle_length} days")
        report._kv("Next predicted period", latest_cycle.next_period_prediction)

    report._heading("3. Recent Mood History")
    report._table(
        ["Date", "Mood", "Note"],
        [[m.created_at.strftime("%Y-%m-%d"), m.mood, m.note or "-"] for m in moods],
        [30, 30, 120],
    )

    report._heading("4. Recent Symptom History")
    report._table(
        ["Date", "Fatigue", "Headache", "Sleep", "Anxiety", "Cramps"],
        [
            [
                s.created_at.strftime("%Y-%m-%d"),
                "Yes" if s.fatigue else "No",
                "Yes" if s.headache else "No",
                "Yes" if s.sleep_issue else "No",
                "Yes" if s.anxiety else "No",
                "Yes" if s.cramps else "No",
            ]
            for s in symptoms
        ],
        [30, 29, 29, 29, 29, 29],
    )

    report._heading("5. Menstrual Cycle Log")
    report._table(
        ["Last period", "Cycle length", "Next predicted"],
        [[c.last_period_date, f"{c.cycle_length} days", c.next_period_prediction] for c in cycles],
        [56, 56, 56],
    )

    report._heading("6. PCOS Risk Assessments")
    if pcos_list:
        report._paragraph(f"Engine used: {pcos_model_source().replace('_', ' ')}")
        report._table(
            ["Date", "Risk", "Probability", "Recommendations"],
            [
                [
                    p.created_at.strftime("%Y-%m-%d"),
                    p.risk_level,
                    f"{int(float(p.probability) * 100)}%",
                    (p.recommendations or "")[:70],
                ]
                for p in pcos_list
            ],
            [26, 26, 26, 98],
        )
    else:
        report._paragraph("No PCOS screening has been recorded.")

    report._heading("7. PPD / EPDS Assessments")
    if ppd_list:
        report._table(
            ["Date", "EPDS", "Risk", "Sentiment", "Combined", "Recommendations"],
            [
                [
                    d.created_at.strftime("%Y-%m-%d"),
                    f"{d.epds_score}/30",
                    d.risk_level,
                    d.sentiment,
                    f"{float(d.combined_risk_score or 0):.2f}",
                    (d.recommendations or "")[:55],
                ]
                for d in ppd_list
            ],
            [24, 18, 22, 30, 22, 60],
        )
    else:
        report._paragraph("No EPDS assessment has been recorded.")

    report._heading("8. Safety Notice")
    report.pdf.set_fill_color(254, 226, 226)
    report.pdf.set_font("Helvetica", "B", 9)
    report.pdf.set_text_color(153, 27, 27)
    report.pdf.multi_cell(0, 5, DISCLAIMER, fill=True, new_x="LMARGIN", new_y="NEXT")

    return report.render()
