import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from app.database.connection import get_database

logger = logging.getLogger("findit.analytics")

class AnalyticsService:
    @staticmethod
    async def get_dashboard_analytics() -> Dict[str, Any]:
        """Compute real-time campus statistics and database aggregations."""
        db = get_database()

        # 1. Total counts
        total_users = await db.users.count_documents({})
        total_lost = await db.lost_items.count_documents({})
        total_found = await db.found_items.count_documents({})
        total_recovered = await db.lost_items.count_documents({"status": "recovered"})
        pending_claims = await db.claims.count_documents({"status": "pending"})
        total_matches = await db.matches.count_documents({})
        high_conf_matches = await db.matches.count_documents({"match_status": "high_potential"})

        # 2. Recovery Rate calculation with zero-division safety
        eligible_lost = await db.lost_items.count_documents({"status": {"$ne": "rejected"}})
        recovery_rate = (total_recovered / eligible_lost * 100.0) if eligible_lost > 0 else 0.0
        recovery_rate = round(recovery_rate, 1)

        # 3. Average recovery time (days) for recovered items
        pipeline_recovery_time = [
            {"$match": {"status": "recovered", "created_at": {"$exists": True}, "updated_at": {"$exists": True}}},
            {"$project": {
                "diff_days": {
                    "$divide": [
                        {"$subtract": ["$updated_at", "$created_at"]},
                        1000 * 60 * 60 * 24
                    ]
                }
            }},
            {"$group": {"_id": None, "avg_days": {"$avg": "$diff_days"}}}
        ]
        rec_time_res = await db.lost_items.aggregate(pipeline_recovery_time).to_list(length=1)
        avg_recovery_days = round(rec_time_res[0]["avg_days"], 1) if rec_time_res and rec_time_res[0].get("avg_days") else 0.0

        # 4. Popular categories aggregation (real DB data)
        cat_pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 6}
        ]
        cat_res = await db.lost_items.aggregate(cat_pipeline).to_list(length=6)
        popular_categories = [{"category": item["_id"] or "Other", "count": item["count"]} for item in cat_res if item.get("_id")]

        # 5. Popular campus locations (real DB data)
        loc_pipeline = [
            {"$group": {"_id": "$location_lost", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 6}
        ]
        loc_res = await db.lost_items.aggregate(loc_pipeline).to_list(length=6)
        popular_locations = [{"location": item["_id"] or "General Campus", "count": item["count"]} for item in loc_res if item.get("_id")]

        # 6. Monthly trends: real DB aggregation across lost, found, and recovered items
        months_map = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        lost_monthly = await db.lost_items.aggregate([
            {"$group": {"_id": {"month": {"$month": "$created_at"}, "year": {"$year": "$created_at"}}, "count": {"$sum": 1}}},
            {"$sort": {"_id.year": 1, "_id.month": 1}},
            {"$limit": 6}
        ]).to_list(length=6)

        found_monthly = await db.found_items.aggregate([
            {"$group": {"_id": {"month": {"$month": "$created_at"}, "year": {"$year": "$created_at"}}, "count": {"$sum": 1}}},
            {"$sort": {"_id.year": 1, "_id.month": 1}},
            {"$limit": 6}
        ]).to_list(length=6)

        recovered_monthly = await db.lost_items.aggregate([
            {"$match": {"status": "recovered"}},
            {"$group": {"_id": {"month": {"$month": "$updated_at"}, "year": {"$year": "$updated_at"}}, "count": {"$sum": 1}}},
            {"$sort": {"_id.year": 1, "_id.month": 1}},
            {"$limit": 6}
        ]).to_list(length=6)

        # Merge monthly stats by month/year key
        trends_by_key = {}
        for entry in lost_monthly:
            m = entry["_id"].get("month")
            y = entry["_id"].get("year")
            if m:
                key = (y, m)
                trends_by_key[key] = {"month": f"{months_map[m-1]} {y}" if y else months_map[m-1], "lost": entry["count"], "found": 0, "recovered": 0}

        for entry in found_monthly:
            m = entry["_id"].get("month")
            y = entry["_id"].get("year")
            if m:
                key = (y, m)
                if key not in trends_by_key:
                    trends_by_key[key] = {"month": f"{months_map[m-1]} {y}" if y else months_map[m-1], "lost": 0, "found": 0, "recovered": 0}
                trends_by_key[key]["found"] = entry["count"]

        for entry in recovered_monthly:
            m = entry["_id"].get("month")
            y = entry["_id"].get("year")
            if m:
                key = (y, m)
                if key not in trends_by_key:
                    trends_by_key[key] = {"month": f"{months_map[m-1]} {y}" if y else months_map[m-1], "lost": 0, "found": 0, "recovered": 0}
                trends_by_key[key]["recovered"] = entry["count"]

        monthly_trends = list(trends_by_key.values())

        return {
            "total_users": total_users,
            "total_lost": total_lost,
            "total_found": total_found,
            "total_recovered": total_recovered,
            "recovery_rate": recovery_rate,
            "average_recovery_days": avg_recovery_days,
            "total_potential_matches": total_matches,
            "high_confidence_matches": high_conf_matches,
            "pending_claims": pending_claims,
            "popular_categories": popular_categories,
            "popular_locations": popular_locations,
            "monthly_trends": monthly_trends
        }

analytics_service = AnalyticsService()
