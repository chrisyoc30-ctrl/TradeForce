import { randomBytes } from "crypto";

import { z } from "zod";

import { buildChatSystemPrompt } from "@/lib/chat-knowledge-base";
import { invokeLLM, isLlmConfigured } from "@/server/_core/llm";
import { shouldEscalateFromRules } from "@/server/chat/chat-escalation";
import { parseLlmJsonOutput } from "@/server/chat/llm-reply-json";
import type { ChatMessageDoc } from "@/server/chat/chat-store";
import {
  loadRecentMessages,
  newConversationId,
  saveChatMessage,
} from "@/server/chat/chat-store";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const LLM_USER_FACING_ERROR =
  "Sorry, I'm having trouble connecting right now. Please try again in a moment.";

function makeTicketId() {
  return `CHAT-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** Never let Mongo persistence take down the tRPC request. */
async function safeSaveChatMessage(doc: ChatMessageDoc): Promise<void> {
  try {
    await saveChatMessage(doc);
  } catch (e) {
    console.error("[chat] saveChatMessage failed (ignored for response)", e);
  }
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
      let recent: ChatMessageDoc[] = [];
      try {
        recent = await loadRecentMessages(conversationId, 60);
      } catch (e) {
        console.error("[chat] loadRecentMessages failed; continuing with empty history", e);
      }
      const historyTurns = recent.map((m) => ({
        role: (m.messageType === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

      const ruleHit = shouldEscalateFromRules(input.message, historyTurns);

      await safeSaveChatMessage({
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
        const text = `Thanks for reaching out — I’ve flagged this for our team (${(ruleHit.reason ?? "priority").replace(/_/g, " ")}).\n\nYour reference: **${ticketId}**. We aim to reply within 24 hours from **support@tradescore.uk**. If you can add dates, screenshots, or the email on your account, that speeds things up.`;
        await safeSaveChatMessage({
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

      if (!isLlmConfigured()) {
        const ticketId = makeTicketId();
        const text = `Thanks for your message. I can’t use our automated answers right now — the assistant isn’t fully configured on this server. Please email **support@tradescore.uk** and we’ll help you. Your reference: **${ticketId}** (include it in your email).`;
        await safeSaveChatMessage({
          conversationId,
          userId: input.userId,
          userRole: input.userRole,
          messageType: "assistant",
          content: text,
          timestamp: new Date(),
          escalated: true,
          escalationReason: "llm_unconfigured",
        });
        return {
          response: text,
          escalated: true,
          escalationReason: "llm_unconfigured",
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
        const parsed = parseLlmJsonOutput(raw);
        if (!parsed.success) {
          assistantText =
            "I couldn’t quite process that. Could you rephrase in one short question? You can also email **support@tradescore.uk** and we’ll pick it up.";
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
        assistantText = LLM_USER_FACING_ERROR;
        suggestedTopics = [];
        modelEscalate = false;
        modelReason = "llm_request_failed";
        // Keep confidence ≥ 60 so we do not add a false "low confidence" / ticket queue suffix for transient API errors
        confidence = 72;
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
        finalText = `${assistantText}\n\n📋 I’ve queued this for our team — reference **${ticketId}**. We’ll follow up within 24 hours from **support@tradescore.uk**.`;
      }

      await safeSaveChatMessage({
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
});
