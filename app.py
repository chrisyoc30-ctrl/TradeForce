import hashlib
import re
import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
from typing import Optional

from lead_scorer import _fallback_result, score_lead, LeadScoringResult

sys.stdout.flush()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/tradeforce")

try:
    from bson import ObjectId
    from pymongo import MongoClient
except Exception:
    ObjectId = None
    MongoClient = None

db = None
_db_init_attempted = False


def get_db():
    global db, _db_init_attempted

    if db is not None:
        return db

    if _db_init_attempted:
        return None

    _db_init_attempted = True
    if MongoClient is None:
        app.logger.warning("pymongo is not installed; database features are disabled.")
        return None

    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        db = client.tradeforce
        app.logger.info("MongoDB connected successfully")
        return db
    except Exception as e:
        app.logger.warning("MongoDB unavailable: %s", e)
        return None


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _grade_from_score(score: int) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def _score_payload_from_data(data: dict) -> dict:
    return {
        "name": str(data.get("name", "") or ""),
        "phone": str(data.get("phone", "") or ""),
        "email": str(data.get("email", "") or ""),
        "project_type": str(
            data.get("projectType") or data.get("project_type", "") or ""
        ),
        "description": str(data.get("description", "") or ""),
        "location": str(data.get("location", "") or ""),
        "budget": str(data.get("budget", "") or ""),
        "timeline": str(data.get("timeline", "") or ""),
    }


def _apply_claude_scoring_to_document(
    data: dict, scoring: LeadScoringResult
) -> None:
    data["ai_grade"] = scoring.grade
    data["ai_score"] = int(scoring.score)
    data["ai_summary"] = scoring.summary
    data["ai_reason"] = scoring.reason
    data["ai_estimated_value"] = scoring.estimated_value
    data["ai_flags"] = list(scoring.flags)
    data["ai_scored_by_ai"] = bool(scoring.scored_by_ai)
    data["ai_model_used"] = scoring.model_used
    data["ai_scored_at"] = datetime.now(timezone.utc).isoformat()
    data["aiGrade"] = scoring.grade
    data["aiScore"] = int(scoring.score)


def _strip_homeowner_complexity_fields(data: dict) -> None:
    """Homeowner-reported complexity removed; AI scoring covers this."""
    for k in ("projectComplexity", "complexity", "project_complexity"):
        data.pop(k, None)


def _fraud_risk(data: dict) -> str:
    phone = (data.get("phone") or "") + ""
    email = (data.get("email") or "") + ""
    desc = (data.get("description") or "") + ""
    if len(phone) < 8 or re.search(r"(\d)\1{6,}", re.sub(r"\D", "", phone)):
        return "high"
    if email and re.search(r"test|fake|spam|@example\.", email.lower()):
        return "high"
    if len(desc) < 15:
        return "medium"
    return "low"


def _score_lead(data: dict) -> tuple[int, str, dict]:
    """Heuristic AI-style score; returns (score, grade, breakdown 0-100 per factor)."""
    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip()
    project_type = (data.get("projectType") or data.get("service") or "").strip()
    desc = (data.get("description") or "").strip()
    budget = data.get("budget")
    try:
        budget_num = float(budget) if budget is not None and str(budget).strip() not in "" else 0.0
    except (TypeError, ValueError):
        budget_num = 0.0
    timeline = (data.get("timeline") or "").lower()

    contact = 40
    if len(name) >= 2:
        contact += 15
    if re.match(r"^\+?[\d\s\-()]{8,}$", phone):
        contact += 20
    if "@" in email and "." in email:
        contact += 25
    contact = min(100, contact)

    value = 35
    if project_type:
        value += 20
    if len(desc) > 200:
        value += 30
    elif len(desc) > 80:
        value += 20
    elif len(desc) > 20:
        value += 10
    if budget_num >= 2000:
        value += 15
    if budget_num >= 5000:
        value += 10
    value = min(100, value)

    urgency = 50
    if "this week" in timeline or "asap" in timeline or "urgent" in timeline:
        urgency = 90
    elif "this month" in timeline:
        urgency = 75
    elif "flexible" in timeline or "any time" in timeline:
        urgency = 45
    if len(desc) > 50 and any(w in desc.lower() for w in ("leak", "emergency", "no heat", "danger")):
        urgency = min(100, urgency + 15)

    budget_s = 40
    if budget_num > 0:
        budget_s = min(100, 40 + int(min(budget_num / 200, 1.0) * 30) + (15 if budget_num > 1000 else 0))
    timeline_s = 50
    if "this week" in timeline:
        timeline_s = 90
    elif "this month" in timeline:
        timeline_s = 70
    elif "flexible" in timeline:
        timeline_s = 55

    weighted = (
        contact * 0.20
        + value * 0.25
        + urgency * 0.20
        + budget_s * 0.20
        + timeline_s * 0.15
    )
    score = int(round(max(0, min(100, weighted))))
    grade = _grade_from_score(score)
    breakdown = {
        "contactQuality": int(round(contact)),
        "projectValue": int(round(value)),
        "urgency": int(round(urgency)),
        "budget": int(round(budget_s)),
        "timeline": int(round(timeline_s)),
    }
    return score, grade, breakdown


def _match_confidence(lead: dict) -> int:
    """0-100% heuristic fit for the current (anonymous) tradesperson view."""
    base = int(lead.get("aiScore") or 50)
    fraud = (lead.get("fraudRisk") or "low").lower()
    f_adj = 0 if fraud == "low" else (-10 if fraud == "medium" else -25)
    jiggle = 0
    _id = lead.get("id") or lead.get("_id")
    if _id is not None:
        h = int(hashlib.md5(str(_id).encode()).hexdigest()[:8], 16)
        jiggle = (h % 9) - 4
    return int(max(0, min(100, base + f_adj + jiggle)))


def _normalise_lead_api_fields(out: dict) -> dict:
    d = dict(out)
    for snake, camel in (
        ("ai_summary", "aiSummary"),
        ("ai_reason", "aiReason"),
        ("ai_estimated_value", "aiEstimatedValue"),
        ("ai_flags", "aiFlags"),
        ("ai_scored_by_ai", "aiScoredByAI"),
        ("ai_model_used", "aiModelUsed"),
        ("ai_scored_at", "aiScoredAt"),
        ("match_status", "matchStatus"),
        ("matched_tradesperson_id", "matchedTradespersonId"),
        ("matched_tradesperson_name", "matchedTradespersonName"),
        ("match_score", "matchScore"),
        ("match_attempt", "matchAttempt"),
        ("previously_offered_to", "previouslyOfferedTo"),
        ("reserved_until", "reservedUntil"),
        ("matched_at", "matchedAt"),
    ):
        if snake in d and camel not in d:
            d[camel] = d[snake]
    if d.get("ai_score") is not None:
        try:
            d["aiScore"] = int(d["ai_score"])
        except (TypeError, ValueError):
            d["aiScore"] = d.get("aiScore")
    if d.get("ai_grade") is not None and d.get("aiGrade") in (None, ""):
        d["aiGrade"] = d.get("ai_grade")
    if d.get("ai_score") is not None and d.get("aiScore") is None:
        try:
            d["aiScore"] = int(d["ai_score"])
        except (TypeError, ValueError):
            pass
    return d


