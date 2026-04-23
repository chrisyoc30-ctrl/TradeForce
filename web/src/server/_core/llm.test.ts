import { afterEach, describe, expect, it, vi } from "vitest";

import { invokeLLM } from "./llm";

describe("invokeLLM", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(
      invokeLLM({
        system: "You are a bot",
        messages: [{ role: "user", content: "Hi" }],
      }),
    ).rejects.toThrow(/OPENAI_API_KEY/);
  });
});
