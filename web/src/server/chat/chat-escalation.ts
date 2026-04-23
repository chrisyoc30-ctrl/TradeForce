export type ChatHistoryTurn = { role: "user" | "assistant"; content: string };

const ESCALATION_PATTERNS: { reason: string; re: RegExp }[] = [
  { reason: "refund_request", re: /\brefund\b|\bmoney back\b|\breimburs/i },
  { reason: "payment_issue", re: /\bpayment failed\b|\bcharge\b|\bcharged twice\b|\bstripe\b|\bdeclined\b|\bcard\b.*\b(fail|declin)/i },
  { reason: "security_concern", re: /\bhack(ed)?\b|\bunauthorized\b|\bbreach\b|\bstolen\b|\bphishing\b/i },
  { reason: "dispute", re: /\bdispute\b|\bmediat(e|ion)\b|\blegal action\b|\bsolicitor\b|\blawyer\b/i },
  { reason: "account_deletion", re: /\bdelete my (account|data)\b|\bgdpr\b.*\berase\b|\bright to be forgotten\b/i },
  { reason: "legal", re: /\bico\b|\bcourt\b|\blawsuit\b|\bregulator\b/i },
  { reason: "account_access", re: /\bcan'?t log in\b|\blocked out\b|\bpassword reset\b|\bforgot password\b/i },
  { reason: "personal_data", re: /\bwhat data do you hold\b|\bexport my data\b|\bdata subject\b/i },
  { reason: "human_agent", re: /\b(speak|talk) to (a )?human\b|\breal person\b|\bagent\b|\bsupport team\b.*\bnow\b/i },
];

const FRUSTRATION_PATTERNS = [
  /\bthis is (a )?joke\b|\bwaste of time\b|\bterrible\b|\bawful\b|\buseless\b|\bscam\b/i,
  /\bso angry\b|\bfurious\b|\bdisgusted\b/i,
  /!{3,}/,
];

function normalizeQuestion(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** How many prior user turns match this message (exact normalized match). */
export function countRepeatedUserQuestion(
  history: ChatHistoryTurn[],
  currentUserMessage: string,
): number {
  const norm = normalizeQuestion(currentUserMessage);
  if (norm.length < 8) return 0;
  let n = 0;
  for (const m of history) {
    if (m.role === "user" && normalizeQuestion(m.content) === norm) n += 1;
  }
  return n;
}

export function detectFrustration(message: string): boolean {
  for (const re of FRUSTRATION_PATTERNS) {
    if (re.test(message)) return true;
  }
  const letters = message.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 15) {
    const upper = message.replace(/[^A-Z]/g, "").length;
    if (upper / letters.length > 0.55) return true;
  }
  return false;
}

export function matchRuleEscalation(message: string): { escalate: boolean; reason?: string } {
  for (const { reason, re } of ESCALATION_PATTERNS) {
    if (re.test(message)) {
      return { escalate: true, reason };
    }
  }
  if (detectFrustration(message)) {
    return { escalate: true, reason: "user_frustration" };
  }
  return { escalate: false };
}

export function shouldEscalateFromRules(
  message: string,
  history: ChatHistoryTurn[],
): { escalate: boolean; reason?: string } {
  const rule = matchRuleEscalation(message);
  if (rule.escalate) return rule;

  const repeats = countRepeatedUserQuestion(history, message);
  if (repeats >= 2) {
    return { escalate: true, reason: "repeated_question" };
  }
  return { escalate: false };
}