def _serialise_lead(doc: dict) -> dict:
    out = dict(doc)
    oid = out.pop("_id", None)
    if oid is not None and "id" not in out:
        out["id"] = str(oid)
    for k, v in list(out.items()):
        if isinstance(v, ObjectId):
            out[k] = str(v)
    if "id" not in out:
        out["id"] = str(uuid.uuid4())
    if "aiScore" not in out and "aiGrade" in out:
        pass
    if "matchConfidence" not in out and out.get("aiScore") is not None:
        out["matchConfidence"] = _match_confidence(out)
    return _normalise_lead_api_fields(out)


# When MongoDB is not configured, leads/bids are stored in RAM (per process).
# Data is lost on restart; set MONGO_URI for production persistence.
_MEMORY_LEADS: list = []
_MEMORY_BIDS: list = []
_MEMORY_TRADESPEOPLE: list = []
_MEMORY_TRADESMAN_SIGNUPS: list = []
_MEMORY_LEAD_NOTIFICATIONS: list = []

_TRADESPERSON_ID_CHARS = string.ascii_uppercase + string.digits


def _new_tradesperson_id_unique(database):
    """Return TS- + 6 uppercase alphanumeric; ensure unique in tradesman_signups."""
    for _ in range(200):
        suffix = "".join(secrets.choice(_TRADESPERSON_ID_CHARS) for _ in range(6))
        tid = f"TS-{suffix}"
        if database is None:
            if not any(str(d.get("id")) == tid for d in _MEMORY_TRADESMAN_SIGNUPS):
                return tid
        else:
            if not database.tradesman_signups.find_one({"id": tid}):
                return tid
    return f"TS-{uuid.uuid4().hex[:6].upper()}"


def _memory_find_lead(lead_id: str):
    for d in _MEMORY_LEADS:
        if str(d.get("id")) == str(lead_id):
            return d
    return None


def _memory_find_bid(bid_id: str):
    for b in _MEMORY_BIDS:
        if str(b.get("id")) == str(bid_id):
            return b
    return None


def _enrich_lead_for_response(data: dict) -> dict:
    data = dict(data)
    data.setdefault("matched", False)
    data.setdefault("status", "open")
    data["createdAt"] = data.get("createdAt") or _now_iso()
    try:
        scoring: LeadScoringResult = score_lead(_score_payload_from_data(data))
    except Exception as exc:  # defensive: lead_scorer should not raise, but we never break submission
        app.logger.exception("score_lead failed (using fallback): %s", exc)
        scoring = _fallback_result()
    _apply_claude_scoring_to_document(data, scoring)
    _, _, breakdown = _score_lead(data)
    data["fraudRisk"] = _fraud_risk(data)
    data["scoreBreakdown"] = breakdown
    return data


def _create_lead_json_response(lead: dict) -> dict:
    lid = str(lead.get("id", ""))
    out = {
        "success": True,
        "id": lid,
        "lead_id": lid,
        "ai_grade": lead.get("ai_grade"),
        "ai_score": lead.get("ai_score"),
        "ai_summary": lead.get("ai_summary"),
        "ai_reason": lead.get("ai_reason"),
        "ai_estimated_value": lead.get("ai_estimated_value"),
        "ai_flags": list(lead.get("ai_flags") or []),
        "ai_scored_by_ai": lead.get("ai_scored_by_ai"),
        "ai_model_used": lead.get("ai_model_used"),
        "aiScore": lead.get("aiScore"),
        "aiGrade": lead.get("aiGrade"),
        "fraudRisk": lead.get("fraudRisk"),
        "scoreBreakdown": lead.get("scoreBreakdown"),
    }
    ms = lead.get("match_status")
    if ms is not None:
        out["match_status"] = ms
        out["matchStatus"] = ms
    if lead.get("matched_tradesperson_name") is not None:
        out["matched_tradesperson_name"] = lead.get("matched_tradesperson_name")
    if lead.get("match_score") is not None:
        out["match_score"] = lead.get("match_score")
        out["matchScore"] = lead.get("match_score")
    return _normalise_lead_api_fields(out)


def _parse_reserved_until_iso(value) -> Optional[datetime]:
    if value is None or value == "":
        return None
    s = str(value).strip()
    if not s:
        return None
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    try:
        d = datetime.fromisoformat(s)
    except ValueError:
        return None
    if d.tzinfo is None:
        d = d.replace(tzinfo=timezone.utc)
    return d.astimezone(timezone.utc)


def _exclusive_reservation_still_open(doc: dict) -> bool:
    ru = doc.get("reserved_until")
    end = _parse_reserved_until_iso(ru)
    if end is None:
        return False
    return datetime.now(timezone.utc) < end


def _exclusive_bump_offer_on_tradesperson(database, tradesperson_id: str, coll_hint: Optional[str]):
    tid = str(tradesperson_id or "").strip()
    if not tid or database is None:
        return

    def inc_and_rate(collection, flt):
        doc = collection.find_one(flt)
        if not doc:
            return
        offers = int(doc.get("exclusive_match_offers") or 0) + 1
        accepts = int(doc.get("exclusive_match_accepts") or 0)
        rr = max(0.0, min(100.0, round((accepts / offers) * 100.0, 1)))
        collection.update_one(
            flt,
            {"$set": {"exclusive_match_offers": offers, "response_rate": rr}},
        )

    if coll_hint == "tradesman_signups":
        inc_and_rate(database.tradesman_signups, {"id": tid})
        return
    try:
        oid = ObjectId(tid)
    except Exception:
        oid = None
    if oid is not None:
        inc_and_rate(database.tradespeople, {"_id": oid})
    if coll_hint != "tradespeople":
        inc_and_rate(database.tradesman_signups, {"id": tid})


def _exclusive_bump_accept_on_tradesperson(database, tradesperson_id: str):
    tid = str(tradesperson_id or "").strip()
    if not tid or database is None:
        return

    def bump(coll, flt):
        doc = coll.find_one(flt)
        if not doc:
            return
        offers = int(doc.get("exclusive_match_offers") or 0)
        accepts = int(doc.get("exclusive_match_accepts") or 0) + 1
        if offers <= 0:
            offers = max(1, accepts)
        rr = max(0.0, min(100.0, round((accepts / max(1, offers)) * 100.0, 1)))
        coll.update_one(
            flt,
            {"$set": {"exclusive_match_accepts": accepts, "exclusive_match_offers": offers, "response_rate": rr}},
        )

    try:
        bump(database.tradespeople, {"_id": ObjectId(tid)})
    except Exception:
        pass
    bump(database.tradesman_signups, {"id": tid})


def _exclusive_bump_decline_on_tradesperson(database, tradesperson_id: str):
    tid = str(tradesperson_id or "").strip()
    if not tid or database is None:
        return

    def bump(coll, flt):
        doc = coll.find_one(flt)
        if not doc:
            return
        dec = int(doc.get("exclusive_match_declines") or 0) + 1
        coll.update_one(flt, {"$set": {"exclusive_match_declines": dec}})

    try:
        bump(database.tradespeople, {"_id": ObjectId(tid)})
    except Exception:
        pass
    bump(database.tradesman_signups, {"id": tid})


