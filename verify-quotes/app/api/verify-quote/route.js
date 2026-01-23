import { NextResponse } from "next/server";
import { verifyQuote } from "@/lib/quote-matcher";
import { z } from "zod";

// Validation schema
const verifyQuoteSchema = z.object({
  quote: z
    .string()
    .min(5, "Quote must be at least 5 characters")
    .max(1000, "Quote too long"),
});

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

    // Perform verification
    const result = verifyQuote(quote);

    return NextResponse.json(result, { status: 200 });
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

// Optional: GET endpoint to retrieve all quotes
export async function GET() {
  try {
    const { quotes } = await import("@/lib/quotes-data");

    return NextResponse.json(
      {
        total: quotes.length,
        quotes: quotes,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 },
    );
  }
}
