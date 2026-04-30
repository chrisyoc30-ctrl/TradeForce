"""Exclusive AI-style smart matching for TradeScore leads (weighted heuristic)."""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional


@dataclass
class MatchResult:
    matched: bool
    tradesperson_id: Optional[str]
    tradesperson_name: Optional[str]
    tradesperson_email: Optional[str]
    tradesperson_phone: Optional[str]
    match_score: float
    match_reason: str
    attempt_number: int
    reserved_until: Optional[str] = None
    source_collection: Optional[str] = None


_POSTCODE_REGEX = re.compile(
    r"\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b",
    re.IGNORECASE,
)

_TRADE_GROUPS: dict[str, list[str]] = {
    "plumbing": ["plumber", "plumbing", "heating", "boiler", "bathroom", "pipe", "leak"],
    "electrical": ["electrician", "electrical", "rewire", "fuse", "lighting"],
    "building": ["builder", "building", "extension", "renovation", "general"],
    "roofing": ["roofer", "roofing", "roof", "gutters", "fascia"],
    "decorating": ["painter", "decorator", "decorating", "painting"],
    "joinery": ["joiner", "carpenter", "joinery", "carpentry", "doors"],
    "plastering": ["plasterer", "plastering", "rendering", "skimming"],
}

_MIN_TOTAL_SCORE = 40.0
_MAX_ATTEMPTS = 5


def _extract_outward_fragment(location: str) -> tuple[Optional[str], Optional[int]]:
    """Return outward code uppercase without space, e.g. 'G128QQ' strip to G12 + sector if possible."""
    if not location or not isinstance(location, str):
        return None, None
    m = _POSTCODE_REGEX.search(location)
    if not m:
        return None, None
    raw = m.group(1).upper().replace(" ", "")
    if len(raw) < 3:
        return None, None
    match2 = re.match(r"^([A-Z]{1,2}\d{1,2}[A-Z]?)", raw)
    if not match2:
        return None, None
    outward = match2.group(1)
    num_m = re.search(r"(\d+)", outward)
    letters = re.sub(r"\d.*", "", outward)
    num = int(num_m.group(1)) if num_m else None
    return letters, num


def _extract_district(location: str) -> str:
    """Extract outward district for display / fallback matching; normalise free text."""
    if not location or not isinstance(location, str):
        return ""
    m = _POSTCODE_REGEX.search(location)
    if m:
        frag = m.group(1).upper().replace(" ", "")
        m2 = re.match(r"^([A-Z]{1,2}\d{1,2}[A-Z]?)", frag)
        if m2:
            return m2.group(1)
    return re.sub(r"\s+", " ", location.strip().lower())


