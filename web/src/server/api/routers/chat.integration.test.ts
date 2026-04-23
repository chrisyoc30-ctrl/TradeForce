import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const invokeLLM = vi.hoisted(() => vi.fn());

vi.mock("@/server/_core/llm", () => ({
  invokeLLM: (...args: unknown[]) => invokeLLM(...args),
}));

vi.mock("@/server/chat/chat-store", () => ({
  newConversationId: () => "00000000-0000-4000-8000-0000000000aa",
  loadRecentMessages: vi.fn().mockResolvedValue([]),
  saveChatMessage: vi.fn().mockResolvedValue(undefined),
}));

describe("chat.sendMessage", () => {
  beforeEach(() => {
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
});