def _exclusive_add_pending_lead(database, tradesperson_id: str, coll_hint: Optional[str], lead_id: str):
    lid = str(lead_id or "").strip()
    tid = str(tradesperson_id or "").strip()
    if not lid or not tid or database is None:
        return

    def push(coll, flt):
        coll.update_one(flt, {"$addToSet": {"pending_leads": lid}}, upsert=False)

    if coll_hint == "tradesman_signups":
        push(database.tradesman_signups, {"id": tid})
        return
    try:
        push(database.tradespeople, {"_id": ObjectId(tid)})
    except Exception:
        pass
    if coll_hint != "tradespeople":
        push(database.tradesman_signups, {"id": tid})


def _apply_exclusive_match_after_insert(database, inserted_doc: dict) -> dict:
    """Run matcher, persist fields, notify — never raises."""
    from notifier import notify_tradesperson_of_match
    from smart_matcher import MatchResult, find_best_match

    filt = {"_id": inserted_doc["_id"]}
    lead_view = dict(inserted_doc)
    lead_view["id"] = str(inserted_doc["_id"])
    prev: list[str] = list(inserted_doc.get("previously_offered_to") or [])

    try:
        match: MatchResult = find_best_match(lead_view, database, prev)
    except Exception as exc:
        app.logger.exception("exclusive match failed: %s", exc)
        database.leads.update_one(
            filt,
            {
                "$set": {
                    "match_status": "unmatched",
                    "matched_tradesperson_id": None,
                    "matched_tradesperson_name": None,
                    "match_score": None,
                    "match_attempt": 0,
                    "previously_offered_to": prev,
                    "reserved_until": None,
                    "matched_at": None,
                }
            },
        )
        return database.leads.find_one(filt) or inserted_doc

    if match.matched and match.tradesperson_id:
        database.leads.update_one(
            filt,
            {
                "$set": {
                    "match_status": "reserved",
                    "matched_tradesperson_id": match.tradesperson_id,
                    "matched_tradesperson_name": match.tradesperson_name,
                    "match_score": match.match_score,
                    "match_attempt": match.attempt_number,
                    "previously_offered_to": prev,
                    "reserved_until": match.reserved_until,
                    "matched_at": None,
                    "exclusive_match_coll_hint": match.source_collection,
                }
            },
        )
        _exclusive_add_pending_lead(
            database,
            match.tradesperson_id,
            match.source_collection,
            lead_view["id"],
        )
        _exclusive_bump_offer_on_tradesperson(
            database, match.tradesperson_id, match.source_collection
        )
        refreshed = dict(database.leads.find_one(filt) or {})
        try:
            notify_tradesperson_of_match(
                {
                    "name": match.tradesperson_name,
                    "email": match.tradesperson_email,
                    "phone": match.tradesperson_phone,
                },
                refreshed,
                match,
                str(match.reserved_until or ""),
            )
        except Exception as notify_exc:
            app.logger.warning("exclusive notify skipped: %s", notify_exc)
        return refreshed

    database.leads.update_one(
        filt,
        {
            "$set": {
                "match_status": "unmatched",
                "matched_tradesperson_id": None,
                "matched_tradesperson_name": None,
                "match_score": None,
                "match_attempt": len(prev),
                "previously_offered_to": prev,
                "reserved_until": None,
                "matched_at": None,
            }
        },
    )
    return database.leads.find_one(filt) or inserted_doc


def _memory_apply_exclusive_match(lead_dict: dict) -> None:
    from notifier import notify_tradesperson_of_match
    from smart_matcher import find_best_match_in_memory

    lid = str(lead_dict.get("id") or "")
    prev = list(lead_dict.get("previously_offered_to") or [])
    try:
        m = find_best_match_in_memory(lead_dict, _MEMORY_TRADESPEOPLE, _MEMORY_TRADESMAN_SIGNUPS, prev)
    except Exception:
        lead_dict.setdefault("match_status", "unmatched")
        return
    if m.matched and m.tradesperson_id:
        lead_dict.update(
            {
                "match_status": "reserved",
                "matched_tradesperson_id": m.tradesperson_id,
                "matched_tradesperson_name": m.tradesperson_name,
                "match_score": m.match_score,
                "match_attempt": m.attempt_number,
                "previously_offered_to": prev,
                "reserved_until": m.reserved_until,
                "matched_at": None,
            }
        )
        try:
            notify_tradesperson_of_match(
                {
                    "name": m.tradesperson_name,
                    "email": m.tradesperson_email,
                    "phone": m.tradesperson_phone,
                },
                lead_dict,
                m,
                str(m.reserved_until or ""),
            )
        except Exception:
            pass
    else:
        lead_dict.update(
            {
                "match_status": "unmatched",
                "matched_tradesperson_id": None,
                "matched_tradesperson_name": None,
                "match_score": None,
                "match_attempt": len(prev),
                "previously_offered_to": prev,
                "reserved_until": None,
                "matched_at": None,
            }
        )


def _mongo_open_board_filter():
    return {
        "$and": [
            {
                "$nor": [
                    {"match_status": {"$in": ["reserved", "matched", "exhausted"]}},
                ]
            },
            {
                "$or": [
                    {"matched": {"$in": [False, None]}},
                    {"matched": {"$exists": False}},
                ]
            },
        ]
    }


def _body_tradesperson_id() -> str:
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        body = {}
    tid = (body.get("tradesperson_id") or body.get("tradespersonId") or "").strip()
    if tid:
        return tid
    return (request.args.get("tradesperson_id") or "").strip()


def _remove_pending_lead_all_collections(database, tradesperson_id: str, lead_id: str):
    tid = str(tradesperson_id or "").strip()
    lid = str(lead_id or "").strip()
    if not tid or not lid:
        return
    try:
        database.tradespeople.update_one({"_id": ObjectId(tid)}, {"$pull": {"pending_leads": lid}})
    except Exception:
        pass
    database.tradesman_signups.update_one({"id": tid}, {"$pull": {"pending_leads": lid}})


DEMO_TRADESMEN = [
    {
        "id": "ts-gla-plumb-1",
        "name": "James MacLeod",
        "trade": "Plumbing",
        "skills": ["plumbing", "heating", "bathroom", "leak"],
    },
    {
        "id": "ts-gla-elec-1",
        "name": "Priya Kaur",
        "trade": "Electrical",
        "skills": ["electrical", "rewire", "lighting", "fuse"],
    },
    {
        "id": "ts-gla-build-1",
        "name": "Craig O'Donnell",
        "trade": "Building",
        "skills": ["joinery", "kitchen", "renovation", "roof"],
    },
    {
        "id": "ts-gla-heat-1",
        "name": "Moira Chen",
        "trade": "Heating",
        "skills": ["heating", "boiler", "gas", "radiator"],
    },
]


def _lead_text_blob(lead: dict) -> str:
    parts = [
        str(lead.get("projectType") or lead.get("service") or ""),
        str(lead.get("description") or ""),
    ]
    return " ".join(parts).lower()


