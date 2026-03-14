// =====================
// CINESWIPE — MY LIST
// Phase 6: Saved movies gallery
// =====================

const gallery     = document.getElementById('movieGallery');
const emptyState  = document.getElementById('emptyState');
const movieCount  = document.getElementById('movieCount');
const clearAllBtn = document.getElementById('clearAllBtn');

// ── localStorage helpers ──────────────────────────────
function getSavedMovies() {
  return JSON.parse(localStorage.getItem('savedMovies') || '[]');
}

function removeSavedMovie(imdbId) {
  const updated = getSavedMovies().filter(m => m.imdbId !== imdbId);
  localStorage.setItem('savedMovies', JSON.stringify(updated));
}

function clearAllMovies() {
  localStorage.removeItem('savedMovies');
}

// ── Update count label ────────────────────────────────
function updateCount(n) {
  movieCount.textContent = n === 1 ? '1 movie saved' : `${n} movies saved`;
}

// ── Build a gallery card ──────────────────────────────
function buildCard(movie) {
  const card = document.createElement('div');
  card.className = 'mylist-card';
  card.dataset.imdbId = movie.imdbId || '';

  const poster = movie.poster || 'img/card-placeholder.jpg';

  card.innerHTML = `
    <img class="mylist-card__poster" src="${poster}" alt="${movie.title}"
         onerror="this.src='img/card-placeholder.jpg'" />
    <div class="mylist-card__info">
      <p class="mylist-card__title">${movie.title}</p>
      <span class="mylist-card__year">${movie.year || ''}</span>
      <span class="mylist-card__rating"></span>
      <span class="mylist-card__genre"></span>
    </div>
    <button class="mylist-card__remove" aria-label="Remove ${movie.title}">✕</button>
  `;

  // Remove button
  card.querySelector('.mylist-card__remove').addEventListener('click', () => {
    removeSavedMovie(movie.imdbId);
    card.remove();

    const remaining = getSavedMovies().length;
    updateCount(remaining);
    if (!remaining) showEmpty();
  });

  // Fetch rating + genre in background
  if (movie.imdbId) {
    const ratingEl = card.querySelector('.mylist-card__rating');
    const genreEl  = card.querySelector('.mylist-card__genre');

    getMovieById(movie.imdbId)
      .then(detail => {
        const ratingVal = parseFloat(detail.rating);
        if (Number.isFinite(ratingVal) && ratingEl) {
          ratingEl.textContent = `★ ${ratingVal.toFixed(2)}`;
        }
        if (detail.genre && genreEl) {
          genreEl.textContent = detail.genre.split(',')[0].trim();
        }
      })
      .catch(() => {});
  }

  return card;
}

// ── Show empty state ──────────────────────────────────
function showEmpty() {
  emptyState.hidden  = false;
  clearAllBtn.hidden = true;
  movieCount.textContent = '';
}

// ── Render the gallery ────────────────────────────────
function render() {
  let saved = [];
  try {
    saved = getSavedMovies();
    console.log('[CineSwipe] mylist loaded:', saved.length, 'movies', saved);
  } catch (err) {
    console.error('[CineSwipe] Failed to read localStorage:', err);
  }

  gallery.innerHTML = '';

  if (!saved.length) {
    showEmpty();
    return;
  }

  emptyState.hidden  = true;
  clearAllBtn.hidden = false;
  updateCount(saved.length);

  saved.forEach(movie => gallery.appendChild(buildCard(movie)));
}

// ── Clear all handler ─────────────────────────────────
clearAllBtn.addEventListener('click', () => {
  if (!confirm('Remove all movies from your list?')) return;
  clearAllMovies();
  gallery.innerHTML = '';
  showEmpty();
});

// ── Init ──────────────────────────────────────────────
render();
