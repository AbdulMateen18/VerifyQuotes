import Fuse from "fuse.js";
import { compareTwoStrings } from "string-similarity";

/**
 * Normalize text for better matching
 */
export function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Search quotes using fuzzy matching (works with any data source)
 */
export function searchQuotesWithFuse(quotes, inputQuote, threshold = 0.3) {
  const normalizedInput = normalizeText(inputQuote);

  const fuse = new Fuse(quotes, {
    keys: [
      { name: "english", weight: 0.3 },
      { name: "urdu", weight: 0.2 },
      { name: "arabic", weight: 0.2 },
      { name: "persian", weight: 0.2 },
      { name: "content", weight: 0.1 },
    ],
    threshold: threshold,
    includeScore: true,
    minMatchCharLength: 3,
    ignoreLocation: true,
  });

  const fuzzyResults = fuse.search(inputQuote);

  const resultsWithScores = fuzzyResults.map((result) => {
    const quote = result.item;

    // Calculate similarity against all text versions
    const similarities = [];

    if (quote.english)
      similarities.push(
        compareTwoStrings(normalizedInput, normalizeText(quote.english)),
      );
    if (quote.urdu)
      similarities.push(
        compareTwoStrings(normalizedInput, normalizeText(quote.urdu)),
      );
    if (quote.arabic)
      similarities.push(
        compareTwoStrings(normalizedInput, normalizeText(quote.arabic)),
      );
    if (quote.persian)
      similarities.push(
        compareTwoStrings(normalizedInput, normalizeText(quote.persian)),
      );
    if (quote.content)
      similarities.push(
        compareTwoStrings(normalizedInput, normalizeText(quote.content)),
      );

    const maxSimilarity = Math.max(...similarities, 0);
    const fuseConfidence = 1 - result.score;
    const combinedConfidence = maxSimilarity * 0.6 + fuseConfidence * 0.4;

    return {
      quote,
      confidence: combinedConfidence,
      matchedLanguage: determineMatchedLanguage(
        quote,
        maxSimilarity,
        normalizedInput,
      ),
      similarity: {
        english: quote.english
          ? compareTwoStrings(normalizedInput, normalizeText(quote.english))
          : 0,
        urdu: quote.urdu
          ? compareTwoStrings(normalizedInput, normalizeText(quote.urdu))
          : 0,
        arabic: quote.arabic
          ? compareTwoStrings(normalizedInput, normalizeText(quote.arabic))
          : 0,
        persian: quote.persian
          ? compareTwoStrings(normalizedInput, normalizeText(quote.persian))
          : 0,
      },
    };
  });

  return resultsWithScores
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

/**
 * Determine which language had the best match
 */
function determineMatchedLanguage(quote, maxSimilarity, normalizedInput) {
  if (
    quote.english &&
    compareTwoStrings(normalizedInput, normalizeText(quote.english)) ===
      maxSimilarity
  ) {
    return "english";
  }
  if (
    quote.urdu &&
    compareTwoStrings(normalizedInput, normalizeText(quote.urdu)) ===
      maxSimilarity
  ) {
    return "urdu";
  }
  if (
    quote.arabic &&
    compareTwoStrings(normalizedInput, normalizeText(quote.arabic)) ===
      maxSimilarity
  ) {
    return "arabic";
  }
  if (
    quote.persian &&
    compareTwoStrings(normalizedInput, normalizeText(quote.persian)) ===
      maxSimilarity
  ) {
    return "persian";
  }
  return "english";
}

/**
 * Verify if a quote is authentic (generic version)
 */
export function verifyQuoteGeneric(inputQuote, quotes) {
  if (!inputQuote || inputQuote.trim().length < 5) {
    return {
      isAuthentic: false,
      confidence: 0,
      message: "Please provide a valid quote (minimum 5 characters)",
      matches: [],
    };
  }

  const matches = searchQuotesWithFuse(quotes, inputQuote);

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
    matches: matches.map((m) => formatMatch(m)),
  };
}

/**
 * Format match for API response
 */
function formatMatch(match) {
  const quote = match.quote;
  return {
    id: quote.id || quote._id,
    type: quote.type || "hikmat",
    arabic: quote.arabic || "",
    english: quote.english || "",
    urdu: quote.urdu || "",
    persian: quote.persian || "",
    title: quote.title || "",
    source: quote.source || "Unknown",
    category: quote.category || "general",
    confidence: match.confidence,
    matchedLanguage: match.matchedLanguage,
  };
}