def _match_tradesmen_for_lead(lead: dict) -> list:
    blob = _lead_text_blob(lead)
    lead_score = int(lead.get("aiScore") or 60)
    lead_key = str(lead.get("id") or lead.get("_id") or "")
    out = []
    for t in DEMO_TRADESMEN:
        trade = (t.get("trade") or "").lower()
        skills = t.get("skills") or []
        skill_hits = sum(1 for s in skills if s in blob)
        type_hits = 1 if trade in blob else 0
        base = 55 + min(30, skill_hits * 10) + type_hits * 15
        match = int(max(40, min(99, (base + lead_score) / 2)))
        h = int(hashlib.md5(f"{lead_key}:{t['id']}".encode()).hexdigest()[:6], 16)
        match = int(max(40, min(99, match + (h % 7) - 3)))
        out.append(
            {
                "id": t["id"],
                "name": t["name"],
                "trade": t["trade"],
                "matchScore": match,
                "skills": skills,
            }
        )
    out.sort(key=lambda x: -x["matchScore"])
    return out


def _find_lead_doc(database, lead_id: str):
    if database is None or ObjectId is None:
        return None
    try:
        oid = ObjectId(lead_id)
        doc = database.leads.find_one({"_id": oid})
        if doc:
            return doc
    except Exception:
        pass
    return database.leads.find_one({"id": lead_id})


def _lead_mongo_filter(lead_id: str) -> dict:
    if ObjectId is None:
        return {"id": lead_id}
    try:
        oid = ObjectId(lead_id)
        return {"$or": [{"_id": oid}, {"id": lead_id}]}
    except Exception:
        return {"id": lead_id}


def _serialise_bid(doc: dict) -> dict:
    out = dict(doc)
    oid = out.pop("_id", None)
    if oid is not None:
        out["id"] = str(oid)
    for k, v in list(out.items()):
        if ObjectId is not None and isinstance(v, ObjectId):
            out[k] = str(v)
    bn = (out.get("bidderName") or out.get("tradesmanName") or "").strip() or "Tradesperson"
    bp = (out.get("bidderPhone") or out.get("tradesmanId") or "").strip()
    out["bidderName"] = bn
    if bp:
        out["bidderPhone"] = bp
    tid = bp or out.get("tradesmanId")
    out["tradesman"] = {"id": str(tid) if tid is not None else "", "name": bn}
    return out


def _admin_metrics_ai_scoring(leads_col) -> dict:
    total_scored = leads_col.count_documents({"ai_scored_by_ai": True})
    grade_a = leads_col.count_documents(
        {
            "$or": [
                {"ai_grade": "A"},
                {
                    "ai_grade": {"$exists": False},
                    "aiGrade": "A",
                },
            ]
        }
    )
    grade_b = leads_col.count_documents(
        {
            "$or": [
                {"ai_grade": "B"},
                {
                    "ai_grade": {"$exists": False},
                    "aiGrade": "B",
                },
            ]
        }
    )
    grade_c = leads_col.count_documents(
        {
            "$or": [
                {"ai_grade": "C"},
                {
                    "ai_grade": {"$exists": False},
                    "aiGrade": "C",
                },
            ]
        }
    )
    fallback_count = leads_col.count_documents({"ai_scored_by_ai": False})
    with_ai_score = list(leads_col.find({"ai_score": {"$exists": True, "$ne": None}}, {"ai_score": 1}))
    ai_values = [int(d["ai_score"]) for d in with_ai_score if d.get("ai_score") is not None]
    average_score = round(sum(ai_values) / len(ai_values), 1) if ai_values else 0.0
    return {
        "total_scored": total_scored,
        "grade_a_count": grade_a,
        "grade_b_count": grade_b,
        "grade_c_count": grade_c,
        "average_score": average_score,
        "fallback_count": fallback_count,
    }


def _admin_metrics(database) -> dict:
    leads_col = database.leads
    bids_col = database.bids
    lead_count = leads_col.count_documents({})
    leads_list = list(leads_col.find({}, {"aiScore": 1}))
    scores = [int(d.get("aiScore") or 0) for d in leads_list if d.get("aiScore") is not None]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    bid_total = bids_col.count_documents({})
    accepted = bids_col.count_documents({"status": "accepted"})
    pending = bids_col.count_documents({"status": "pending"})
    acceptance_rate = (accepted / bid_total) if bid_total else 0.0

    paid_leads = leads_col.count_documents({"paymentStatus": "succeeded"})
    recent_leads = list(leads_col.find({}, {"id": 1, "projectType": 1, "aiGrade": 1, "createdAt": 1}).sort("createdAt", -1).limit(8))
    recent_bids = list(
        bids_col.find(
            {},
            {
                "amount": 1,
                "status": 1,
                "createdAt": 1,
                "bidderName": 1,
                "tradesmanName": 1,
            },
        )
        .sort("createdAt", -1)
        .limit(8)
    )

    def _strip_oid(d):
        o = dict(d)
        o.pop("_id", None)
        if "id" not in o and d.get("_id") is not None:
            o["id"] = str(d["_id"])
        return o

    return {
        "leads": {
            "total": lead_count,
            "averageScore": avg_score,
            "paid": paid_leads,
        },
        "bidding": {
            "total": bid_total,
            "pending": pending,
            "accepted": accepted,
            "acceptanceRate": acceptance_rate,
        },
        "tradesman": {
            "demoPool": len(DEMO_TRADESMEN),
        },
        "health": {
            "database": True,
            "api": "ok",
        },
        "activity": {
            "recentLeads": [_strip_oid(x) for x in recent_leads],
            "recentBids": [_strip_oid(x) for x in recent_bids],
        },
        "aiPerformance": {
            "gradesTracked": True,
            "scoringModel": "heuristic_v1",
        },
        "ai_scoring": _admin_metrics_ai_scoring(leads_col),
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "TradeScore Backend"}), 200


@app.route("/api/health", methods=["GET"])
def api_health():
    """Same as /health; use this for health checks and docs that expect /api/health."""
    return jsonify({"status": "ok", "service": "TradeScore Backend"}), 200

# GET /api/leads removed — unauthenticated endpoint, security risk

@app.route("/api/leads/unmatched", methods=["GET"])
def get_unmatched_leads():
    """Open leads for tradespeople (not yet matched to a pro)."""
    try:
        database = get_db()
        if database is None:
            leads = [
                d
                for d in _MEMORY_LEADS
                if not d.get("matched", False)
                and (d.get("status") or "open") != "closed"
                and str(d.get("match_status") or "") not in ("reserved", "matched", "exhausted")
            ]
        else:
            q = _mongo_open_board_filter()
            leads = list(database.leads.find(q))
        leads.sort(
            key=lambda d: (d.get("aiScore") or 0, d.get("createdAt") or ""),
            reverse=True,
        )
        out = []
        for d in leads:
            s = _serialise_lead(d)
            s.setdefault("matchConfidence", _match_confidence(s))
            out.append(s)
        return jsonify(out), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/internal/leads/<lead_id>/payment", methods=["POST"])
