import { z } from "zod";

const llmOutputSchema = z.object({
  reply: z.string(),
  /** Models in JSON mode sometimes omit this; default keeps replies usable without re-prompting. */
  escalate: z.boolean().default(false),
  escalationReason: z.string().nullable().optional(),
  confidence: z.number().min(0).max(100).optional(),
  suggestedTopics: z.array(z.string()).max(6).optional(),
});

export type ParsedLlmChatOutput = z.infer<typeof llmOutputSchema>;

/**
 * Models often ignore "no markdown" and wrap JSON in ```json fences, or add a short preface.
 * Extract a JSON object string before zod parsing.
 */
export function extractJsonObjectString(raw: string): string {
  const t = raw.trim();
  if (!t) return t;

  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)```/im);
  if (fence?.[1]) {
    return fence[1].trim();
  }

  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return t.slice(start, end + 1);
  }
  return t;
}

export function parseLlmJsonOutput(
  raw: string,
):
  | { success: true; data: ParsedLlmChatOutput }
  | { success: false; error: Error } {
  const extracted = extractJsonObjectString(raw);
  try {
    const parsed = JSON.parse(extracted) as unknown;
    const safe = llmOutputSchema.safeParse(parsed);
    if (!safe.success) {
      return { success: false, error: new Error("schema mismatch after JSON parse") };
    }
    return { success: true, data: safe.data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e : new Error("invalid json"),
    };
  }
}
