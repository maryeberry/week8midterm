// =====================
// FREE MOVIE DB — API MODULE
// Base: https://imdb.iamidiotareyoutoo.com
// No API key required.
// =====================

const API_BASE = 'https://imdb.iamidiotareyoutoo.com';

function normaliseMovie(raw) {
  return {
    imdbId:  raw['#IMDB_ID'] || null,
    title:   raw['#TITLE']   || 'Unknown Title',
    year:    raw['#YEAR']    || null,
    genre:   raw['#GENRE']   || null,
    poster:  raw['#IMG_POSTER'] || null,
    rating:  raw['#IMDB_IV'] || null,
  };
}

async function searchMovies(query) {
  const url = `${API_BASE}/search?q=${encodeURIComponent(query.trim())}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  const results = Array.isArray(data?.description) ? data.description : [];
  return results.map(normaliseMovie);
}