def internal_record_lead_payment(lead_id):
    """Called by Next.js Stripe webhook (server-to-server). Requires INTERNAL_WEBHOOK_SECRET."""
    secret = os.getenv("INTERNAL_WEBHOOK_SECRET", "")
    if not secret:
        return jsonify({"error": "INTERNAL_WEBHOOK_SECRET not configured"}), 503
    if request.headers.get("X-Internal-Secret") != secret:
        return jsonify({"error": "Unauthorized"}), 401

    if ObjectId is None:
        return jsonify({"error": "Database driver not available"}), 503

    database = get_db()
    if database is None:
        return jsonify({"error": "Database not connected"}), 500

    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "JSON body required"}), 400

    payment_intent_id = body.get("paymentIntentId")
    if not payment_intent_id:
        return jsonify({"error": "paymentIntentId required"}), 400

    try:
        oid = ObjectId(lead_id)
    except Exception:
        return jsonify({"error": "Invalid lead id"}), 400

    paid_at = body.get("paidAt") or _now_iso()
    status = body.get("status") or "succeeded"

    result = database.leads.update_one(
        {"_id": oid},
        {
            "$set": {
                "paymentStatus": status,
                "stripePaymentIntentId": payment_intent_id,
                "paidAt": paid_at,
                "matched": True,
                "status": "accepted",
            }
        },
    )
    if result.matched_count == 0:
        return jsonify({"error": "Lead not found"}), 404
    return jsonify({"ok": True}), 200


