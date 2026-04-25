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

/** True when the server can call the OpenAI-compatible API (e.g. production has OPENAI_API_KEY). */
export function isLlmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function invokeLLM({
  system,
  messages,
  jsonMode = false,
  temperature = 0.35,
  maxTokens = 900,
}: InvokeLLMOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";
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
