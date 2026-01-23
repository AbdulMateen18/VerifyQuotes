import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyQuoteGeneric } from "@/lib/quote-matcher-v2";

// Try MongoDB, fall back to hardcoded data
let useMongoDb = false;
let getQuotesCollection, searchQuotes;

try {
  const mongodb = await import("@/lib/mongodb");
  getQuotesCollection = mongodb.getQuotesCollection;
  searchQuotes = mongodb.searchQuotes;
  useMongoDb = true;
} catch (error) {
  console.log("MongoDB not available, using hardcoded data");
  useMongoDb = false;
}

// Validation schema
const verifyQuoteSchema = z.object({
  quote: z
    .string()
    .min(5, "Quote must be at least 5 characters")
    .max(1000, "Quote too long"),
});

/**
 * Verify quote using MongoDB
 */
async function verifyWithMongoDB(quote) {
  const collection = await getQuotesCollection();

  // First try MongoDB full-text search
  const textResults = await collection
    .find({ $text: { $search: quote } }, { score: { $meta: "textScore" } })
    .sort({ score: { $meta: "textScore" } })
    .limit(50)
    .toArray();

  // If text search doesn't find enough, get random sample
  let allQuotes = textResults;
  if (textResults.length < 20) {
    const additionalQuotes = await collection.find({}).limit(100).toArray();
    allQuotes = [...textResults, ...additionalQuotes];
  }

  // Use fuzzy matching on results
  return verifyQuoteGeneric(quote, allQuotes);
}

/**
 * Verify quote using hardcoded data
 */
async function verifyWithHardcodedData(quote) {
  const { quotes } = await import("@/lib/quotes-data");
  return verifyQuoteGeneric(quote, quotes);
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = verifyQuoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors,
        },
        { status: 400 },
      );
    }

    const { quote } = validation.data;

    // Perform verification (MongoDB or hardcoded)
    const result = useMongoDb
      ? await verifyWithMongoDB(quote)
      : await verifyWithHardcodedData(quote);

    return NextResponse.json(
      {
        ...result,
        dataSource: useMongoDb ? "mongodb" : "hardcoded",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error verifying quote:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process quote verification",
      },
      { status: 500 },
    );
  }
}

// GET endpoint to retrieve stats
export async function GET() {
  try {
    if (useMongoDb) {
      const collection = await getQuotesCollection();
      const total = await collection.countDocuments();
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

      return NextResponse.json(
        {
          dataSource: "mongodb",
          total,
          byType: stats,
          status: "connected",
        },
        { status: 200 },
      );
    } else {
      const { quotes } = await import("@/lib/quotes-data");
      return NextResponse.json(
        {
          dataSource: "hardcoded",
          total: quotes.length,
          status: "using fallback data",
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