@app.route("/api/leads", methods=["POST"])
def create_lead():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be a JSON object"}), 400

        required_fields = ["name", "phone", "postcode"]
        missing_fields = [field for field in required_fields if not str(data.get(field) or "").strip()]
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

        data = dict(data)
        pc = str(data.get("postcode", "")).strip()
        data["postcode"] = pc
        if not str(data.get("location") or "").strip():
            data["location"] = pc
        _strip_homeowner_complexity_fields(data)

        database = get_db()
        if database is None:
            lead = _enrich_lead_for_response(data)
            lead["id"] = str(uuid.uuid4())
            _MEMORY_LEADS.append(lead)
            try:
                _memory_apply_exclusive_match(lead)
            except Exception as exc_mem:
                app.logger.warning("memory exclusive match: %s", exc_mem)
            return jsonify(_create_lead_json_response(_serialise_lead(lead))), 201

        data = dict(data)
        data["matched"] = False
        data["status"] = "open"
        data["createdAt"] = data.get("createdAt") or _now_iso()
        try:
            scoring: LeadScoringResult = score_lead(_score_payload_from_data(data))
        except Exception as exc:  # defensive: lead_scorer should not raise, but we never break submission
            app.logger.exception("score_lead failed (using fallback): %s", exc)
            scoring = _fallback_result()
        _apply_claude_scoring_to_document(data, scoring)
        _, _, breakdown = _score_lead(data)
        data["fraudRisk"] = _fraud_risk(data)
        data["scoreBreakdown"] = breakdown
        if data.get("estimatedQuoteMin") is not None and data.get("estimatedQuoteMax") is not None:
            pass

        result = database.leads.insert_one(data)
        inserted = database.leads.find_one({"_id": result.inserted_id})
        try:
            inserted = _apply_exclusive_match_after_insert(database, inserted or {})
        except Exception as exm:
            app.logger.exception("exclusive match insert hook: %s", exm)
        serial = _serialise_lead(inserted or {})
        return jsonify(_create_lead_json_response(serial)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _memory_exclusive_accept(lead: dict, tradesperson_id: str) -> tuple[bool, str]:
    tp = str(tradesperson_id or "").strip()
    if not tp:
        return False, "tradesperson_id required"
    if str(lead.get("match_status") or "") != "reserved":
        return False, "Lead is not reserved"
    if str(lead.get("matched_tradesperson_id") or "") != tp:
        return False, "Not assigned to this tradesperson"
    if not _exclusive_reservation_still_open(lead):
        return False, "Reservation has expired"
    lead["match_status"] = "matched"
    lead["matched"] = True
    lead["matched_at"] = _now_iso()
    lead["reserved_until"] = None
    _exclusive_bump_accept_on_tradesperson(None, tp)
    return True, ""


def _exclusive_accept_and_respond(database, doc: dict, tradesperson_id: str, lead_pk_filter: dict):
    from smart_matcher import max_exclusive_attempts

    tp = str(tradesperson_id or "").strip()
    if not tp:
        return jsonify({"error": "tradesperson_id required"}), 400
    if database is None:
        ok, msg = _memory_exclusive_accept(doc, tp)
        if not ok:
            return jsonify({"error": msg}), 400
        return jsonify({"ok": True, "match_status": "matched"}), 200

    filt = lead_pk_filter
    lid = str(doc.get("id") or doc.get("_id") or "")
    if str(doc.get("match_status") or "") != "reserved":
        return jsonify({"error": "Lead is not reserved"}), 409
    if str(doc.get("matched_tradesperson_id") or "") != tp:
        return jsonify({"error": "Not assigned to this tradesperson"}), 403
    if not _exclusive_reservation_still_open(doc):
        return jsonify({"error": "Reservation has expired"}), 410

    database.leads.update_one(
        filt,
        {
            "$set": {
                "match_status": "matched",
                "matched": True,
                "matched_at": _now_iso(),
                "reserved_until": None,
            }
        },
    )
    _exclusive_bump_accept_on_tradesperson(database, doc.get("matched_tradesperson_id") or tp)
    _remove_pending_lead_all_collections(database, tp, lid)
    return jsonify({"ok": True, "match_status": "matched", "attempt_cap": max_exclusive_attempts()}), 200


def _memory_exclusive_decline_then_rematch(lead: dict, tradesperson_id: str):
    from notifier import notify_tradesperson_of_match
    from smart_matcher import MatchResult, find_best_match_in_memory

    tp = str(tradesperson_id or "").strip()
    if not tp:
        return False, "tradesperson_id required", {}
    if str(lead.get("match_status") or "") != "reserved":
        return False, "Lead is not reserved", {}
    if str(lead.get("matched_tradesperson_id") or "") != tp:
        return False, "Not assigned to this tradesperson", {}
    prev = list(lead.get("previously_offered_to") or [])
    if tp not in prev:
        prev.append(tp)
    lid = str(lead.get("id") or "")
    old_tp = tp
    _exclusive_bump_decline_on_tradesperson(None, old_tp)

    match: MatchResult = find_best_match_in_memory(lead, _MEMORY_TRADESPEOPLE, _MEMORY_TRADESMAN_SIGNUPS, prev)

    lead["previously_offered_to"] = prev
    lead["matched_tradesperson_name"] = None
    lead["reserved_until"] = None
    lead["matched_tradesperson_id"] = None

    if not match.matched:
        lead["match_status"] = "exhausted"
        lead["match_score"] = None
        lead["match_attempt"] = len(prev)
        out = dict(lead)
        return True, "", out

    lead.update(
        {
            "match_status": "reserved",
            "matched_tradesperson_id": match.tradesperson_id,
            "matched_tradesperson_name": match.tradesperson_name,
            "match_score": match.match_score,
            "match_attempt": match.attempt_number,
            "reserved_until": match.reserved_until,
        }
    )
    try:
        notify_tradesperson_of_match(
            {
                "name": match.tradesperson_name,
                "email": match.tradesperson_email,
                "phone": match.tradesperson_phone,
            },
            lead,
            match,
            str(match.reserved_until or ""),
        )
    except Exception:
        pass
    out = dict(lead)
    return True, "", out


def _exclusive_decline_and_respond(database, doc: dict, tradesperson_id: str, lead_pk_filter: dict):
    from notifier import notify_tradesperson_of_match
    from smart_matcher import MatchResult, find_best_match

    tp = str(tradesperson_id or "").strip()
    if not tp:
        return jsonify({"error": "tradesperson_id required"}), 400

    filt = lead_pk_filter
    lid = str(doc.get("id") or doc.get("_id") or "")

    if database is None:
        ok, msg, payload = False, "", {}
        try:
            ok, msg, payload = _memory_exclusive_decline_then_rematch(doc, tp)
        except Exception as mx:
            msg = str(mx)
            ok = False
        if not ok:
            return jsonify({"error": msg or "Could not decline"}), 400
        return jsonify({"ok": True, "lead": _serialise_lead(payload)}), 200

    if str(doc.get("match_status") or "") != "reserved":
        return jsonify({"error": "Lead is not reserved"}), 409
    if str(doc.get("matched_tradesperson_id") or "") != tp:
        return jsonify({"error": "Not assigned to this tradesperson"}), 403

    prev = [str(x) for x in (doc.get("previously_offered_to") or [])]
    if tp not in prev:
        prev.append(tp)

    cur_tp = doc.get("matched_tradesperson_id")

    _exclusive_bump_decline_on_tradesperson(database, tp)
    _remove_pending_lead_all_collections(database, str(cur_tp or tp), lid)

    lead_view = dict(doc)
    if not lead_view.get("id"):
        lead_view["id"] = lid

    try:
        match: MatchResult = find_best_match(lead_view, database, prev)
    except Exception:
        match = MatchResult(
            matched=False,
            tradesperson_id=None,
            tradesperson_name=None,
            tradesperson_email=None,
            tradesperson_phone=None,
            match_score=0.0,
            match_reason="Matching error",
            attempt_number=len(prev),
            reserved_until=None,
            source_collection=None,
        )

    if match.matched:
        database.leads.update_one(
            filt,
            {
                "$set": {
                    "match_status": "reserved",
                    "matched_tradesperson_id": match.tradesperson_id,
                    "matched_tradesperson_name": match.tradesperson_name,
                    "match_score": match.match_score,
                    "match_attempt": match.attempt_number,
                    "previously_offered_to": prev,
                    "reserved_until": match.reserved_until,
                    "exclusive_match_coll_hint": match.source_collection,
                }
            },
        )

        _exclusive_add_pending_lead(database, match.tradesperson_id, match.source_collection, lid)
        _exclusive_bump_offer_on_tradesperson(database, match.tradesperson_id, match.source_collection)

        refreshed2 = dict(database.leads.find_one(filt) or {})
        refreshed2.setdefault("id", lid)
        try:
            notify_tradesperson_of_match(
                {
                    "name": match.tradesperson_name,
                    "email": match.tradesperson_email,
                    "phone": match.tradesperson_phone,
                },
                refreshed2,
                match,
                str(match.reserved_until or ""),
            )
        except Exception as notify_exc:
            app.logger.warning("exclusive re-notify skipped: %s", notify_exc)

        return jsonify(
            {
                "ok": True,
                "match_status": "reserved",
                "lead": _serialise_lead(refreshed2),
            }
        ), 200

    database.leads.update_one(
        filt,
        {
            "$set": {
                "match_status": "exhausted",
                "matched_tradesperson_id": None,
                "matched_tradesperson_name": None,
                "match_score": None,
                "reserved_until": None,
                "match_attempt": len(prev),
                "previously_offered_to": prev,
                "exclusive_match_coll_hint": None,
            }
        },
    )
    out = dict(database.leads.find_one(filt) or lead_view)
    return jsonify({"ok": True, "match_status": "exhausted", "lead": _serialise_lead(out)}), 200


@app.route("/api/leads/<lead_id>/accept", methods=["POST"])
def exclusive_accept_route(lead_id):
    database = get_db()
    if database is None:
        doc = _memory_find_lead(str(lead_id))
    else:
        doc = _find_lead_doc(database, lead_id)
    if not doc:
        return jsonify({"error": "Lead not found"}), 404
    filt = _lead_mongo_filter(lead_id) if database is not None else {}
    try:
        return _exclusive_accept_and_respond(database, doc, _body_tradesperson_id(), filt)
    except Exception as e:
        app.logger.exception("exclusive accept: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/leads/<lead_id>/decline", methods=["POST"])
def exclusive_decline_route(lead_id):
    database = get_db()
    if database is None:
        doc = _memory_find_lead(str(lead_id))
    else:
        doc = _find_lead_doc(database, lead_id)
    if not doc:
        return jsonify({"error": "Lead not found"}), 404
    filt = _lead_mongo_filter(lead_id) if database is not None else {}
    try:
        return _exclusive_decline_and_respond(database, doc, _body_tradesperson_id(), filt)
    except Exception as e:
        app.logger.exception("exclusive decline: %s", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/leads/<lead_id>", methods=["GET"])
def get_lead(lead_id):
    try:
        database = get_db()
        if database is None:
            doc = _memory_find_lead(lead_id)
            if not doc:
                return jsonify({"error": "Not found"}), 404
            return jsonify(_serialise_lead(doc)), 200
        doc = _find_lead_doc(database, lead_id)
        if not doc:
            return jsonify({"error": "Not found"}), 404
        return jsonify(_serialise_lead(doc)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/leads/<lead_id>/matched", methods=["GET"])
def get_matched_tradesmen(lead_id):
    try:
        database = get_db()
        if database is None:
            doc = _memory_find_lead(lead_id)
            if not doc:
                return jsonify({"error": "Lead not found"}), 404
            serial = _serialise_lead(doc)
            return jsonify(_match_tradesmen_for_lead(serial)), 200
        doc = _find_lead_doc(database, lead_id)
        if not doc:
            return jsonify({"error": "Lead not found"}), 404
        serial = _serialise_lead(doc)
        return jsonify(_match_tradesmen_for_lead(serial)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/leads/for-user", methods=["GET"])
def get_leads_for_user():
    phone = (request.args.get("phone") or "").strip()
    if len(phone) < 8:
        return jsonify({"error": "phone query param required (min 8 chars)"}), 400
    try:
        database = get_db()
        norm = re.sub(r"\s+", "", phone)
        if database is None:
            leads = [d for d in _MEMORY_LEADS if d.get("phone") == phone]
            if not leads and len(norm) >= 1:
                tail = norm[-10:] if len(norm) >= 10 else norm
                leads = [
                    d
                    for d in _MEMORY_LEADS
                    if tail in re.sub(r"\D", "", (d.get("phone") or ""))
                ]
            leads.sort(key=lambda d: (d.get("createdAt") or ""), reverse=True)
            return jsonify([_serialise_lead(d) for d in leads]), 200
        leads = list(database.leads.find({"phone": phone}))
        if not leads:
            leads = list(database.leads.find({"phone": {"$regex": re.escape(norm[-10:])}}))
        leads.sort(key=lambda d: (d.get("createdAt") or ""), reverse=True)
        return jsonify([_serialise_lead(d) for d in leads]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/leads/<lead_id>/bids", methods=["GET"])
def list_bids_for_lead(lead_id):
    try:
        database = get_db()
        if database is None:
            bids = [b for b in _MEMORY_BIDS if str(b.get("leadId")) == str(lead_id)]
            bids.sort(key=lambda b: (b.get("createdAt") or ""), reverse=True)
            return jsonify([_serialise_bid(b) for b in bids]), 200
        bids = list(database.bids.find({"leadId": lead_id}).sort("createdAt", -1))
        return jsonify([_serialise_bid(b) for b in bids]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/leads/<lead_id>/bids", methods=["POST"])
def create_bid(lead_id):
    try:
        body = request.get_json(silent=True)
        if not isinstance(body, dict):
            return jsonify({"error": "JSON body required"}), 400
        bidder_name = (body.get("bidderName") or body.get("tradesmanName") or "").strip()
        bidder_phone = (body.get("bidderPhone") or "").strip()
        if not bidder_name or not bidder_phone:
            return jsonify({"error": "bidderName and bidderPhone are required"}), 400
        try:
            amount = float(body.get("amount"))
        except (TypeError, ValueError):
            return jsonify({"error": "amount must be a number"}), 400
        desc = (body.get("description") or "").strip() or "Quote"
        bid_doc = {
            "leadId": lead_id,
            "bidderName": bidder_name,
            "bidderPhone": bidder_phone,
            "amount": amount,
            "description": desc,
            "status": "pending",
            "createdAt": _now_iso(),
        }
        database = get_db()
        if database is None:
            if not _memory_find_lead(lead_id):
                return jsonify({"error": "Lead not found"}), 404
            bid_doc["id"] = str(uuid.uuid4())
            _MEMORY_BIDS.append(bid_doc)
            return jsonify(_serialise_bid(bid_doc)), 201
        if not _find_lead_doc(database, lead_id):
            return jsonify({"error": "Lead not found"}), 404
        result = database.bids.insert_one(bid_doc)
        inserted = database.bids.find_one({"_id": result.inserted_id})
        return jsonify(_serialise_bid(inserted)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/bids/<bid_id>/accept", methods=["POST"])
def accept_bid_route(bid_id):
    try:
        database = get_db()
        if database is None:
            bid = _memory_find_bid(bid_id)
            if not bid:
                return jsonify({"error": "Bid not found"}), 404
            lead_id = bid.get("leadId")
            if not lead_id:
                return jsonify({"error": "Bid missing leadId"}), 400
            bid_id_str = str(bid.get("id"))
            for b in _MEMORY_BIDS:
                if str(b.get("leadId")) == str(lead_id) and str(b.get("id")) != bid_id_str:
                    b["status"] = "rejected"
                    b["updatedAt"] = _now_iso()
            bid["status"] = "accepted"
            bid["updatedAt"] = _now_iso()
            lead = _memory_find_lead(str(lead_id))
            if lead:
                lead["status"] = "bid_accepted"
                lead["acceptedBidId"] = bid_id_str
                lead["updatedAt"] = _now_iso()
            return jsonify(_serialise_bid(bid)), 200
        if ObjectId is None:
            return jsonify({"error": "Database driver not available"}), 503
        try:
            b_oid = ObjectId(bid_id)
        except Exception:
            return jsonify({"error": "Invalid bid id"}), 400
        bid = database.bids.find_one({"_id": b_oid})
        if not bid:
            return jsonify({"error": "Bid not found"}), 404
        lead_id = bid.get("leadId")
        if not lead_id:
            return jsonify({"error": "Bid missing leadId"}), 400
        database.bids.update_many(
            {"leadId": lead_id, "_id": {"$ne": b_oid}},
            {"$set": {"status": "rejected", "updatedAt": _now_iso()}},
        )
        database.bids.update_one(
            {"_id": b_oid},
            {"$set": {"status": "accepted", "updatedAt": _now_iso()}},
        )
        database.leads.update_one(
            _lead_mongo_filter(lead_id),
            {
                "$set": {
                    "status": "bid_accepted",
                    "acceptedBidId": str(b_oid),
                    "updatedAt": _now_iso(),
                }
            },
        )
        updated = database.bids.find_one({"_id": b_oid})
        return jsonify(_serialise_bid(updated)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _try_send_smtp(to_addr: str, subject: str, body: str) -> None:
    import smtplib
    from email.message import EmailMessage

    host = (os.getenv("SMTP_HOST") or "").strip()
    if not host or not to_addr:
        return
    user = (os.getenv("SMTP_USER") or "").strip()
    password = (os.getenv("SMTP_PASSWORD") or "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    from_addr = (os.getenv("SMTP_FROM") or user or "noreply@example.com").strip()
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_addr
    msg.set_content(body)
    with smtplib.SMTP(host, port) as smtp:
        smtp.starttls()
        if user and password:
            smtp.login(user, password)
        smtp.send_message(msg)


@app.route("/api/email/lead-received", methods=["POST"])
def email_lead_received():
    """Sends confirmation if SMTP_* env vars are set; otherwise no-ops with ok."""
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "JSON body required"}), 400
    to = (data.get("to") or data.get("email") or "").strip()
    if not to:
        return jsonify({"error": "email required"}), 400
    if not (os.getenv("SMTP_HOST") or "").strip():
        return jsonify({"ok": True, "skipped": True}), 200
    name = (data.get("name") or "there").strip()
    pt = (data.get("projectType") or "Your project").strip()
    lead_id = data.get("leadId", "")
    subject = "Your TradeScore job has been received"
    text = (
        f"Hi {name},\n\n"
        f"Thanks — we've received your job ({pt}).\n"
        f"Reference: {lead_id}\n\n"
        "We'll match it to relevant tradespeople in Glasgow — you should hear from them "
        "within 24 hours. Check your phone for quotes.\n\n"
        "— TradeScore\n"
    )
    try:
        _try_send_smtp(to, subject, text)
    except Exception as e:
        app.logger.warning("SMTP lead confirmation failed: %s", e)
        return jsonify({"ok": False, "error": "smtp_failed"}), 500
    return jsonify({"ok": True}), 200


@app.route("/api/tradesman/register", methods=["POST"])
def register_tradesperson():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be a JSON object"}), 400
        required = ["name", "trade_type", "area", "phone", "email"]
        missing = [f for f in required if not str(data.get(f) or "").strip()]
        if missing:
            return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400
        if not data.get("terms") and not data.get("agreeTerms"):
            return jsonify({"error": "You must accept the Terms of Service"}), 400
        exp = data.get("experience_years")
        try:
            experience_years = int(exp) if exp is not None and str(exp).strip() != "" else None
        except (TypeError, ValueError):
            experience_years = None
        sa = data.get("service_areas")
        if isinstance(sa, str):
            service_areas = [x.strip() for x in sa.split(",") if x.strip()]
        elif isinstance(sa, list):
            service_areas = [str(x).strip() for x in sa if str(x).strip()]
        else:
            service_areas = []
        doc = {
            "name": str(data.get("name", "")).strip(),
            "trade_type": str(data.get("trade_type", "")).strip(),
            "area": str(data.get("area", "")).strip(),
            "phone": str(data.get("phone", "")).strip(),
            "email": str(data.get("email", "")).strip(),
            "experience_years": experience_years,
            "description": (data.get("description") or "").strip() or None,
            "service_areas": service_areas,
            "status": "pending",
            "created_at": datetime.now(timezone.utc),
        }
        database = get_db()
        if database is None:
            doc["id"] = str(uuid.uuid4())
            _MEMORY_TRADESPEOPLE.append(doc)
            return jsonify({"ok": True, "id": doc["id"]}), 201
        result = database.tradespeople.insert_one(doc)
        return jsonify({"ok": True, "id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/tradesman/<id>/validate", methods=["GET"])
def validate_tradesperson(id):
    try:
        key = (id or "").strip()
        if not key:
            return jsonify({"valid": False}), 404
        database = get_db()
        if database is None:
            for doc in _MEMORY_TRADESMAN_SIGNUPS:
                if str(doc.get("id")) == key:
                    return (
                        jsonify(
                            {
                                "valid": True,
                                "name": str(doc.get("full_name", "")),
                            }
                        ),
                        200,
                    )
            return jsonify({"valid": False}), 404
        doc = database.tradesman_signups.find_one({"id": key})
        if not doc:
            return jsonify({"valid": False}), 404
        return (
            jsonify({"valid": True, "name": str(doc.get("full_name", ""))}),
            200,
        )
    except Exception:
        return jsonify({"valid": False}), 404


@app.route("/api/tradesman-signup", methods=["POST"])
def tradesman_signup():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be a JSON object"}), 400
        full_name = str(data.get("full_name", "")).strip()
        business_name = str(data.get("business_name", "")).strip()
        trade_type = str(data.get("trade_type", "")).strip()
        phone = str(data.get("phone", "")).strip()
        email = str(data.get("email", "")).strip()
        postcode = str(data.get("postcode", "")).strip()
        fields = {
            "full_name": full_name,
            "business_name": business_name,
            "trade_type": trade_type,
            "phone": phone,
            "email": email,
            "postcode": postcode,
        }
        for k, v in fields.items():
            if not v:
                return jsonify({"error": f"Missing or empty field: {k}"}), 400
        if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
            return jsonify({"error": "Invalid email address"}), 400
        email_key = email.lower()
        database = get_db()
        if database is None:
            for doc in _MEMORY_TRADESMAN_SIGNUPS:
                if str(doc.get("email", "")).lower() == email_key:
                    return (
                        jsonify(
                            {
                                "error": "An account with this email already exists",
                            }
                        ),
                        409,
                    )
            tid = _new_tradesperson_id_unique(None)
            doc = {
                "id": tid,
                "full_name": full_name,
                "business_name": business_name,
                "trade_type": trade_type,
                "phone": phone,
                "email": email_key,
                "postcode": postcode,
                "created_at": datetime.now(timezone.utc),
                "status": "active",
            }
            _MEMORY_TRADESMAN_SIGNUPS.append(doc)
            return jsonify({"success": True, "tradesperson_id": tid}), 201
        if database.tradesman_signups.find_one({"email": email_key}):
            return (
                jsonify(
                    {"error": "An account with this email already exists"},
                ),
                409,
            )
        tid = _new_tradesperson_id_unique(database)
        doc = {
            "id": tid,
            "full_name": full_name,
            "business_name": business_name,
            "trade_type": trade_type,
            "phone": phone,
            "email": email_key,
            "postcode": postcode,
            "created_at": datetime.now(timezone.utc),
            "status": "active",
        }
        try:
            database.tradesman_signups.insert_one(doc)
        except Exception:
            app.logger.exception("tradesman_signups insert")
            return jsonify({"error": "Could not save registration"}), 500
        return jsonify({"success": True, "tradesperson_id": tid}), 201
    except Exception:
        app.logger.exception("tradesman_signup")
        return jsonify({"error": "Could not complete registration"}), 500


@app.route("/api/notify-me", methods=["POST"])
def notify_me():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({"error": "Request body must be a JSON object"}), 400
        email = (data.get("email") or "").strip()
        trade_type = (data.get("tradeType") or data.get("trade_type") or "").strip()
        if not email or "@" not in email:
            return jsonify({"error": "A valid email is required"}), 400
        if not trade_type:
            return jsonify({"error": "tradeType is required"}), 400
        doc = {"email": email, "trade_type": trade_type, "createdAt": _now_iso()}
        database = get_db()
        if database is None:
            doc["id"] = str(uuid.uuid4())
            _MEMORY_LEAD_NOTIFICATIONS.append(doc)
            return jsonify({"ok": True}), 201
        database.lead_notifications.insert_one(doc)
        return jsonify({"ok": True}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/metrics", methods=["GET"])
def admin_metrics_route():
    secret = os.getenv("ADMIN_SECRET", "")
    if secret and request.headers.get("X-Admin-Secret") != secret:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        database = get_db()
        if database is None:
            mem = _MEMORY_LEADS
            sc_by_ai = [d for d in mem if d.get("ai_scored_by_ai") is True]
            total_scored = len(sc_by_ai)
            fallback_count = len([d for d in mem if d.get("ai_scored_by_ai") is False])
            g_a = sum(
                1
                for d in mem
                if (d.get("ai_grade") or d.get("aiGrade") or "") == "A"
            )
            g_b = sum(
                1
                for d in mem
                if (d.get("ai_grade") or d.get("aiGrade") or "") == "B"
            )
            g_c = sum(
                1
                for d in mem
                if (d.get("ai_grade") or d.get("aiGrade") or "") == "C"
            )
            ai_vals = [int(d["ai_score"]) for d in mem if d.get("ai_score") is not None]
            avg_line = (
                round(sum(ai_vals) / len(ai_vals), 1) if ai_vals else 0.0
            )
            return (
                jsonify(
                    {
                        "leads": {"total": 0, "averageScore": 0, "paid": 0},
                        "bidding": {
                            "total": 0,
                            "pending": 0,
                            "accepted": 0,
                            "acceptanceRate": 0,
                        },
                        "tradesman": {"demoPool": len(DEMO_TRADESMEN)},
                        "health": {"database": False, "api": "ok"},
                        "activity": {"recentLeads": [], "recentBids": []},
                        "aiPerformance": {
                            "gradesTracked": False,
                            "scoringModel": "heuristic_v1",
                        },
                        "ai_scoring": {
                            "total_scored": total_scored,
                            "grade_a_count": g_a,
                            "grade_b_count": g_b,
                            "grade_c_count": g_c,
                            "average_score": avg_line,
                            "fallback_count": fallback_count,
                        },
                    }
                ),
                200,
            )
        return jsonify(_admin_metrics(database)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=False, host="0.0.0.0", port=port)
