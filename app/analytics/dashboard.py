from __future__ import annotations

from typing import Any
import pymongo

from app.models.enums import RiskLevel
from app.models.pcos import PCOSPrediction
from app.models.ppd import PPDAssessment
from app.models.user import User
from app.models.wellness import Cycle


class MotherAnalyticsService:
    def __init__(self, db: Any) -> None:
        self.db = db

    async def dashboard(self, user: User) -> dict[str, Any]:
        uid = str(user.id)
        mood_col = getattr(self.db, "moods", None) or self.db["moods"]
        symptom_col = getattr(self.db, "symptoms", None) or self.db["symptoms"]
        cycle_col = getattr(self.db, "cycles", None) or self.db["cycles"]
        pcos_col = getattr(self.db, "pcos_predictions", None) or self.db["pcos_predictions"]
        ppd_col = getattr(self.db, "ppd_assessments", None) or self.db["ppd_assessments"]

        # 1. Mood trends
        mood_docs = await mood_col.aggregate([
            {"$match": {"user_id": uid, "deleted_at": None}},
            {"$group": {"_id": "$mood", "count": {"$sum": 1}}},
        ]).to_list(100)
        mood_trends = {str(doc["_id"]): doc["count"] for doc in mood_docs if doc.get("_id") is not None}

        # 2. Symptom trends
        symptom_res = await symptom_col.aggregate([
            {"$match": {"user_id": uid, "deleted_at": None}},
            {"$group": {
                "_id": None,
                "fatigue": {"$sum": {"$cond": ["$fatigue", 1, 0]}},
                "headache": {"$sum": {"$cond": ["$headache", 1, 0]}},
                "sleep_issue": {"$sum": {"$cond": ["$sleep_issue", 1, 0]}},
                "anxiety": {"$sum": {"$cond": ["$anxiety", 1, 0]}},
                "cramps": {"$sum": {"$cond": ["$cramps", 1, 0]}},
            }},
        ]).to_list(1)
        symptom_counts = symptom_res[0] if symptom_res else {}

        # 3. Cycle insights
        latest_cycle_doc = await cycle_col.find_one(
            {"user_id": uid, "deleted_at": None},
            sort=[("created_at", pymongo.DESCENDING)],
        )
        latest_cycle = Cycle.from_mongo(latest_cycle_doc) if latest_cycle_doc else None

        cycle_summary_res = await cycle_col.aggregate([
            {"$match": {"user_id": uid, "deleted_at": None}},
            {"$group": {
                "_id": None,
                "count": {"$sum": 1},
                "avg": {"$avg": "$cycle_length"},
                "min": {"$min": "$cycle_length"},
                "max": {"$max": "$cycle_length"},
            }},
        ]).to_list(1)
        cycle_summary = cycle_summary_res[0] if cycle_summary_res else {}

        cycle_count = cycle_summary.get("count", 0)
        avg_cycle_length = cycle_summary.get("avg")
        min_cycle_length = cycle_summary.get("min")
        max_cycle_length = cycle_summary.get("max")
        regularity_range = (max_cycle_length - min_cycle_length) if min_cycle_length is not None and max_cycle_length is not None else None

        # 4. PCOS insights
        pcos_docs = await pcos_col.aggregate([
            {"$match": {"user_id": uid, "deleted_at": None}},
            {"$group": {"_id": "$risk_level", "count": {"$sum": 1}}},
        ]).to_list(100)
        pcos_history = {str(doc["_id"]): doc["count"] for doc in pcos_docs if doc.get("_id") is not None}

        latest_pcos_doc = await pcos_col.find_one(
            {"user_id": uid, "deleted_at": None},
            sort=[("created_at", pymongo.DESCENDING)],
        )
        latest_pcos = PCOSPrediction.from_mongo(latest_pcos_doc) if latest_pcos_doc else None

        # 5. PPD insights
        ppd_docs = await ppd_col.aggregate([
            {"$match": {"user_id": uid, "deleted_at": None}},
            {"$group": {"_id": "$risk_level", "count": {"$sum": 1}}},
        ]).to_list(100)
        ppd_history = {str(doc["_id"]): doc["count"] for doc in ppd_docs if doc.get("_id") is not None}

        latest_ppd_doc = await ppd_col.find_one(
            {"user_id": uid, "deleted_at": None},
            sort=[("created_at", pymongo.DESCENDING)],
        )
        latest_ppd = PPDAssessment.from_mongo(latest_ppd_doc) if latest_ppd_doc else None

        return {
            "mood_trends": mood_trends,
            "symptom_trends": {
                "fatigue": symptom_counts.get("fatigue", 0),
                "headache": symptom_counts.get("headache", 0),
                "sleep_issue": symptom_counts.get("sleep_issue", 0),
                "anxiety": symptom_counts.get("anxiety", 0),
                "cramps": symptom_counts.get("cramps", 0),
            },
            "cycle_insights": {
                "last_period_date": latest_cycle.last_period_date.isoformat() if latest_cycle and latest_cycle.last_period_date else None,
                "next_period_prediction": latest_cycle.next_period_prediction.isoformat() if latest_cycle and latest_cycle.next_period_prediction else None,
                "cycle_length": latest_cycle.cycle_length if latest_cycle else None,
                "cycle_entries": cycle_count,
                "average_cycle_length": round(float(avg_cycle_length), 1) if avg_cycle_length is not None else None,
                "regularity_range_days": regularity_range,
                "regularity": "irregular" if regularity_range is not None and regularity_range > 7 else "regular" if cycle_count else None,
            },
            "pcos_history": pcos_history,
            "pcos_latest": {
                "risk_level": latest_pcos.risk_level.value if latest_pcos else None,
                "probability": latest_pcos.probability if latest_pcos else None,
                "recommendations": latest_pcos.recommendations if latest_pcos else None,
            },
            "ppd_history": ppd_history,
            "ppd_latest": {
                "risk_level": latest_ppd.risk_level.value if latest_ppd else None,
                "epds_score": latest_ppd.epds_score if latest_ppd else None,
                "sentiment": latest_ppd.sentiment if latest_ppd else None,
            },
        }


