import Fuse from "fuse.js";
import { compareTwoStrings } from "string-similarity";
import { quotes } from "./quotes-data";

/**
 * Normalize text for better matching
 * Removes extra spaces, punctuation, and converts to lowercase
 */
export function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Search quotes using fuzzy matching
 * Returns matches with confidence scores
 */
export function searchQuotes(inputQuote, threshold = 0.3) {
  const normalizedInput = normalizeText(inputQuote);

  // Configure Fuse.js for fuzzy search across multiple fields
  const fuse = new Fuse(quotes, {
    keys: [
      { name: "english", weight: 0.4 },
      { name: "urdu", weight: 0.3 },
      { name: "arabic", weight: 0.3 },
    ],
    threshold: threshold,
    includeScore: true,
    minMatchCharLength: 3,
    ignoreLocation: true,
  });

  // Perform fuzzy search
  const fuzzyResults = fuse.search(inputQuote);

  // Calculate string similarity for each result
  const resultsWithScores = fuzzyResults.map((result) => {
    const quote = result.item;

    // Calculate similarity against all text versions
    const englishSimilarity = compareTwoStrings(
      normalizedInput,
      normalizeText(quote.english),
    );
    const urduSimilarity = compareTwoStrings(
      normalizedInput,
      normalizeText(quote.urdu),
    );
    const arabicSimilarity = compareTwoStrings(
      normalizedInput,
      normalizeText(quote.arabic),
    );

    // Take the highest similarity score
    const maxSimilarity = Math.max(
      englishSimilarity,
      urduSimilarity,
      arabicSimilarity,
    );

    // Combine Fuse score (lower is better) with string similarity (higher is better)
    // Convert Fuse score to confidence (1 - score)
    const fuseConfidence = 1 - result.score;

    // Weighted average: 60% string similarity, 40% fuse confidence
    const combinedConfidence = maxSimilarity * 0.6 + fuseConfidence * 0.4;

    return {
      quote,
      confidence: combinedConfidence,
      matchedLanguage:
        maxSimilarity === englishSimilarity
          ? "english"
          : maxSimilarity === urduSimilarity
            ? "urdu"
            : "arabic",
      similarity: {
        english: englishSimilarity,
        urdu: urduSimilarity,
        arabic: arabicSimilarity,
      },
    };
  });

  // Sort by confidence (highest first)
  return resultsWithScores
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Return top 5 matches
}

/**
 * Verify if a quote is authentic
 * Returns verification result with confidence level
 */
export function verifyQuote(inputQuote) {
  if (!inputQuote || inputQuote.trim().length < 5) {
    return {
      isAuthentic: false,
      confidence: 0,
      message: "Please provide a valid quote (minimum 5 characters)",
      matches: [],
    };
  }

  const matches = searchQuotes(inputQuote);

  if (matches.length === 0) {
    return {
      isAuthentic: false,
      confidence: 0,
      message: "No matching quotes found in our database",
      matches: [],
    };
  }

  const topMatch = matches[0];
  const confidence = topMatch.confidence;

  // Confidence thresholds
  let isAuthentic = false;
  let message = "";

  if (confidence >= 0.75) {
    isAuthentic = true;
    message = "High confidence match! This quote is very likely authentic.";
  } else if (confidence >= 0.5) {
    isAuthentic = true;
    message = "Good match found. This quote appears to be authentic.";
  } else if (confidence >= 0.3) {
    isAuthentic = false;
    message =
      "Partial match found. The quote might be paraphrased or modified.";
  } else {
    isAuthentic = false;
    message =
      "Low confidence. This quote may not be authentic or is not in our database.";
  }

  return {
    isAuthentic,
    confidence,
    message,
    matches: matches.map((m) => ({
      id: m.quote.id,
      arabic: m.quote.arabic,
      english: m.quote.english,
      urdu: m.quote.urdu,
      source: m.quote.source,
      category: m.quote.category,
      confidence: m.confidence,
      matchedLanguage: m.matchedLanguage,
    })),
  };
}
