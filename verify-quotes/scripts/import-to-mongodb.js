import fs from "fs";
import path from "path";
import {
  connectToDatabase,
  insertQuotes,
  createIndexes,
} from "../lib/mongodb.js";

/**
 * Import all data to MongoDB
 */
async function importAllData() {
  console.log("🚀 Starting MongoDB Data Import...\n");

  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log("✓ Connected to MongoDB\n");

    // Create indexes
    await createIndexes();
    console.log("");

    // Import scraped hikmat
    const hikmatPath = path.join(process.cwd(), "data", "scraped-hikmat.json");
    if (fs.existsSync(hikmatPath)) {
      console.log("📥 Importing scraped hikmat...");
      const hikmat = JSON.parse(fs.readFileSync(hikmatPath, "utf-8"));
      await insertQuotes(hikmat);
      console.log("");
    } else {
      console.log("⚠️  Scraped hikmat file not found. Run scraper first.\n");
    }

    // Import GitHub data
    const githubPath = path.join(
      process.cwd(),
      "data",
      "github-sermons-letters.json",
    );
    if (fs.existsSync(githubPath)) {
      console.log("📥 Importing GitHub sermons and letters...");
      const githubData = JSON.parse(fs.readFileSync(githubPath, "utf-8"));

      // Combine sermons and letters
      const allContent = [...githubData.sermons, ...githubData.letters];
      await insertQuotes(allContent);
      console.log("");
    } else {
      console.log("⚠️  GitHub data file not found. Run parser first.\n");
    }

    // Import existing hardcoded quotes
    console.log("📥 Importing existing hardcoded quotes...");
    const { quotes } = await import("../lib/quotes-data.js");
    await insertQuotes(quotes);

    console.log("\n✅ Data import completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  }
}

// Run import
importAllData();
