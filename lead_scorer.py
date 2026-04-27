"""AI lead scoring via Anthropic Claude for TradeScore."""

from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from typing import Any, List, Mapping, MutableMapping, Optional

__all__ = [
    "LeadScoringResult",
    "SCORING_SYSTEM_PROMPT",
    "score_lead",
    "_fallback_result",
]

SCORING_SYSTEM_PROMPT = """
You are a lead quality analyst for TradeScore, a trade lead generation
platform operating in Glasgow and Central Scotland.

Your job is to analyse homeowner job submissions and score them so
tradespeople can decide whether to pay £25 to access the full lead.

You will receive a JSON object containing the lead details. You must
respond with ONLY a valid JSON object — no preamble, no explanation,
no markdown, no code fences. Your response must be parseable by
json.loads() directly.

Score the lead across these five dimensions (weights shown):
  - budget_clarity (25%): Is the budget clear or estimable?
  - project_specificity (25%): Is the scope of work clearly defined?
  - urgency_and_timeline (20%): Is there a clear timeframe or deadline?
  - contact_quality (15%): Is the contact information complete and credible?
  - location_relevance (15%): Is the location in Glasgow / Central Scotland?

Compute a weighted score from 0–100. Map to grade:
  80–100 = "A", 55–79 = "B", 0–54 = "C"

Detect flags from this list (include only those that apply):
  "vague_description", "no_budget_signal", "outside_service_area",
  "suspect_contact", "duplicate_risk"

Estimated value: give a realistic £ range for this type of job in
Scotland based on the description. Format: "£X,XXX – £X,XXX".
If truly impossible to estimate, use "Unable to estimate".

Your response must be exactly this JSON shape:
{
  "grade": "A" | "B" | "C",
  "score": <integer 0-100>,
  "summary": "<2 sentences — what the job is and why it scores this grade>",
  "reason": "<1 sentence — the single most important factor in this grade>",
  "estimated_value": "<£ range string>",
  "flags": ["flag1", "flag2"],
  "dimension_scores": {
    "budget_clarity": <0-100>,
    "project_specificity": <0-100>,
    "urgency_and_timeline": <0-100>,
    "contact_quality": <0-100>,
    "location_relevance": <0-100>
  }
}

Be honest and rigorous. Tradespeople are paying £25 per lead — a Grade A
must genuinely be worth pursuing. Do not inflate scores. A vague lead is
a Grade C even if the homeowner seems genuine.
"""


@dataclass
class LeadScoringResult:
    grade: str
    score: int
    summary: str
    reason: str
    estimated_value: str
    flags: List[str]
    scored_by_ai: bool
    model_used: str


def _fallback_result() -> LeadScoringResult:
    return LeadScoringResult(
        grade="B",
        score=55,
        summary="This lead has been received and is awaiting review.",
        reason="Automated scoring is temporarily unavailable.",
        estimated_value="Unable to estimate",
        flags=[],
        scored_by_ai=False,
        model_used="fallback",
    )


def _grade_from_score(score: int) -> str:
    if score >= 80:
        return "A"
    if score >= 55:
        return "B"
    return "C"


def _weighted_score(dim: Mapping[str, Any]) -> int:
    keys = [
        "budget_clarity",
        "project_specificity",
        "urgency_and_timeline",
        "contact_quality",
        "location_relevance",
    ]
    w = (0.25, 0.25, 0.20, 0.15, 0.15)
    total = 0.0
    for k, weight in zip(keys, w):
        raw = dim.get(k, 0)
        try:
            v = float(raw)
        except (TypeError, ValueError):
            v = 0.0
        total += max(0.0, min(100.0, v)) * weight
    return int(round(max(0, min(100, total))))


def _strip_json_fence(raw: str) -> str:
    s = raw.strip()
    if s.startswith("```"):
        parts = s.split("```", 2)
        if len(parts) >= 2:
            inner = parts[1]
        else:
            inner = s
        if inner.lstrip().startswith("json"):
            inner = inner.lstrip()[4:]
        s = inner.strip()
    return s


def _parse_dimension_scores(parsed: MutableMapping[str, Any]) -> dict[str, float]:
    d = parsed.get("dimension_scores")
    if not isinstance(d, dict):
        return {
            "budget_clarity": 0.0,
            "project_specificity": 0.0,
            "urgency_and_timeline": 0.0,
            "contact_quality": 0.0,
            "location_relevance": 0.0,
        }
    out: dict[str, float] = {}
    for k in (
        "budget_clarity",
        "project_specificity",
        "urgency_and_timeline",
        "contact_quality",
        "location_relevance",
    ):
        v = d.get(k, 0)
        try:
            out[k] = float(v)
        except (TypeError, ValueError):
            out[k] = 0.0
    return out


def score_lead(lead_data: dict[str, Any]) -> LeadScoringResult:
    key = (os.environ.get("ANTHROPIC_API_KEY") or "").strip()
    if not key:
        return _fallback_result()

    try:
        import anthropic
    except Exception as exc:  # pragma: no cover
        print(f"{type(exc).__name__}: {exc!s}", file=sys.stderr)
        return _fallback_result()

    user_message = (
        f"Score this lead submission:\n\n{json.dumps(lead_data, indent=2)}"
    )

    try:
        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=600,
            system=SCORING_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        block = response.content[0]
        raw_text: Optional[str] = None
        if hasattr(block, "text"):
            raw_text = str(block.text)
        else:  # pragma: no cover
            raw_text = str(block)
        raw = raw_text.strip()
        raw = _strip_json_fence(raw)
        parsed_obj: Any = json.loads(raw)
        if not isinstance(parsed_obj, dict):
            raise ValueError("Claude response JSON must be an object")
        parsed: MutableMapping[str, Any] = dict(parsed_obj)

        dim = _parse_dimension_scores(parsed)
        computed_score = _weighted_score(dim)
        computed_grade = _grade_from_score(computed_score)

        summary = str(parsed.get("summary", "") or "").strip()
        if not summary:
            summary = "The submission has been received."

        reason = str(parsed.get("reason", "") or "").strip()
        if not reason:
            reason = "The lead has been scored from the submitted details."

        est = str(parsed.get("estimated_value", "") or "").strip()
        if not est:
            est = "Unable to estimate"

        flags_val = parsed.get("flags", [])
        flags: List[str] = []
        if isinstance(flags_val, list):
            for x in flags_val:
                if isinstance(x, str) and x.strip():
                    flags.append(x.strip())
        return LeadScoringResult(
            grade=computed_grade,
            score=computed_score,
            summary=summary,
            reason=reason,
            estimated_value=est,
            flags=flags,
            scored_by_ai=True,
            model_used="claude-opus-4-6",
        )
    except Exception as exc:
        print(f"{type(exc).__name__}: {exc!s}", file=sys.stderr)
        return _fallback_result()
