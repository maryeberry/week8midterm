// =====================
// CINESWIPE — GENRES PAGE
// Phase 5: Search + category carousels
// =====================

// ── Carousel arrow setup ──────────────────────────────
document.querySelectorAll('.carousel').forEach(carousel => {
  const track    = carousel.querySelector('.carousel__track');
  const leftBtn  = carousel.querySelector('.carousel__arrow--left');
  const rightBtn = carousel.querySelector('.carousel__arrow--right');

  leftBtn.addEventListener('click', () =>
    track.scrollBy({ left: -320, behavior: 'smooth' }));
  rightBtn.addEventListener('click', () =>
    track.scrollBy({ left: 320, behavior: 'smooth' }));
});

// ── Movie card builder ────────────────────────────────
function buildCard(movie, label) {
  const card = document.createElement('div');
  card.className = 'movie-card';

  const posterSrc = movie.poster || 'img/card-placeholder.svg';
  const tag       = label || 'Movie';
  const year      = movie.year ? ` (${movie.year})` : '';

  card.innerHTML = `
    <div class="movie-card__poster">
      <img src="${posterSrc}" alt="${movie.title}"
           onerror="this.src='img/card-placeholder.svg'" />
    </div>
    <p class="movie-card__title">${movie.title}${year}</p>
    <span class="movie-card__tag">${tag}</span>
  `;
  return card;
}

// ── Skeleton placeholders ─────────────────────────────
function showSkeletons(track, count = 6) {
  track.innerHTML = Array(count).fill(`
    <div class="movie-card movie-card--skeleton">
      <div class="movie-card__poster movie-card__poster--skeleton"></div>
      <p class="movie-card__title movie-card__title--skeleton"></p>
      <span class="movie-card__tag movie-card__tag--skeleton"></span>
    </div>
  `).join('');
}

// ── Load a standard carousel ──────────────────────────
async function loadCarousel(trackId, query, label) {
  const track = document.getElementById(trackId);
  if (!track) return;

  showSkeletons(track);

  try {
    const movies = await searchMovies(query);
    if (!movies.length) {
      track.innerHTML = '<p class="carousel__empty">No results found.</p>';
      return;
    }
    track.innerHTML = '';
    movies.forEach(m => track.appendChild(buildCard(m, label)));
  } catch (err) {
    console.error(`loadCarousel(${trackId}) failed:`, err);
    track.innerHTML = '<p class="carousel__empty">Could not load movies.</p>';
  }
}

// ── You Might Like — random category pick ────────────
const RANDOM_POOL = [
  'adventure', 'mystery', 'fantasy', 'crime', 'biography',
  'western', 'musical', 'documentary', 'superhero', 'spy'
];

async function loadYouMightLike(trackId) {
  const query = RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)];
  await loadCarousel(trackId, query, 'For You');
}

// ── New Releases — filter for 2025 / 2026 ────────────
async function loadNewReleases(trackId) {
  const track = document.getElementById(trackId);
  if (!track) return;

  showSkeletons(track);

  // Fetch from several queries and keep only 2025-2026 results
  const queries  = ['2025', '2026', 'new movie 2025', 'blockbuster', 'sequel', 'reboot', 'upcoming'];
  const seen     = new Set();
  const releases = [];

  try {
    for (const q of queries) {
      const movies = await searchMovies(q);
      movies.forEach(m => {
        const y = Number(m.year);
        if ((y === 2025 || y === 2026) && m.imdbId && !seen.has(m.imdbId)) {
          seen.add(m.imdbId);
          releases.push(m);
        }
      });
      if (releases.length >= 10) break; // enough results
    }

    if (!releases.length) {
      track.innerHTML = '<p class="carousel__empty">No new releases found.</p>';
      return;
    }

    track.innerHTML = '';
    releases.forEach(m => track.appendChild(buildCard(m, 'New')));
  } catch (err) {
    console.error('loadNewReleases failed:', err);
    track.innerHTML = '<p class="carousel__empty">Could not load new releases.</p>';
  }
}

// ── Search ────────────────────────────────────────────
const searchForm        = document.getElementById('searchForm');
const searchInput       = document.getElementById('searchInput');
const searchResults     = document.getElementById('searchResults');
const searchQueryLabel  = document.getElementById('searchQueryLabel');
const clearSearchBtn    = document.getElementById('clearSearch');
const genreCarousels    = document.getElementById('genreCarousels');
const trackResults      = document.getElementById('trackResults');
const chips             = document.querySelectorAll('.genre-chip');

async function runSearch(query) {
  const q = query.trim();
  if (!q) return;

  // Update UI
  searchInput.value       = q;
  searchQueryLabel.textContent = q;
  searchResults.hidden    = false;
  genreCarousels.hidden   = true;

  // Highlight chip only when a single genre matches exactly (text search)
  const activeChips = [...chips].filter(c => c.classList.contains('active'));
  if (!activeChips.length) {
    chips.forEach(c => {
      c.classList.toggle('active', c.dataset.genre === q.toLowerCase());
    });
  }

  showSkeletons(trackResults, 8);

  // Wire arrows for results carousel
  const resCarousel = document.getElementById('carouselResults');
  const resLeft  = resCarousel.querySelector('.carousel__arrow--left');
  const resRight = resCarousel.querySelector('.carousel__arrow--right');
  resLeft.onclick  = () => trackResults.scrollBy({ left: -320, behavior: 'smooth' });
  resRight.onclick = () => trackResults.scrollBy({ left: 320, behavior: 'smooth' });

  try {
    const movies = await searchMovies(q);
    if (!movies.length) {
      trackResults.innerHTML = `<p class="carousel__empty">No results for "${q}".</p>`;
      return;
    }
    trackResults.innerHTML = '';
    movies.forEach(m => trackResults.appendChild(buildCard(m, q)));
  } catch (err) {
    console.error('search failed:', err);
    trackResults.innerHTML = '<p class="carousel__empty">Search failed. Please try again.</p>';
  }
}

function clearSearch() {
  searchInput.value     = '';
  searchResults.hidden  = true;
  genreCarousels.hidden = false;
  chips.forEach(c => c.classList.remove('active'));
  searchInput.focus();
}

// Form submit
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  runSearch(searchInput.value);
});

// Genre chip click — toggle multi-select, then search combined genres
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chip.classList.toggle('active');

    const selected = [...chips]
      .filter(c => c.classList.contains('active'))
      .map(c => c.dataset.genre);

    if (selected.length) {
      searchInput.value = selected.join(' ');
      runSearch(selected.join(' '));
    } else {
      clearSearch();
    }
  });
});

// Clear button
clearSearchBtn.addEventListener('click', clearSearch);

// ── Init all carousels ────────────────────────────────
loadCarousel('trackAnimation', 'animation',   'Animation');
loadCarousel('trackRomance',   'love romance', 'Romance');
loadYouMightLike('trackMightLike');
loadNewReleases('trackNew');
