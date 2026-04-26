/**
 * OpenAI-compatible Chat Completions API (default: api.openai.com).
 * Set OPENAI_BASE_URL for Azure OpenAI or other providers.
 */
export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export type InvokeLLMOptions = {
  system: string;
  messages: ChatMessage[];
  /** When true, model must return valid JSON only (gpt-4o-mini+). */
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
};

/**
 * Resolve API key from env. Supports `OPENAI_API_KEY` plus common Railway typos
 * (e.g. `OPEN_API_KEY` without "AI").
 */
export function getOpenAiApiKey(): string | undefined {
  const k =
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPEN_API_KEY?.trim() ||
    process.env.OPENAI_KEY?.trim();
  return k || undefined;
}

/** True when the server can call the OpenAI-compatible API (e.g. production has a key set). */
export function isLlmConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

const DEFAULT_CHAT_MODEL = "gpt-4o-mini";

/**
 * Resolves `OPENAI_CHAT_MODEL` to a real OpenAI id. The letter “o” in 4o is often
 * mistyped as zero (`gpt-40-mini`) in env UIs, which 404s at the API.
 */
export function resolveOpenAiChatModel(raw: string | undefined): string {
  if (!raw?.trim()) {
    return DEFAULT_CHAT_MODEL;
  }
  const trimmed = raw.trim();
  const key = trimmed.toLowerCase();
  // Dashboard typos: "4o" → "40" or "4" + "0"
  if (key === "gpt-40-mini" || key === "gpt-4o-0mini" || key === "gpt-4-0-mini") {
    console.warn(
      `[llm] OPENAI_CHAT_MODEL "${trimmed}" is invalid (use gpt-4o-mini with the letter o, not 40). Using ${DEFAULT_CHAT_MODEL}.`,
    );
    return DEFAULT_CHAT_MODEL;
  }
  return trimmed;
}

export async function invokeLLM({
  system,
  messages,
  jsonMode = false,
  temperature = 0.35,
  maxTokens = 900,
}: InvokeLLMOptions): Promise<string> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = resolveOpenAiChatModel(process.env.OPENAI_CHAT_MODEL);
  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );

  const body: Record<string, unknown> = {
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [{ role: "system", content: system }, ...messages],
  };

  /** Set OPENAI_JSON_OBJECT_MODE=false for APIs that do not support `response_format` (e.g. some local proxies). */
  const useJsonObjectMode =
    jsonMode && process.env.OPENAI_JSON_OBJECT_MODE !== "false";
  if (useJsonObjectMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text?.trim()) {
    throw new Error("LLM returned empty content");
  }
  return text.trim();
}
