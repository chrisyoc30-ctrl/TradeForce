import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const invokeLLM = vi.hoisted(() => vi.fn());

vi.mock("@/server/_core/llm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/_core/llm")>();
  return {
    ...actual,
    invokeLLM: (...args: unknown[]) => invokeLLM(...args),
  };
});

vi.mock("@/server/chat/chat-store", () => ({
  newConversationId: () => "00000000-0000-4000-8000-0000000000aa",
  loadRecentMessages: vi.fn().mockResolvedValue([]),
  saveChatMessage: vi.fn().mockResolvedValue(undefined),
}));

describe("chat.sendMessage", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test";
    invokeLLM.mockReset();
    invokeLLM.mockResolvedValue(
      JSON.stringify({
        reply: "Lead acceptance is £25 after your free first lead.",
        escalate: false,
        confidence: 90,
        suggestedTopics: ["Pricing", "FAQ"],
      }),
    );
  });

  it("returns model reply when rules do not escalate", async () => {
    const caller = appRouter.createCaller(await createTRPCContext());
    const out = await caller.chat.sendMessage({
      message: "How much does a lead cost?",
      userRole: "tradesman",
    });
    expect(out.escalated).toBe(false);
    expect(out.response).toContain("£25");
    expect(out.suggestedTopics.length).toBeGreaterThan(0);
    expect(invokeLLM).toHaveBeenCalledOnce();
  });

  it("skips LLM when refund rule matches", async () => {
    const caller = appRouter.createCaller(await createTRPCContext());
    const out = await caller.chat.sendMessage({
      message: "I want a full refund on my last payment",
    });
    expect(out.escalated).toBe(true);
    expect(out.ticketId).toMatch(/^CHAT-/);
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("returns a human-escalation reply when OPENAI_API_KEY is not set (no 500)", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPEN_API_KEY;
    delete process.env.OPENAI_KEY;
    const caller = appRouter.createCaller(await createTRPCContext());
    const out = await caller.chat.sendMessage({
      message: "What is the lead price?",
    });
    expect(out.escalated).toBe(true);
    expect(out.response).toContain("hello@tradescore.uk");
    expect(out.escalationReason).toBe("llm_unconfigured");
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("returns a graceful reply when the LLM request fails (no TRPC 500)", async () => {
    process.env.OPENAI_API_KEY = "test";
    invokeLLM.mockRejectedValue(new Error("429 rate limit"));
    const caller = appRouter.createCaller(await createTRPCContext());
    const out = await caller.chat.sendMessage({ message: "Hello" });
    expect(out.escalated).toBe(true);
    expect(out.response).toMatch(/trouble|rate limit|hello@tradescore/i);
    expect(out.escalationReason).toBe("llm_request_failed");
  });
});
