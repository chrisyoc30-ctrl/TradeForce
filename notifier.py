"""Email + optional Twilio SMS notifications for exclusive lead matches."""

from __future__ import annotations

import os

from smart_matcher import MatchResult


def _public_site_url() -> str:
    base = (os.getenv("NEXT_PUBLIC_SITE_URL") or os.getenv("PUBLIC_SITE_URL") or "").strip().rstrip("/")
    return base or "https://tradescore.uk"


def _send_smtp(subject: str, to_addr: str, body: str) -> None:
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


def _send_twilio_sms(to_number: str, body: str) -> None:
    account_sid = (os.getenv("TWILIO_ACCOUNT_SID") or "").strip()
    auth_token = (os.getenv("TWILIO_AUTH_TOKEN") or "").strip()
    from_number = (os.getenv("TWILIO_FROM_NUMBER") or "").strip()
    if not account_sid or not auth_token or not from_number:
        return
    import base64
    import urllib.error
    import urllib.parse
    import urllib.request

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    payload = urllib.parse.urlencode(
        {
            "To": to_number,
            "From": from_number,
            "Body": body[:1550],
        }
    ).encode("utf-8")
    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header(
        "Authorization",
        "Basic " + base64.b64encode(f"{account_sid}:{auth_token}".encode("utf-8")).decode(
            "ascii"
        ),
    )
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        urllib.request.urlopen(req, timeout=15)
    except urllib.error.HTTPError:
        return


def notify_tradesperson_of_match(
    tradesperson: dict,
    lead: dict,
    match: MatchResult,
    reserved_until: str,
) -> bool:
    ok = False
    lead_id = str(lead.get("id") or lead.get("_id") or "").strip()
    base = _public_site_url()
    pt = str(
        lead.get("projectType")
        or lead.get("project_type")
        or lead.get("service")
        or "project"
    ).strip()
    loc = str(lead.get("location") or lead.get("postcode") or "").strip()
    ai_grade = str(lead.get("ai_grade") or lead.get("aiGrade") or "—").strip()
    ai_val = str(lead.get("ai_estimated_value") or lead.get("aiEstimatedValue") or "—").strip()
    ai_sum = str(lead.get("ai_summary") or lead.get("aiSummary") or "—").strip()
    name = str(tradesperson.get("name") or tradesperson.get("full_name") or "there").strip()

    accept_url = f"{base}/leads/{lead_id}/accept"
    decline_url = f"{base}/leads/{lead_id}/decline"
    subject = f"New exclusive lead for you — {pt} in {loc}"

    email_body = (
        f"Hi {name},\n\n"
        f"You have been exclusively matched to a new job on TradeScore.\n\n"
        f"Job: {pt}\n"
        f"Location: {loc}\n"
        f"Estimated value: {ai_val}\n"
        f"AI Grade: {ai_grade}\n"
        f"Summary: {ai_sum}\n\n"
        f"You have until {reserved_until} to accept or decline.\n\n"
        f"Accept: {accept_url}\n"
        f"Decline: {decline_url}\n\n"
        "This lead is exclusively yours — no other tradesperson can see it "
        "while it is reserved for you.\n\n"
        "TradeScore"
    )

    try:
        to_email = (match.tradesperson_email or tradesperson.get("email") or "").strip()
        if to_email:
            _send_smtp(subject, to_email, email_body)
            ok = True
    except Exception:
        pass

    try:
        sms_body = (
            f"TradeScore: New {pt} job in {loc} exclusively matched to you. "
            f"Est. value: {ai_val}. Accept by {reserved_until}: {accept_url}"
        )
        phone = (match.tradesperson_phone or tradesperson.get("phone") or "").strip()
        if phone:
            _send_twilio_sms(phone, sms_body)
            ok = True
    except Exception:
        pass

    return ok
