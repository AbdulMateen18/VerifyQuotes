import axios from "axios";
import fs from "fs";
import path from "path";

// MonisBana's Nahj al-Balagha repository
const GITHUB_REPO = "MonisBana/Nahjul-Balagha";
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/main`;

/**
 * Fetch sermon/letter data from GitHub
 */
async function fetchGitHubMarkdown(type, id) {
  const url = `${GITHUB_RAW_BASE}/nahjul-balagha/${type}/${id}.md`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // File doesn't exist
    }
    throw error;
  }
}

/**
 * Parse markdown content to extract title and text
 */
function parseMarkdown(markdown) {
  const lines = markdown.split("\n");
  let title = "";
  let content = "";
  let inFrontMatter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === "---") {
      if (i === 0) {
        inFrontMatter = true;
        continue;
      } else if (inFrontMatter) {
        inFrontMatter = false;
        continue;
      }
    }

    if (inFrontMatter && line.startsWith("title:")) {
      title = line
        .replace("title:", "")
        .trim()
        .replace(/^["']|["']$/g, "");
      continue;
    }

    if (!inFrontMatter && line.trim()) {
      content += line + "\n";
    }
  }

  return {
    title: title.replace(/\*\*/g, "").trim(),
    content: content.trim(),
  };
}

/**
 * Fetch all sermons (1-251)
 */
async function fetchSermons() {
  console.log("📖 Fetching Sermons from GitHub...");
  const sermons = [];

  for (let i = 1; i <= 251; i++) {
    try {
      const markdown = await fetchGitHubMarkdown("sermons", i);
      if (markdown) {
        const parsed = parseMarkdown(markdown);
        sermons.push({
          id: `sermon_${i}`,
          number: i,
          type: "sermon",
          title: parsed.title,
          content: parsed.content,
          source: "Nahj al-Balagha",
          sourceRepo: GITHUB_REPO,
          authenticity: "high",
        });

        if (i % 10 === 0) {
          console.log(`  ✓ Fetched ${i} sermons...`);
        }
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ✗ Error fetching sermon ${i}:`, error.message);
    }
  }

  console.log(`✓ Total sermons fetched: ${sermons.length}\n`);
  return sermons;
}

/**
 * Fetch all letters (1-79)
 */
async function fetchLetters() {
  console.log("✉️  Fetching Letters from GitHub...");
  const letters = [];

  for (let i = 1; i <= 79; i++) {
    try {
      const markdown = await fetchGitHubMarkdown("letters", i);
      if (markdown) {
        const parsed = parseMarkdown(markdown);
        letters.push({
          id: `letter_${i}`,
          number: i,
          type: "letter",
          title: parsed.title,
          content: parsed.content,
          source: "Nahj al-Balagha",
          sourceRepo: GITHUB_REPO,
          authenticity: "high",
        });

        if (i % 10 === 0) {
          console.log(`  ✓ Fetched ${i} letters...`);
        }
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ✗ Error fetching letter ${i}:`, error.message);
    }
  }

  console.log(`✓ Total letters fetched: ${letters.length}\n`);
  return letters;
}

/**
 * Main function to fetch all GitHub data
 */
async function fetchAllGitHubData() {
  console.log("🚀 Starting GitHub Data Parser...\n");

  const sermons = await fetchSermons();
  const letters = await fetchLetters();

  const allData = {
    sermons,
    letters,
    metadata: {
      source: GITHUB_REPO,
      fetchedAt: new Date().toISOString(),
      totalSermons: sermons.length,
      totalLetters: letters.length,
    },
  };

  // Save to JSON file
  const outputPath = path.join(
    process.cwd(),
    "data",
    "github-sermons-letters.json",
  );
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), "utf-8");
  console.log(`✓ Saved to: ${outputPath}`);
  console.log(`\n✅ GitHub data parsing completed!`);

  return allData;
}

// Run parser if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllGitHubData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("\n❌ Parsing failed:", error);
      process.exit(1);
    });
}

export { fetchAllGitHubData, fetchSermons, fetchLetters };
