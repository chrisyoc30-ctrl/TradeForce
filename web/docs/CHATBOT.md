# TradeScore — AI support chatbot

Production-oriented assistant embedded site-wide (`AIChatBox`). It answers from **FAQ + pricing constants**, calls an **LLM** (OpenAI-compatible) for natural phrasing, persists messages to **MongoDB** when `MONGODB_URI` is set, and **escalates** to human support using rule-based triggers plus model confidence.

---

## Architecture

| Layer | Location |
|-------|----------|
| UI widget | `src/components/AIChatBox.tsx` |
| tRPC API | `src/server/api/routers/chat.ts` (`chat.sendMessage`, `chat.getHistory`) |
| LLM | `src/server/_core/llm.ts` (`invokeLLM`) |
| Knowledge | `src/lib/chat-knowledge-base.ts` (FAQ + `lib/pricing`) |
| Escalation rules | `src/server/chat/chat-escalation.ts` |
| Storage | `src/server/chat/chat-store.ts` + `src/server/db/mongo.ts` |

---

## Environment variables

See `web/.env.example`:

- **`OPENAI_API_KEY`** — required for chat in production.
- **`OPENAI_CHAT_MODEL`** — default `gpt-4o-mini` (fast / cost-effective).
- **`OPENAI_BASE_URL`** — optional (Azure OpenAI, proxies).
- **`MONGODB_URI`** / **`MONGODB_DB_NAME`** — optional; without URI, messages use an **in-memory** store (lost on serverless cold starts — fine for dev, not for cross-instance history).

---

## API

### `chat.sendMessage` (mutation)

**Input**

- `message` — 1–2000 chars  
- `conversationId` — optional; server creates UUID if omitted  
- `userId` — optional (for future auth)  
- `userRole` — `homeowner` | `tradesman` | omit  
- `pageContext` — e.g. pathname (auto-sent from widget)

**Output**

- `response` — assistant text (may include ticket id if escalated)  
- `escalated` — boolean  
- `escalationReason` — machine tag when escalated  
- `suggestedTopics` — short follow-up chips  
- `conversationId` — persist client-side  
- `ticketId` — e.g. `CHAT-A1B2C3D4` (queue reference; wire to your helpdesk)  
- `confidence` — model self-score when not rule-escalated early

### `chat.getHistory` (query)

Returns persisted messages for a `conversationId` (for admin tools or future logged-in sync).

---

## Escalation behaviour

1. **Rule-based** (before LLM): refunds, payment issues, security, disputes, GDPR deletion, legal, account access, personal data export, explicit human request, frustration heuristics, **same question 3×**.  
2. **Model-based**: `escalate: true` in JSON, or **confidence &lt; 60** → queues ticket line in reply.  
3. **Tickets** today are **synthetic IDs** logged in DB; connect to Help Scout / Zendesk webhook in your worker.

---

## Analytics (recommended)

Track client events (GA4 / Plausible) on:

- `chat_opened`, `chat_message_sent`, `chat_escalated`, `chat_error`

Correlate with `escalationReason` and `ticketId` in your warehouse.

---

## Testing

```bash
cd web
npm test
```

- Unit tests: `src/server/chat/chat-escalation.test.ts`

Manual checks:

- [ ] Widget opens / minimizes / closes (Escape minimizes)  
- [ ] Role selector changes answers (homeowner vs tradesperson)  
- [ ] Suggested topic chips send a message  
- [ ] “Refund” triggers escalation without LLM  
- [ ] New chat clears `localStorage` key `tradescore-ai-chat-v1`  
- [ ] Production has `OPENAI_API_KEY` (fail gracefully with message if missing)

---

## Security & compliance

- Do **not** log raw chat in client analytics without consent.  
- Model is instructed **not** to collect card numbers or passwords.  
- Knowledge base must stay aligned with **FAQ** and **Terms**; update `faq-content.ts` / pricing when product changes.  
- Rate limiting: add edge / middleware limits on `/api/trpc` for `chat.sendMessage` at high volume.

---

## Operational targets (product goals)

| Metric | Target |
|--------|--------|
| Resolution without human | **&gt; 80%** (measure `!escalated`) |
| Escalation rate | **&lt; 20%** |
| p95 assistant latency | **&lt; 2 s** (LLM + network — model choice matters) |

---

*Internal runbook — not legal advice; align public claims with live policies.*
