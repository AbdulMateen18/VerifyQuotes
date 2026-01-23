"use client";

import { useState } from "react";

export default function Home() {
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!quote.trim()) {
      setError("Please enter a quote");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/verify-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify quote");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.75) return "text-green-600";
    if (confidence >= 0.5) return "text-blue-600";
    if (confidence >= 0.3) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceBg = (confidence) => {
    if (confidence >= 0.75) return "bg-green-50 border-green-200";
    if (confidence >= 0.5) return "bg-blue-50 border-blue-200";
    if (confidence >= 0.3) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Verify Imam Ali (A.S) Quotes
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Check if a quote is authentically attributed to Maula Ali (A.S)
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Sources: Nahj al-Balagha & Ghurar al-Hikam
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleVerify}>
            <label
              htmlFor="quote"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3"
            >
              Enter Quote (English, Urdu, or Arabic)
            </label>
            <textarea
              id="quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="e.g., Knowledge is better than wealth"
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !quote.trim()}
              className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? "Verifying..." : "Verify Quote"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <div
              className={`p-6 rounded-2xl border-2 ${getConfidenceBg(result.confidence)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {result.isAuthentic
                      ? "✅ Likely Authentic"
                      : "❌ Not Verified"}
                  </h2>
                  <p className="text-gray-700 dark:text-gray-200">
                    {result.message}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    Confidence
                  </p>
                  <p
                    className={`text-3xl font-bold ${getConfidenceColor(result.confidence)}`}
                  >
                    {(result.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Matches */}
            {result.matches && result.matches.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  📚 Matching Quotes ({result.matches.length})
                </h3>
                <div className="space-y-4">
                  {result.matches.map((match, index) => (
                    <div
                      key={match.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-emerald-500"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                          Match #{index + 1}
                        </span>
                        <span
                          className={`text-sm font-bold ${getConfidenceColor(match.confidence)}`}
                        >
                          {(match.confidence * 100).toFixed(0)}% match
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            English
                          </p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {match.english}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Urdu
                          </p>
                          <p
                            className="text-gray-700 dark:text-gray-300 text-right"
                            dir="rtl"
                          >
                            {match.urdu}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Arabic
                          </p>
                          <p
                            className="text-gray-700 dark:text-gray-300 text-xl text-right"
                            dir="rtl"
                          >
                            {match.arabic}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">Source:</span>{" "}
                            {match.source}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Category: {match.category} • Matched:{" "}
                            {match.matchedLanguage}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Currently contains 10 authenticated quotes • More quotes will be
            added
          </p>
          <p className="mt-2">
            Built with Next.js • Fuzzy matching & semantic search
          </p>
        </div>
      </main>
    </div>
  );
}
