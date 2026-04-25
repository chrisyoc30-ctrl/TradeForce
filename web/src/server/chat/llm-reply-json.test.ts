import { describe, expect, it } from "vitest";

import { extractJsonObjectString, parseLlmJsonOutput } from "./llm-reply-json";

describe("parseLlmJsonOutput", () => {
  it("parses raw JSON", () => {
    const r = parseLlmJsonOutput(
      JSON.stringify({
        reply: "Hi",
        escalate: false,
        confidence: 90,
        suggestedTopics: ["A"],
      }),
    );
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.reply).toBe("Hi");
    }
  });

  it("parses ```json fenced output", () => {
    const raw = 'Here you go:\n```json\n{"reply":"x","escalate":false,"confidence":80}\n```';
    const r = parseLlmJsonOutput(raw);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.reply).toBe("x");
  });

  it("extracts first object from preface + JSON", () => {
    const s = extractJsonObjectString('Sure! {"reply":"y","escalate":true}');
    expect(s).toContain("reply");
    const r = parseLlmJsonOutput('Sure! {"reply":"y","escalate":true,"escalationReason":"r"}');
    expect(r.success).toBe(true);
  });
});
