import { describe, expect, it } from "vitest";

import { buildChatKnowledgeBase, buildChatSystemPrompt } from "./chat-knowledge-base";

describe("chat-knowledge-base", () => {
  it("includes pricing and FAQ substance", () => {
    const kb = buildChatKnowledgeBase();
    expect(kb).toContain("£25");
    expect(kb).toContain("TradeScore");
    expect(kb.length).toBeGreaterThan(200);
  });

  it("system prompt references JSON output contract", () => {
    const sys = buildChatSystemPrompt("homeowner");
    expect(sys).toContain("JSON");
    expect(sys).toContain("escalate");
    expect(sys).toContain("homeowner");
  });
});