def _normalise_trade_token(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", (text or "").lower()).strip()


def _trade_group_key(token: str) -> Optional[str]:
    if not token:
        return None
    for group, synonyms in _TRADE_GROUPS.items():
        for s in synonyms:
            if token == s or token in s or s in token:
                return group
            if token in _normalise_trade_token(s):
                return group
        if token == group:
            return group
    return None


def _trade_similarity(project_type: str, trade_type: str) -> float:
    pt = _normalise_trade_token(project_type)
    tt = _normalise_trade_token(trade_type)
    if not pt or not tt:
        return 0.0
    if pt == tt:
        return 1.0
    if tt in pt or pt in tt:
        return 1.0
    pt_parts = pt.split()
    tt_parts = tt.split()
    for a in tt_parts:
        for b in pt_parts:
            if a == b and len(a) > 3:
                return 1.0
    g_pt = _trade_group_key(pt) or _trade_group_key(tt)
    g_tt = _trade_group_key(tt) or _trade_group_key(pt)
    if g_pt and g_tt and g_pt == g_tt:
        return 0.5
    if g_pt == g_tt == "plumbing" and ("heat" in pt or "heat" in tt):
        return 0.5
    return 0.0


def _location_match(location: str, area: str) -> float:
    """Return 0–100 scale: same outward = 100, nearby = 60, else substring = 60, else 0."""
    la_letters, la_num = _extract_outward_fragment(location)
    ar_letters, ar_num = _extract_outward_fragment(area)
    if la_letters and ar_letters and la_num is not None and ar_num is not None:
        if la_letters == ar_letters and la_num == ar_num:
            return 100.0
        if la_letters == ar_letters and abs(la_num - ar_num) <= 2:
            return 60.0
        if la_letters == ar_letters:
            return 40.0
    ld = _extract_district(location)
    ad = _extract_district(area)
    if ld and ad and (ld in ad or ad in ld or ld == ad):
        return 60.0
    loc_n = _normalise_trade_token(location)
    area_n = _normalise_trade_token(area)
    if loc_n and area_n and (loc_n in area_n or area_n in loc_n):
        return 60.0
    return 0.0


def _coerce_created_at(ts: dict) -> datetime:
    raw = ts.get("created_at") or ts.get("createdAt")
    if isinstance(raw, datetime):
        if raw.tzinfo is None:
            return raw.replace(tzinfo=timezone.utc)
        return raw.astimezone(timezone.utc)
    if isinstance(raw, str):
        try:
            s = raw.replace("Z", "+00:00")
            d = datetime.fromisoformat(s)
            if d.tzinfo is None:
                d = d.replace(tzinfo=timezone.utc)
            return d.astimezone(timezone.utc)
        except ValueError:
            pass
    return datetime.now(timezone.utc)


def _candidate_total_score(lead: dict, ts: dict) -> float:
    project_type = str(
        lead.get("project_type") or lead.get("projectType") or lead.get("service") or ""
    ).strip()
    location = str(lead.get("location") or lead.get("postcode") or "").strip()
    trade_type = str(ts.get("trade_type") or ts.get("trade") or "").strip()
    area = str(ts.get("area") or ts.get("postcode") or "").strip()

    trade_part = _trade_similarity(project_type, trade_type) * 35.0
    loc_points = (_location_match(location, area) / 100.0) * 30.0

    badge = (ts.get("trust_badge") or ts.get("trustBadge") or "basic") or "basic"
    trust_points = (100.0 if str(badge).lower() == "verified_business" else 50.0) * 0.15

    rr = ts.get("response_rate")
    try:
        response_rate_val = float(rr) if rr is not None else 70.0
    except (TypeError, ValueError):
        response_rate_val = 70.0
    response_rate_val = max(0.0, min(100.0, response_rate_val))
    response_points = response_rate_val * 0.10

    created = _coerce_created_at(ts)
    now = datetime.now(timezone.utc)
    days_active = max(0, min(365, (now - created).days))
    activity_points = (days_active / 365.0) * 100.0 * 0.10

    return trade_part + loc_points + trust_points + response_points + activity_points


def _gather_candidates(db: Any, previously_offered: List[str]) -> list[dict]:
    offered = {str(x) for x in (previously_offered or [])}
    out: list[dict] = []

    seen_keys: set[str] = set()

    def push(doc: dict, tid: str, coll: str) -> None:
        if not tid or tid in offered:
            return
        if tid in seen_keys:
            return
        seen_keys.add(tid)
        row = dict(doc)
        row["_match_id"] = tid
        row["_match_source"] = coll
        out.append(row)

    for doc in db.tradespeople.find(
        {"status": {"$nin": ["suspended"]}},
        limit=800,
    ):
        tid = str(doc.get("_id"))
        st = doc.get("status") or ""
        if st == "suspended":
            continue
        push(doc, tid, "tradespeople")

    cur = db.tradesman_signups.find({}, limit=800)
    for doc in cur:
        tid = str(doc.get("id") or "")
        if not tid:
            continue
        if doc.get("status") == "suspended":
            continue
        push(doc, tid, "tradesman_signups")

    return out


def _normalise_lead_for_match(lead: dict) -> dict:
    return dict(lead)


def _empty_match_result(previously_offered: List[str], reason: str) -> MatchResult:
    return MatchResult(
        matched=False,
        tradesperson_id=None,
        tradesperson_name=None,
        tradesperson_email=None,
        tradesperson_phone=None,
        match_score=0.0,
        match_reason=reason,
        attempt_number=len(previously_offered or []) + 1,
        reserved_until=None,
        source_collection=None,
    )


def _exclusive_pick_from_candidates(
    lead: dict,
    candidates: list,
    previously_offered: List[str],
) -> MatchResult:
    empty = _empty_match_result(previously_offered, "")
    try:
        if len(previously_offered or []) >= _MAX_ATTEMPTS:
            empty.match_reason = "Maximum match attempts reached"
            return empty

        lead_n = _normalise_lead_for_match(lead)
        scored: list[tuple[float, dict]] = []
        for ts in candidates:
            total = _candidate_total_score(lead_n, ts)
            if total >= _MIN_TOTAL_SCORE and not math.isnan(total):
                scored.append((total, ts))
        scored.sort(key=lambda x: -x[0])
        if not scored:
            empty.match_reason = "No suitable tradesperson found"
            return empty

        best_total, ts = scored[0]
        tid = str(ts.get("_match_id"))
        name = str(
            ts.get("name")
            or ts.get("full_name")
            or ts.get("business_name")
            or "Tradesperson"
        ).strip()
        email = str(ts.get("email") or "").strip()
        phone = str(ts.get("phone") or "").strip()
        reserved_until_dt = datetime.now(timezone.utc) + timedelta(hours=2)
        reserved_iso = reserved_until_dt.replace(microsecond=0).isoformat().replace("+00:00", "Z")
        if not reserved_iso.endswith("Z"):
            reserved_iso = reserved_iso + "Z"

        project_type = str(
            lead_n.get("project_type")
            or lead_n.get("projectType")
            or lead_n.get("service")
            or "job"
        ).strip()
        location = str(lead_n.get("location") or lead_n.get("postcode") or "").strip()

        return MatchResult(
            matched=True,
            tradesperson_id=tid,
            tradesperson_name=name,
            tradesperson_email=email,
            tradesperson_phone=phone,
            match_score=round(best_total, 1),
            match_reason=f"Best match for {project_type} in {location}",
            attempt_number=len(previously_offered or []) + 1,
            reserved_until=reserved_iso,
            source_collection=str(ts.get("_match_source")),
        )
    except Exception as e:
        return MatchResult(
            matched=False,
            tradesperson_id=None,
            tradesperson_name=None,
            tradesperson_email=None,
            tradesperson_phone=None,
            match_score=0.0,
            match_reason=f"Matching error: {e}",
            attempt_number=len(previously_offered or []) + 1,
            reserved_until=None,
            source_collection=None,
        )


def find_best_match(
    lead: dict,
    db: Any,
    previously_offered: List[str],
) -> MatchResult:
    if db is None:
        return _empty_match_result(previously_offered or [], "Database unavailable")
    try:
        candidates = _gather_candidates(db, previously_offered)
        return _exclusive_pick_from_candidates(lead, candidates, previously_offered)
    except Exception as e:
        return _empty_match_result(previously_offered or [], f"Matching error: {e}")


def max_exclusive_attempts() -> int:
    return _MAX_ATTEMPTS


def find_best_match_in_memory(
    lead: dict,
    tradespeople: list,
    signup_docs: list,
    previously_offered: List[str],
) -> MatchResult:
    """RAM-store parity when MongoDB is disabled (same scoring as Mongo path)."""

    offered = {str(x) for x in (previously_offered or [])}

    candidates: list[dict] = []
    seen: set[str] = set()

    def add_row(row: dict, tid: str, src: str) -> None:
        if not tid or tid in offered or tid in seen:
            return
        seen.add(tid)
        c = dict(row)
        c["_match_id"] = tid
        c["_match_source"] = src
        candidates.append(c)

    for doc in tradespeople:
        tid = str(doc.get("id") or doc.get("_id") or "")
        if doc.get("status") == "suspended":
            continue
        if tid:
            add_row(doc, tid, "tradespeople")

    for doc in signup_docs:
        tid = str(doc.get("id") or "")
        if doc.get("status") == "suspended" or not tid:
            continue
        add_row(doc, tid, "tradesman_signups")

    return _exclusive_pick_from_candidates(lead, candidates, previously_offered)