class ASHAAnalyticsService:
    def __init__(self, db: Any) -> None:
        self.db = db

    async def dashboard(self) -> dict[str, Any]:
        high_risk_col = getattr(self.db, "high_risk_cases", None) or self.db["high_risk_cases"]
        alerts_col = getattr(self.db, "alerts", None) or self.db["alerts"]
        mother_col = getattr(self.db, "mother_profiles", None) or self.db["mother_profiles"]

        high_risk_count = await high_risk_col.count_documents({"deleted_at": None})
        high_cases = await high_risk_col.count_documents({"risk_level": "high", "deleted_at": None})

        # Alert statistics
        alert_docs = await alerts_col.aggregate([
            {"$match": {"deleted_at": None}},
            {"$group": {"_id": "$sent_status", "count": {"$sum": 1}}},
        ]).to_list(100)
        alert_statistics = {str(d["_id"]): d["count"] for d in alert_docs if d.get("_id") is not None}

        # High risk by source
        source_docs = await high_risk_col.aggregate([
            {"$match": {"deleted_at": None}},
            {"$group": {"_id": "$risk_type", "count": {"$sum": 1}}},
        ]).to_list(100)
        high_risk_by_source = {str(d["_id"]): d["count"] for d in source_docs if d.get("_id") is not None}

        # High risk by level
        level_docs = await high_risk_col.aggregate([
            {"$match": {"deleted_at": None}},
            {"$group": {"_id": "$risk_level", "count": {"$sum": 1}}},
        ]).to_list(100)
        high_risk_by_level = {str(d["_id"]): d["count"] for d in level_docs if d.get("_id") is not None}

        # Mothers by district
        district_docs = await mother_col.aggregate([
            {"$match": {"district": {"$ne": None}, "deleted_at": None}},
            {"$group": {"_id": "$district", "count": {"$sum": 1}}},
        ]).to_list(100)
        mothers_by_district = [{"district": d["_id"], "count": d["count"]} for d in district_docs if d.get("_id")]

        # Mothers by village
        village_docs = await mother_col.aggregate([
            {"$match": {"district": {"$ne": None}, "village": {"$ne": None}, "deleted_at": None}},
            {"$group": {"_id": {"district": "$district", "village": "$village"}, "count": {"$sum": 1}}},
        ]).to_list(100)
        mothers_by_village = [
            {"district": d["_id"]["district"], "village": d["_id"]["village"], "count": d["count"]}
            for d in village_docs if d.get("_id") and isinstance(d["_id"], dict)
        ]

        # Monthly trends
        monthly_docs = await high_risk_col.find(
            {"deleted_at": None},
            {"created_at": 1}
        ).to_list(length=1000)
        monthly_trends: dict[str, int] = {}
        for d in monthly_docs:
            c = d.get("created_at")
            if c:
                k = c.strftime("%Y-%m") if hasattr(c, "strftime") else str(c)[:7]
                monthly_trends[k] = monthly_trends.get(k, 0) + 1

        return {
            "high_risk_count": high_risk_count,
            "mothers_by_village": mothers_by_village,
            "alert_statistics": alert_statistics,
            "monthly_trends": monthly_trends,
            "high_risk_by_source": high_risk_by_source,
            "high_risk_by_level": high_risk_by_level,
            "mothers_by_district": mothers_by_district,
            "high_risk_cases": high_cases,
        }