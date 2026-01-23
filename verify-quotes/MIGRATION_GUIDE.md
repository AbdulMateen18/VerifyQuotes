# 🔄 Migration Guide: Hardcoded → MongoDB

## Current Status

Your app is currently using **hardcoded data** (10 quotes) and will continue to work as is.

## When to Migrate?

Migrate to MongoDB when you want:

- ✅ 400+ authenticated quotes
- ✅ Scalable database
- ✅ Better search performance
- ✅ Easy quote management

---

## Migration Steps

### **Step 1: Set Up MongoDB** (Choose One)

#### **Option A: MongoDB Atlas (Free Cloud)**

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up (no credit card needed)
3. Create a **FREE M0 Cluster**:
   - Cloud Provider: AWS/Google/Azure (any)
   - Region: Choose closest to you
   - Cluster Name: `VerifyQuotes` (or any name)
4. Wait 3-5 minutes for cluster creation
5. Click "Connect" → "Drivers" → "Node.js"
6. Copy connection string
7. Replace `<password>` with your password

#### **Option B: Local MongoDB**

1. Download: https://www.mongodb.com/try/download/community
2. Install MongoDB
3. Start service:
   - Windows: `net start MongoDB`
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

---

### **Step 2: Configure Environment**

Create `.env.local` in project root:

```env
# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=verifyquotes

# For Local MongoDB:
# MONGODB_URI=mongodb://localhost:27017
# MONGODB_DB=verifyquotes
```

---

### **Step 3: Collect Data**

Run the data collection pipeline:

```bash
# Scrape Hikmat from tehranloh.ir
npm run scrape

# Parse GitHub sermons/letters
npm run parse-github

# Import everything to MongoDB
npm run import-db
```

**OR** run all at once:

```bash
npm run setup-data
```

**What happens:**

1. `scrape` → Creates `data/scraped-hikmat.json` (100-500+ quotes)
2. `parse-github` → Creates `data/github-sermons-letters.json` (324 items)
3. `import-db` → Loads everything into MongoDB

---

### **Step 4: Switch API to MongoDB**

Replace the API route:

```bash
# In your project directory:
cd app/api/verify-quote

# Backup current route
mv route.js route-hardcoded.js

# Activate MongoDB version
mv route-v2.js route.js
```

**OR** manually:

1. Rename `app/api/verify-quote/route.js` → `route-hardcoded.js`
2. Rename `app/api/verify-quote/route-v2.js` → `route.js`

---

### **Step 5: Test the System**

```bash
# Restart dev server
npm run dev
```

Visit http://localhost:3000

**Test these queries:**

1. "Knowledge is better than wealth"
2. "Patience is to faith"
3. "صبر" (Arabic)
4. "علم" (Arabic)

**Expected behavior:**

- Footer shows: "Currently contains 400+ authenticated quotes"
- GET http://localhost:3000/api/verify-quote shows:
  ```json
  {
    "dataSource": "mongodb",
    "total": 450,
    "status": "connected"
  }
  ```

---

## Verification Checklist

- [ ] MongoDB is running
- [ ] `.env.local` is configured
- [ ] `npm run setup-data` completed successfully
- [ ] API route switched to MongoDB version
- [ ] Test search returns results
- [ ] Multiple languages work

---

## Rollback (If Needed)

If something goes wrong, revert to hardcoded data:

```bash
# Restore original API
cd app/api/verify-quote
mv route.js route-mongodb.js
mv route-hardcoded.js route.js

# Restart server
npm run dev
```

---

## Database Statistics

Check your MongoDB data:

```bash
# Option 1: MongoDB Shell
mongosh
use verifyquotes
db.quotes.countDocuments()
db.quotes.findOne()

# Option 2: MongoDB Compass (GUI)
# Download: https://www.mongodb.com/products/compass
# Connect with your MONGODB_URI
```

---

## Troubleshooting

### **"MongoDB not available" Error**

**Solution:** App auto-falls back to hardcoded data. Check:

- Is MongoDB running?
- Is `.env.local` correct?
- Connection string has password?

### **"No quotes found" After Import**

**Solution:**

```bash
# Check data files exist
ls data/

# Re-run import
npm run import-db

# Check MongoDB
mongosh
use verifyquotes
db.quotes.countDocuments()
```

### **Scraper Returns 0 Results**

**Solution:**

- Website might be down
- Try different URL
- Check internet connection
- Website structure may have changed (update scraper)

---

## Next Steps After Migration

### **1. Update UI Footer**

Edit `app/page.js`, find:

```javascript
<p>Currently contains 10 authenticated quotes • More quotes will be added</p>
```

Replace with:

```javascript
<p>
  Currently contains 400+ authenticated quotes from Nahj al-Balagha • More being
  added
</p>
```

### **2. Add Stats API Endpoint**

The new API includes stats at:

```
GET http://localhost:3000/api/verify-quote
```

Shows:

```json
{
  "dataSource": "mongodb",
  "total": 450,
  "byType": [
    { "_id": "hikmat", "count": 150 },
    { "_id": "sermon", "count": 245 },
    { "_id": "letter", "count": 79 }
  ]
}
```

### **3. Display Stats in UI**

Add this to your homepage:

```javascript
const [stats, setStats] = useState(null);

useEffect(() => {
  fetch("/api/verify-quote")
    .then((r) => r.json())
    .then(setStats);
}, []);

// Display: {stats?.total} quotes from {stats?.dataSource}
```

---

## MongoDB vs Hardcoded: Comparison

| Feature              | Hardcoded | MongoDB       |
| -------------------- | --------- | ------------- |
| **Quotes**           | 10        | 400-800+      |
| **Setup Time**       | 0 minutes | 10-20 minutes |
| **Search Speed**     | Fast      | Very Fast     |
| **Scalability**      | No        | Yes           |
| **Add Quotes**       | Edit code | Insert to DB  |
| **Languages**        | 3         | 4+            |
| **Production Ready** | No        | Yes           |

---

## Cost Considerations

| Option                   | Cost     | Storage   | Performance |
| ------------------------ | -------- | --------- | ----------- |
| **MongoDB Atlas Free**   | $0/month | 512MB     | Good        |
| **MongoDB Atlas Shared** | $9/month | 2-5GB     | Better      |
| **Local MongoDB**        | $0       | Unlimited | Best (dev)  |

**Recommendation:** Start with MongoDB Atlas Free tier. Upgrade if you hit 512MB limit.

---

## Security Checklist

Before deploying to production:

- [ ] Add `.env.local` to `.gitignore`
- [ ] Never commit MongoDB credentials
- [ ] Use environment variables in production
- [ ] Enable MongoDB network access rules
- [ ] Use strong passwords
- [ ] Enable MongoDB authentication
- [ ] Set up IP whitelist in Atlas
- [ ] Add rate limiting to API
- [ ] Implement API authentication

---

**You're now ready to scale! 🚀**

For any issues, refer back to IMPLEMENTATION_COMPLETE.md or check the code comments.
