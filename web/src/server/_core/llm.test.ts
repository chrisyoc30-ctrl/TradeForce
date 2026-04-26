import { afterEach, describe, expect, it, vi } from "vitest";

import { invokeLLM, isLlmConfigured } from "./llm";

describe("invokeLLM", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPEN_API_KEY;
    delete process.env.OPENAI_KEY;
  });

  it("throws when no OpenAI key env vars are set", async () => {
    await expect(
      invokeLLM({
        system: "You are a bot",
        messages: [{ role: "user", content: "Hi" }],
      }),
    ).rejects.toThrow(/OPENAI_API_KEY/);
  });

  it("treats OPEN_API_KEY (typo) as configured for isLlmConfigured", () => {
    process.env.OPEN_API_KEY = "sk-test-fallback";
    expect(isLlmConfigured()).toBe(true);
  });
});
