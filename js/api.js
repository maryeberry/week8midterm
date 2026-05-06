// =====================
// OMDB API MODULE
// Base: https://www.omdbapi.com
// API key is loaded from js/config.js (gitignored)
// =====================

const API_BASE = 'https://www.omdbapi.com';

// ── Fetch helper ──────────────────────────────────────
async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  const data = await res.json();
  if (data.Response === 'False') throw new Error(data.Error || 'No results');
  return data;
}

// ── Normalise a search result item ───────────────────
function normaliseMovie(raw) {
  return {
    imdbId: raw.imdbID  || null,
    title:  raw.Title   || 'Unknown Title',
    year:   raw.Year    || null,
    poster: (raw.Poster && raw.Poster !== 'N/A') ? raw.Poster : null,
    rank:   null,
  };
}

// ── Fisher-Yates shuffle ──────────────────────────────
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Public: search by query string ───────────────────
// Randomly picks page 1 or 2 so results vary across loads.
// Falls back to page 1 if the higher page has no results.
async function searchMovies(query, { page } = {}) {
  if (!query || !query.trim()) throw new Error('query is required');
  const tryPage = page ?? (Math.floor(Math.random() * 10) + 1); // random page 1–10

  async function fetchPage(p) {
    const data = await fetchJSON(
      `${API_BASE}/?s=${encodeURIComponent(query.trim())}&type=movie&page=${p}&apikey=${OMDB_API_KEY}`
    );
    return shuffleArray((data.Search || []).map(normaliseMovie));
  }

  try {
    return await fetchPage(tryPage);
  } catch (err) {
    if (tryPage !== 1) return await fetchPage(1);
    throw err;
  }
}

// ── Public: get one movie by IMDb ID ─────────────────
// getMovieById('tt1375666')
async function getMovieById(imdbId) {
  if (!imdbId) throw new Error('imdbId is required');
  const data = await fetchJSON(
    `${API_BASE}/?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}`
  );

  const genre  = (data.Genre  && data.Genre  !== 'N/A') ? data.Genre  : null;
  const rating = (data.imdbRating && data.imdbRating !== 'N/A')
    ? parseFloat(data.imdbRating)
    : null;

  return { ...normaliseMovie(data), genre, rating };
}

// ── Public: search with optional filters ─────────────
async function searchWithFilters({ query, year, minRating, limit } = {}) {
  if (!query || !query.trim()) throw new Error('query is required');

  let results = await searchMovies(query);

  if (year) {
    results = results.filter(r => Number(r.year) === Number(year));
  }
  if (limit && limit > 0) {
    results = results.slice(0, limit);
  }

  return results;
}
