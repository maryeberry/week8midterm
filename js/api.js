// =====================
// FREE MOVIE DB — API MODULE
// Base: https://imdb.iamidiotareyoutoo.com
// No API key required.
// =====================

const API_BASE = 'https://imdb.iamidiotareyoutoo.com';

// ── Normalise raw API result ──────────────────────────
function normaliseMovie(raw) {
  return {
    imdbId: raw['#IMDB_ID']    || null,
    title:  raw['#TITLE']      || 'Unknown Title',
    year:   raw['#YEAR']       || null,
    poster: raw['#IMG_POSTER'] || null,
    rank:   raw['#RANK']       || null,
  };
}

// ── Fetch helpers ─────────────────────────────────────
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

// ── Public: search by query string ───────────────────
// searchMovies('inception')
async function searchMovies(query) {
  if (!query || !query.trim()) throw new Error('query is required');
  const data = await fetchJSON(`${API_BASE}/search?q=${encodeURIComponent(query.trim())}`);
  const results = Array.isArray(data?.description) ? data.description : [];
  return results.map(normaliseMovie);
}

// ── Public: get one movie by IMDb ID ─────────────────
// getMovieById('tt1375666')
async function getMovieById(imdbId) {
  if (!imdbId) throw new Error('imdbId is required');
  const data = await fetchJSON(`${API_BASE}/search?tt=${encodeURIComponent(imdbId)}`);
  const raw  = Array.isArray(data?.description) ? data.description[0] : data;

  // Genre lives in data.short.genre (string or array)
  let genre = null;
  if (data?.short?.genre) {
    genre = Array.isArray(data.short.genre)
      ? data.short.genre.join(', ')
      : data.short.genre;
  }

  // Rating lives in data.short.aggregateRating.ratingValue
  const rating = data?.short?.aggregateRating?.ratingValue ?? null;

  return { ...normaliseMovie(raw), genre, rating };
}

// ── Public: search with optional filters ─────────────
// Supported filters:
//   query  {string}  — keyword search (required if no imdbId)
//   year   {number}  — only keep results matching this year
//   minRating {number} — only keep results with rating >= this value
//   limit  {number}  — cap the number of results returned
//
// Example:
//   searchWithFilters({ query: 'batman', year: 2022, minRating: 7, limit: 5 })
async function searchWithFilters({ query, year, minRating, limit } = {}) {
  if (!query || !query.trim()) throw new Error('query is required');

  const data = await fetchJSON(`${API_BASE}/search?q=${encodeURIComponent(query.trim())}`);
  let results = Array.isArray(data?.description) ? data.description : [];

  // Apply year filter
  if (year) {
    results = results.filter(r => Number(r['#YEAR']) === Number(year));
  }

  // Apply minimum rating filter
  if (minRating) {
    results = results.filter(r => {
      const rating = parseFloat(r['#IMDB_IV']);
      return !isNaN(rating) && rating >= minRating;
    });
  }

  // Apply result limit
  if (limit && limit > 0) {
    results = results.slice(0, limit);
  }

  return results.map(normaliseMovie);
}
