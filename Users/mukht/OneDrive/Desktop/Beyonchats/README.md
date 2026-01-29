# BeyondChats Article Management

## Phase 1: Scraping and CRUD APIs
- Backend: Node.js with Express and MongoDB
- Scrape 5 oldest articles from https://beyondchats.com/blogs/page/15/
- Store in MongoDB database
- CRUD APIs at /api/articles

## Phase 2: Article Updater Script
- Fetches articles from API
- Searches titles on Google, gets 2 relevant links
- Scrapes content from those links
- Uses LLM to rewrite original article in similar style
- Publishes new article via API with citations

To run: Set SERPAPI_KEY and OPENAI_API_KEY, then `node updater.js`

## Phase 3: React Frontend
- Displays articles from the API

## Setup
1. Install Node.js
2. In backend/: npm install, then npm start (connects to MongoDB Atlas)
3. In frontend/: npm install, then npm start
4. To scrape: POST to http://localhost:3000/api/scrape
5. To update: node updater.js (set API keys in env)

Note: Need SEARCHAPI_KEY and OPENAI_API_KEY for Phase 2