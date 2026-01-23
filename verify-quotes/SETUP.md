# VerifyQuotes - Imam Ali (A.S) Quote Verification System

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and configure MongoDB:

- **For Local MongoDB**: `MONGODB_URI=mongodb://localhost:27017`
- **For MongoDB Atlas**: Get connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### 3. Set Up Database

#### Option A: Automatic Setup (Recommended)

```bash
npm run setup-data
```

This will:

1. Scrape Hikmat/Sayings from tehranloh.ir
2. Parse Sermons/Letters from GitHub
3. Import everything to MongoDB

#### Option B: Manual Setup (Step by Step)

```bash
# Step 1: Scrape Hikmat
npm run scrape

# Step 2: Parse GitHub Data
npm run parse-github

# Step 3: Import to MongoDB
npm run import-db
```

### 4. Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## 📊 Data Sources

- **Hikmat (Sayings)**: Scraped from tehranloh.ir
- **Sermons & Letters**: MonisBana/Nahjul-Balagha GitHub repo
- **Initial Dataset**: 10 verified quotes (hardcoded)

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run scrape` - Scrape quotes from tehranloh.ir
- `npm run parse-github` - Parse GitHub repository data
- `npm run import-db` - Import all data to MongoDB
- `npm run setup-data` - Complete setup (all above steps)

## 📁 Project Structure

```
verify-quotes/
├── app/
│   ├── api/verify-quote/route.js  # Verification API
│   └── page.js                    # Main UI
├── lib/
│   ├── quotes-data.js             # Initial quotes
│   ├── quote-matcher.js           # Matching algorithm
│   └── mongodb.js                 # Database connection
├── scripts/
│   ├── scrape-tehranloh.js        # Web scraper
│   ├── parse-github-data.js       # GitHub parser
│   └── import-to-mongodb.js       # Data importer
└── data/
    ├── scraped-hikmat.json        # Scraped sayings
    └── github-sermons-letters.json # Parsed content
```

## 🔍 How It Works

1. **User enters quote** → API receives request
2. **Text normalization** → Remove punctuation, lowercase
3. **Fuzzy matching** → Fuse.js finds similar quotes
4. **Similarity scoring** → String similarity + fuzzy score
5. **MongoDB search** → Full-text search across all languages
6. **Results ranked** → Top 5 matches with confidence scores

## 🗄️ MongoDB Setup Options

### Option 1: Local MongoDB

1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use: `MONGODB_URI=mongodb://localhost:27017`

### Option 2: MongoDB Atlas (Cloud - Free)

1. Sign up: https://www.mongodb.com/cloud/atlas/register
2. Create free cluster
3. Get connection string
4. Update `.env.local`

## 📈 Future Enhancements

- [ ] Add Ghurar al-Hikam (11,000+ sayings)
- [ ] Semantic search with embeddings
- [ ] Translation API integration
- [ ] Admin panel for quote management
- [ ] User authentication
- [ ] Community verification system

## ⚠️ Important Notes

- Web scraping respects rate limits (2-second delays)
- Only scrape from trusted Islamic sources
- Verify authenticity before adding quotes
- MongoDB required for production deployment
