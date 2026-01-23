import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

// URLs to scrape Nahj al-Balagha Hikmat (Sayings)
const HIKMAT_URLS = [
  "https://tehranloh.ir/%D8%AD%DA%A9%D9%85%D8%AA+%D9%87%D8%A7%DB%8C+%D9%86%D9%87%D8%AC+%D8%A7%D9%84%D8%A8%D9%84%D8%A7%D8%BA%D9%87",
  "https://tehranloh.ir/%d8%b4%d8%b1%d8%ad-%d8%ad%da%a9%d9%85%d8%aa-%d9%87%d8%a7%db%8c-%d9%86%d9%87%d8%ac-%d8%a7%d9%84%d8%a8%d9%84%d8%a7%d8%ba%d9%87/",
  "https://tehranloh.ir/%d8%ad%da%a9%d9%85%d8%aa-%d9%87%d8%a7%db%8c-%d9%86%d9%87%d8%ac-%d8%a7%d9%84%d8%a8%d9%84%d8%a7%d8%ba%d9%87-%d8%a8%d8%a7-%d8%aa%d8%b1%d8%ac%d9%85%d9%87-%d9%81%d8%a7%d8%b1%d8%b3%db%8c/",
];

/**
 * Extract hikmat (sayings) from a single URL
 */
async function scrapeHikmatFromUrl(url) {
  try {
    console.log(`Scraping: ${url}`);
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const hikmatList = [];

    // Pattern 1: <strong>Title</strong> followed by Arabic and Persian
    const pattern =
      /<strong>(.*?)<\/strong>\s*<\/span><\/p>\s*<p>(.*?)<\/p>\s*<p><span[^>]+>(.*?)<\/span>/gs;
    const matches = [...html.matchAll(pattern)];

    matches.forEach((match, index) => {
      const title = match[1].trim().replace(/<[^>]*>/g, "");
      const arabic = match[2].trim().replace(/<[^>]*>/g, "");
      const persian = match[3].trim().replace(/<[^>]*>/g, "");

      if (title && arabic && persian) {
        hikmatList.push({
          id: `hikmat_${Date.now()}_${index}`,
          title: cleanText(title),
          arabic: cleanText(arabic),
          persian: cleanText(persian),
          english: "", // Will be translated/added later
          urdu: "", // Will be translated/added later
          source: "Nahj al-Balagha",
          sourceUrl: url,
          category: "hikmat",
          authenticity: "high",
          scrapedAt: new Date().toISOString(),
        });
      }
    });

    console.log(`✓ Found ${hikmatList.length} hikmat from ${url}`);
    return hikmatList;
  } catch (error) {
    console.error(`✗ Error scraping ${url}:`, error.message);
    return [];
  }
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Main scraping function
 */
async function scrapeAllHikmat() {
  console.log("🚀 Starting Nahj al-Balagha Hikmat Scraper...\n");

  const allHikmat = [];

  for (const url of HIKMAT_URLS) {
    const hikmat = await scrapeHikmatFromUrl(url);
    allHikmat.push(...hikmat);

    // Be respectful - wait between requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Remove duplicates based on Arabic text
  const uniqueHikmat = Array.from(
    new Map(allHikmat.map((item) => [item.arabic, item])).values(),
  );

  console.log(`\n✓ Total unique hikmat scraped: ${uniqueHikmat.length}`);

  // Save to JSON file
  const outputPath = path.join(process.cwd(), "data", "scraped-hikmat.json");
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(uniqueHikmat, null, 2), "utf-8");
  console.log(`✓ Saved to: ${outputPath}`);

  return uniqueHikmat;
}

// Run scraper if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeAllHikmat()
    .then(() => {
      console.log("\n✅ Scraping completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Scraping failed:", error);
      process.exit(1);
    });
}

export { scrapeAllHikmat, scrapeHikmatFromUrl };
