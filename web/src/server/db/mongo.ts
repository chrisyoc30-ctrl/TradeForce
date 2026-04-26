import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
  mongoDisabled?: boolean;
};

/**
 * Returns MongoDB database when MONGODB_URI is set; otherwise null (chat uses in-memory store).
 * Connection failures (bad URI, Atlas blocked, etc.) are caught so chat and other code never
 * hard-fail tRPC; callers see null and can degrade gracefully.
 */
export async function getMongoDb(): Promise<import("mongodb").Db | null> {
  if (!uri?.trim()) {
    return null;
  }
  if (globalForMongo.mongoDisabled) {
    return null;
  }

  if (!globalForMongo.mongoClient) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    try {
      await client.connect();
      globalForMongo.mongoClient = client;
    } catch (e) {
      globalForMongo.mongoDisabled = true;
      console.error(
        "[mongo] connection failed; disabled for this process. Chat uses in-memory store.",
        e,
      );
      try {
        await client.close();
      } catch {
        /* ignore */
      }
      return null;
    }
  }

  const dbName = process.env.MONGODB_DB_NAME ?? "tradescore";
  return globalForMongo.mongoClient.db(dbName);
}
