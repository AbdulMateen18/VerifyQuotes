import { MongoClient } from "mongodb";

// MongoDB connection URI - update with your credentials
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const MONGODB_DB = process.env.MONGODB_DB || "verifyquotes";

let cachedClient = null;
let cachedDb = null;

/**
 * Connect to MongoDB
 */
export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

/**
 * Get quotes collection
 */
export async function getQuotesCollection() {
  const { db } = await connectToDatabase();
  return db.collection("quotes");
}

/**
 * Create indexes for better search performance
 */
export async function createIndexes() {
  const collection = await getQuotesCollection();

  // Text indexes for full-text search
  await collection.createIndex({
    english: "text",
    urdu: "text",
    arabic: "text",
    persian: "text",
  });

  // Regular indexes
  await collection.createIndex({ source: 1 });
  await collection.createIndex({ category: 1 });
  await collection.createIndex({ authenticity: 1 });
  await collection.createIndex({ type: 1 });

  console.log("✓ MongoDB indexes created");
}

/**
 * Insert quotes into MongoDB
 */
export async function insertQuotes(quotes) {
  const collection = await getQuotesCollection();

  if (quotes.length === 0) {
    console.log("No quotes to insert");
    return;
  }

  // Use bulkWrite for better performance
  const operations = quotes.map((quote) => ({
    updateOne: {
      filter: { id: quote.id },
      update: { $set: quote },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations);

  console.log(
    `✓ Inserted/Updated: ${result.upsertedCount + result.modifiedCount} quotes`,
  );
  return result;
}

/**
 * Search quotes (for API)
 */
export async function searchQuotes(query, limit = 10) {
  const collection = await getQuotesCollection();

  const results = await collection
    .find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .toArray();

  return results;
}

/**
 * Get all quotes (paginated)
 */
export async function getAllQuotes(page = 1, limit = 100) {
  const collection = await getQuotesCollection();
  const skip = (page - 1) * limit;

  const quotes = await collection.find({}).skip(skip).limit(limit).toArray();

  const total = await collection.countDocuments();

  return {
    quotes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get quote statistics
 */
export async function getQuoteStats() {
  const collection = await getQuotesCollection();

  const stats = await collection
    .aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const total = await collection.countDocuments();

  return {
    total,
    byType: stats,
  };
}
