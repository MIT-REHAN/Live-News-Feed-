const express = require('express');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Serve HTML, CSS, and JS files from this folder
app.use(express.static(__dirname));

// Allow requests from other ports (like Live Server port 5500)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Log every incoming request
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// A simple API route that fetches news from GNews API
app.get('/api/news', async (req, res) => {
  const category = req.query.category || 'general';
  const query = req.query.q || '';

  let url = '';
  if (query) {
    // GNews search endpoint
    url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&country=us&apikey=${API_KEY}`;
  } else {
    // GNews top headlines endpoint
    url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=us&apikey=${API_KEY}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong fetching the news' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
