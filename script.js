// Simple JavaScript to fetch news and display them on the page

// Elements from our HTML
const newsContainer = document.getElementById('newsContainer');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const loadingText = document.getElementById('loadingText');

// Active category (starts with general)
let currentCategory = 'general';

// Detect where the backend is running
// If we are on localhost/127.0.0.1, we direct API calls to the Express server running on port 3000.
// This makes Live Server (port 5500) work out of the box!
const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://localhost:3000' 
  : '';

// Function to fetch news from our simple backend server API (or direct GNews API fallback)
async function loadNews(category = 'general', searchQuery = '') {
  // Show loading text and clear old news
  loadingText.style.display = 'block';
  newsContainer.innerHTML = '';

  let useDirectGNews = false;
  let response;
  let data;

  try {
    // 1. Try to fetch from our Express backend server
    let url = `${BACKEND_URL}/api/news?category=${category}`;
    if (searchQuery) {
      url += `&q=${encodeURIComponent(searchQuery)}`;
    }

    response = await fetch(url);
    
    // If the request failed or returned HTML (like a 404 fallback page on static hosts),
    // we are likely running statically (e.g., GitHub Pages) without the Express backend.
    const contentType = response.headers.get('content-type');
    if (!response.ok || (contentType && contentType.includes('text/html'))) {
      throw new Error("Server not running or static host detected.");
    }
    
    data = await response.json();
  } catch (error) {
    // 2. Fallback: Request GNews directly if we are on a static host (GitHub Pages)
    useDirectGNews = true;
  }

  // If the backend isn't available, make a direct request to GNews
  if (useDirectGNews) {
    try {
      // Use default API key directly without prompting the user
      const apiKey = '3186fa41ef5db429efd02ff37e82965a';

      let url = '';
      if (searchQuery) {
        url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchQuery)}&lang=en&country=us&apikey=${apiKey}`;
      } else {
        url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=us&apikey=${apiKey}`;
      }

      response = await fetch(url);
      data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.errors ? data.errors.join(', ') : 'Failed to fetch news from GNews');
      }
    } catch (fallbackError) {
      loadingText.style.display = 'none';
      newsContainer.innerHTML = `
        <div class="col-span-full text-center py-12 text-red-600 bg-white p-6 rounded border border-red-200 shadow-sm max-w-md mx-auto mt-4">
          <p class="font-bold text-lg">Failed to load news.</p>
          <p class="text-sm mt-1">${fallbackError.message}</p>
        </div>
      `;
      return;
    }
  }

  // Hide loading text
  loadingText.style.display = 'none';

  // Check if we received articles
  if (data && data.articles && data.articles.length > 0) {
    displayArticles(data.articles);
  } else {
    newsContainer.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-600 font-semibold text-lg">No news articles found.</p>
        <p class="text-gray-500 text-sm mt-1">Try another search keyword or check other categories.</p>
      </div>
    `;
  }
}

// Function to show articles on the page
function displayArticles(articles) {
  articles.forEach((article) => {
    // Skip articles that have been removed or have no title
    if (article.title === '[Removed]' || !article.title) {
      return;
    }

    // Create a new card element
    const card = document.createElement('div');
    card.className = "bg-white p-5 border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between";

    // Set fallback values if data is missing
    const imageUrl = article.image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80';
    const title = article.title;
    const description = article.description || 'No description available. Click below to read the full story.';
    const sourceName = article.source ? article.source.name : 'News Source';
    const articleUrl = article.url || '#';
    const publishDate = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Today';

    // Set HTML content of the card
    card.innerHTML = `
      <div>
        <img src="${imageUrl}" class="w-full h-48 object-cover rounded mb-4 border border-gray-100" alt="News Image" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80'">
        <span class="text-red-700 font-bold text-xs uppercase tracking-widest">${sourceName}</span>
        <h2 class="font-serif-newspaper font-bold text-xl text-gray-900 mt-1 mb-2 hover:text-red-700 leading-tight">
          <a href="${articleUrl}" target="_blank" rel="noopener noreferrer">${title}</a>
        </h2>
        <p class="text-sm text-gray-700 leading-relaxed">${description}</p>
      </div>
      <div class="mt-5 border-t pt-3 flex justify-between items-center text-xs text-gray-500">
        <span>🗓️ ${publishDate}</span>
        <a href="${articleUrl}" target="_blank" rel="noopener noreferrer" class="text-red-700 font-bold hover:underline flex items-center gap-1">
          Read Story →
        </a>
      </div>
    `;

    newsContainer.appendChild(card);
  });
}

// Handle Search button click
searchButton.addEventListener('click', () => {
  const query = searchInput.value.trim();
  loadNews(currentCategory, query);
});

// Handle Enter key inside search box
searchInput.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    const query = searchInput.value.trim();
    loadNews(currentCategory, query);
  }
});

// Function to handle category selection
function selectCategory(categoryName, element) {
  currentCategory = categoryName;
  
  // Clear the search input box
  searchInput.value = '';

  // Remove the active border/font styles from all navigation links
  const buttons = document.querySelectorAll('.category-btn');
  buttons.forEach(btn => {
    btn.classList.remove('border-b-2', 'border-red-700', 'text-red-700', 'font-bold');
    btn.classList.add('text-gray-700');
  });

  // Add active styling to the clicked link
  element.classList.add('border-b-2', 'border-red-700', 'text-red-700', 'font-bold');
  element.classList.remove('text-gray-700');

  // Load the news for the chosen category
  loadNews(categoryName);
}

// Fetch news automatically on first page load
loadNews();
