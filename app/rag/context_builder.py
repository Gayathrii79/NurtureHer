from __future__ import annotations

from typing import Any

from app.models.pcos import PCOSPrediction
from app.models.ppd import PPDAssessment
from app.models.user import MotherProfile, User
from app.models.wellness import Cycle, Mood, Symptom
from app.rag.prompt_templates import LANGUAGE_NAMES
from app.rag.retriever import HealthKnowledgeRetriever
from app.repositories.health import PCOSRepository, PPDRepository
from app.repositories.mother_profiles import MotherProfileRepository
from app.repositories.wellness import CycleRepository, MoodRepository, SymptomRepository


class HealthContextBuilder:
    def __init__(self, db: Any = None) -> None:
        self.db = db
        self.retriever = HealthKnowledgeRetriever(top_k=4)

    async def build(self, user: User, message: str, language: str) -> tuple[str, str, list[dict[str, Any]]]:
        documents = self.retriever.retrieve(message)
        retrieved_context = self._format_retrieved_context(documents)
        user_context = await self._build_user_context(user, language)
        sources = [
            {
                "id": item.document.metadata.get("id"),
                "category": item.document.metadata.get("category"),
                "title": item.document.metadata.get("title"),
                "source": item.document.metadata.get("source", "Clinical Practice Standard"),
                "score": round(item.score, 3),
                "excerpt": item.document.page_content[:180] + "...",
            }
            for item in documents
        ]
        return retrieved_context, user_context, sources

    def _format_retrieved_context(self, documents) -> str:
        return "\n".join(
            f"- [{item.document.metadata.get('category', 'CLINICAL').upper()}] "
            f"**{item.document.metadata.get('title', 'Clinical Guidance')}** "
            f"(Source: {item.document.metadata.get('source', 'Clinical Standard')}):\n  {item.document.page_content}"
            for item in documents
        )

    async def _build_user_context(self, user: User, language: str) -> str:
        lines = [
            f"Patient Name: {user.name}",
            f"Preferred Language: {LANGUAGE_NAMES.get(language, language)}",
        ]
        if self.db is None:
            return "\n".join(lines)

        profile = await MotherProfileRepository(self.db).get_by_user_id(user.id)
        if profile:
            lines.extend(
                [
                    f"Age: {profile.age or 'unknown'}",
                    f"Pregnancy status: {profile.pregnancy_status or 'unknown'}",
                    f"Delivery date: {profile.delivery_date.isoformat() if profile.delivery_date else 'unknown'}",
                    f"Location: {', '.join(part for part in [profile.village, profile.district] if part) or 'unknown'}",
                ]
            )

        latest_mood = await MoodRepository(self.db).latest_for_user(user.id)
        latest_symptoms = await SymptomRepository(self.db).latest_for_user(user.id)
        latest_cycle = await CycleRepository(self.db).latest_for_user(user.id)
        latest_pcos = await PCOSRepository(self.db).latest_for_user(user.id)
        latest_ppd = await PPDRepository(self.db).latest_for_user(user.id)

        if latest_mood:
            lines.append(f"Latest logged mood: {latest_mood.mood.value if hasattr(latest_mood.mood, 'value') else latest_mood.mood}")
        if latest_symptoms:
            active_symptoms = [
                name
                for name, active in {
                    "fatigue": latest_symptoms.fatigue,
                    "headache": latest_symptoms.headache,
                    "sleep issue": latest_symptoms.sleep_issue,
                    "anxiety": latest_symptoms.anxiety,
                    "cramps": latest_symptoms.cramps,
                }.items()
                if active
            ]
            lines.append(f"Active symptoms: {', '.join(active_symptoms) if active_symptoms else 'none reported'}")
        if latest_cycle:
            pred_date = latest_cycle.next_period_prediction.isoformat() if hasattr(latest_cycle.next_period_prediction, "isoformat") else str(latest_cycle.next_period_prediction)
            lines.append(f"Next cycle estimate: {pred_date}")
        if latest_pcos:
            risk_val = latest_pcos.risk_level.value if hasattr(latest_pcos.risk_level, "value") else str(latest_pcos.risk_level)
            lines.append(f"Latest PCOS risk: {risk_val} ({latest_pcos.probability:.0%})")
        if latest_ppd:
            ppd_risk = latest_ppd.risk_level.value if hasattr(latest_ppd.risk_level, "value") else str(latest_ppd.risk_level)
            lines.append(f"Latest PPD risk: {ppd_risk}, EPDS score {latest_ppd.epds_score}")
        return "\n".join(lines)