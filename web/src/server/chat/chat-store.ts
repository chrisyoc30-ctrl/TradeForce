import { randomUUID } from "crypto";
import type { Collection } from "mongodb";

import { getMongoDb } from "@/server/db/mongo";

export type ChatMessageDoc = {
  conversationId: string;
  userId?: string;
  userRole?: "homeowner" | "tradesman";
  messageType: "user" | "assistant";
  content: string;
  timestamp: Date;
  escalated?: boolean;
  escalationReason?: string;
  pageContext?: string;
};

const COLLECTION = "chat_messages";
const memoryByConversation = new Map<string, ChatMessageDoc[]>();
let indexesEnsured = false;

async function getCollection(): Promise<Collection<ChatMessageDoc> | null> {
  const db = await getMongoDb();
  if (!db) return null;
  const coll = db.collection<ChatMessageDoc>(COLLECTION);
  if (!indexesEnsured) {
    indexesEnsured = true;
    await coll.createIndex({ conversationId: 1, timestamp: 1 }).catch(() => {});
    await coll.createIndex({ userId: 1, timestamp: -1 }).catch(() => {});
  }
  return coll;
}

export function newConversationId(): string {
  return randomUUID();
}

export async function saveChatMessage(doc: ChatMessageDoc): Promise<void> {
  const coll = await getCollection();
  if (coll) {
    await coll.insertOne(doc);
    return;
  }
  const list = memoryByConversation.get(doc.conversationId) ?? [];
  list.push(doc);
  memoryByConversation.set(doc.conversationId, list);
}

export async function loadRecentMessages(
  conversationId: string,
  limit: number,
): Promise<ChatMessageDoc[]> {
  const coll = await getCollection();
  if (coll) {
    return coll
      .find({ conversationId })
      .sort({ timestamp: 1 })
      .limit(limit)
      .toArray();
  }
  const list = memoryByConversation.get(conversationId) ?? [];
  return list.slice(-limit);
}
