import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
};

/**
 * Returns MongoDB database when MONGODB_URI is set; otherwise null (chat uses in-memory store).
 */
export async function getMongoDb(): Promise<import("mongodb").Db | null> {
  if (!uri?.trim()) {
    return null;
  }

  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    await globalForMongo.mongoClient.connect();
  }

  const dbName = process.env.MONGODB_DB_NAME ?? "tradescore";
  return globalForMongo.mongoClient.db(dbName);
}
