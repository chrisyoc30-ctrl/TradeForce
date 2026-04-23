import { randomBytes } from "crypto";

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { buildChatSystemPrompt } from "@/lib/chat-knowledge-base";
import { invokeLLM } from "@/server/_core/llm";
import { shouldEscalateFromRules } from "@/server/chat/chat-escalation";
import {
  loadRecentMessages,
  newConversationId,
  saveChatMessage,
} from "@/server/chat/chat-store";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const llmOutputSchema = z.object({
  reply: z.string(),
  escalate: z.boolean(),
  escalationReason: z.string().nullable().optional(),
  confidence: z.number().min(0).max(100).optional(),
  suggestedTopics: z.array(z.string()).max(6).optional(),
});

function parseLlmJson(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return llmOutputSchema.safeParse(parsed);
  } catch {
    return { success: false as const, error: new Error("invalid json") };
  }
}

function makeTicketId() {
  return `CHAT-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export const chatRouter = createTRPCRouter({
  sendMessage: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000).trim(),
        conversationId: z.string().min(8).max(80).optional(),
        userId: z.string().max(120).optional(),
        userRole: z.enum(["homeowner", "tradesman"]).optional(),
        pageContext: z.string().max(240).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const conversationId = input.conversationId ?? newConversationId();
      const recent = await loadRecentMessages(conversationId, 60);
      const historyTurns = recent.map((m) => ({
        role: (m.messageType === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

      const ruleHit = shouldEscalateFromRules(input.message, historyTurns);

      await saveChatMessage({
        conversationId,
        userId: input.userId,
        userRole: input.userRole,
        messageType: "user",
        content: input.message,
        timestamp: new Date(),
        pageContext: input.pageContext,
      });

      if (ruleHit.escalate) {
        const ticketId = makeTicketId();
        const text = `Thanks for reaching out — I’ve flagged this for our team (${(ruleHit.reason ?? "priority").replace(/_/g, " ")}).\n\nYour reference: **${ticketId}**. We aim to reply within 24 hours from **hello@tradescore.uk**. If you can add dates, screenshots, or the email on your account, that speeds things up.`;
        await saveChatMessage({
          conversationId,
          userId: input.userId,
          userRole: input.userRole,
          messageType: "assistant",
          content: text,
          timestamp: new Date(),
          escalated: true,
          escalationReason: ruleHit.reason,
        });
        return {
          response: text,
          escalated: true,
          escalationReason: ruleHit.reason,
          suggestedTopics: [] as string[],
          conversationId,
          ticketId,
          confidence: undefined as number | undefined,
        };
      }

      const system = buildChatSystemPrompt(input.userRole);
      const llmMessages = [
        ...historyTurns.slice(-10).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: input.message },
      ];

      let assistantText: string;
      let suggestedTopics: string[] = [];
      let modelEscalate = false;
      let modelReason: string | undefined;
      let confidence = 72;

      try {
        const raw = await invokeLLM({
          system,
          messages: llmMessages,
          jsonMode: true,
          temperature: 0.35,
          maxTokens: 900,
        });
        const parsed = parseLlmJson(raw);
        if (!parsed.success) {
          assistantText =
            "I couldn’t quite process that. Could you rephrase in one short question? You can also email **hello@tradescore.uk** and we’ll pick it up.";
          modelEscalate = true;
          modelReason = "llm_parse_error";
        } else {
          assistantText = parsed.data.reply;
          suggestedTopics = parsed.data.suggestedTopics ?? [];
          modelEscalate = parsed.data.escalate === true;
          modelReason = parsed.data.escalationReason ?? undefined;
          confidence = parsed.data.confidence ?? 72;
        }
      } catch (e) {
        console.error("[chat] LLM error", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            process.env.NODE_ENV === "development"
              ? e instanceof Error
                ? e.message
                : "LLM error"
              : "The assistant is temporarily unavailable. Please try again soon or email hello@tradescore.uk.",
        });
      }

      const lowConfidence = confidence < 60;
      const escalated = modelEscalate || lowConfidence;
      const escalationReason = escalated
        ? modelReason ?? (lowConfidence ? "low_confidence" : "model_escalation")
        : undefined;

      let finalText = assistantText;
      let ticketId: string | undefined;
      if (escalated) {
        ticketId = makeTicketId();
        finalText = `${assistantText}\n\n📋 I’ve queued this for our team — reference **${ticketId}**. We’ll follow up within 24 hours from **hello@tradescore.uk**.`;
      }

      await saveChatMessage({
        conversationId,
        userId: input.userId,
        userRole: input.userRole,
        messageType: "assistant",
        content: finalText,
        timestamp: new Date(),
        escalated,
        escalationReason,
      });

      return {
        response: finalText,
        escalated,
        escalationReason,
        suggestedTopics,
        conversationId,
        ticketId,
        confidence,
      };
    }),

  getHistory: publicProcedure
    .input(z.object({ conversationId: z.string().min(8).max(80) }))
    .query(async ({ input }) => {
      const rows = await loadRecentMessages(input.conversationId, 100);
      return rows.map((r, i) => ({
        id: `${r.timestamp.getTime()}-${i}-${r.messageType}`,
        type: r.messageType,
        content: r.content,
        timestamp: r.timestamp.toISOString(),
        escalated: r.escalated ?? false,
      }));
    }),
});
