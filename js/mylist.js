// =====================
// CINESWIPE — MY LIST
// Phase 6: Saved movies gallery
// Phase 7: Watched / Completed section
// =====================

const gallery           = document.getElementById('movieGallery');
const emptyState        = document.getElementById('emptyState');
const movieCount        = document.getElementById('movieCount');
const clearAllBtn       = document.getElementById('clearAllBtn');
const completedSection  = document.getElementById('completedSection');
const completedGallery  = document.getElementById('completedGallery');
const completedCount    = document.getElementById('completedCount');

// ── localStorage helpers ──────────────────────────────
function getSavedMovies() {
  return JSON.parse(localStorage.getItem('savedMovies') || '[]');
}

function removeSavedMovie(imdbId) {
  const updated = getSavedMovies().filter(m => m.imdbId !== imdbId);
  localStorage.setItem('savedMovies', JSON.stringify(updated));
}

function updateMovieField(imdbId, field, value) {
  const movies = getSavedMovies();
  const idx = movies.findIndex(m => m.imdbId === imdbId);
  if (idx !== -1) {
    movies[idx][field] = value;
    localStorage.setItem('savedMovies', JSON.stringify(movies));
  }
}

function clearAllMovies() {
  localStorage.removeItem('savedMovies');
}

// ── Count labels ──────────────────────────────────────
function updateCount(n) {
  movieCount.textContent = n === 1 ? '1 movie saved' : `${n} movies saved`;
}

function updateCompletedCount(n) {
  completedCount.textContent = n === 1 ? '1 movie' : `${n} movies`;
}

// ── Show / hide empty state ───────────────────────────
function showEmpty() {
  emptyState.hidden  = false;
  clearAllBtn.hidden = true;
  movieCount.textContent = '';
}

// ── Build an active gallery card ──────────────────────
function buildCard(movie) {
  const card = document.createElement('div');
  card.className = 'mylist-card';
  card.dataset.imdbId = movie.imdbId || '';

  const poster = movie.poster || 'img/card-placeholder.svg';

  card.innerHTML = `
    <img class="mylist-card__poster" src="${poster}" alt="${movie.title}"
         onerror="this.src='img/card-placeholder.svg'" />
    <div class="mylist-card__info">
      <p class="mylist-card__title">${movie.title}</p>
      <span class="mylist-card__year">${movie.year || ''}</span>
      <span class="mylist-card__rating"></span>
      <span class="mylist-card__genre"></span>
      <button class="mylist-card__watched-btn">✓ Mark as Watched</button>
    </div>
    <button class="mylist-card__remove" aria-label="Remove ${movie.title}">✕</button>
  `;

  // Remove button
  card.querySelector('.mylist-card__remove').addEventListener('click', () => {
    removeSavedMovie(movie.imdbId);
    card.remove();
    const unwatched = getSavedMovies().filter(m => !m.watched);
    if (!unwatched.length) {
      showEmpty();
    } else {
      updateCount(unwatched.length);
    }
  });

  // Mark as Watched button
  card.querySelector('.mylist-card__watched-btn').addEventListener('click', () => {
    updateMovieField(movie.imdbId, 'watched', true);
    card.remove();

    const unwatched = getSavedMovies().filter(m => !m.watched);
    if (!unwatched.length) {
      showEmpty();
    } else {
      updateCount(unwatched.length);
    }

    // Add to completed section
    const updated = getSavedMovies().find(m => m.imdbId === movie.imdbId);
    completedGallery.appendChild(buildCompletedCard(updated || { ...movie, watched: true }));

    const watched = getSavedMovies().filter(m => m.watched);
    updateCompletedCount(watched.length);
    completedSection.hidden = false;
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

// ── Build a completed card ────────────────────────────
function buildCompletedCard(movie) {
  const card = document.createElement('div');
  card.className = 'completed-card';
  card.dataset.imdbId = movie.imdbId || '';

  const poster  = movie.poster || 'img/card-placeholder.svg';
  const thumbs  = movie.thumbs  || null;
  const comment = movie.comment || '';

  card.innerHTML = `
    <img class="completed-card__poster" src="${poster}" alt="${movie.title}"
         onerror="this.src='img/card-placeholder.svg'" />
    <div class="completed-card__body">
      <p class="completed-card__title">${movie.title}</p>
      <span class="completed-card__year">${movie.year || ''}</span>
      <div class="completed-card__thumbs">
        <button class="completed-card__thumb completed-card__thumb--up ${thumbs === 'up' ? 'active' : ''}"
                aria-label="Thumbs up">👍</button>
        <button class="completed-card__thumb completed-card__thumb--down ${thumbs === 'down' ? 'active' : ''}"
                aria-label="Thumbs down">👎</button>
      </div>
      <textarea class="completed-card__comment" placeholder="Add a comment...">${comment}</textarea>
      <div class="completed-card__actions">
        <button class="completed-card__unwatch">↩ Move back to list</button>
        <button class="completed-card__remove">Remove</button>
      </div>
    </div>
  `;

  const thumbUpBtn   = card.querySelector('.completed-card__thumb--up');
  const thumbDownBtn = card.querySelector('.completed-card__thumb--down');

  // Thumbs up toggle
  thumbUpBtn.addEventListener('click', () => {
    const current   = getSavedMovies().find(m => m.imdbId === movie.imdbId);
    const newThumbs = current?.thumbs === 'up' ? null : 'up';
    updateMovieField(movie.imdbId, 'thumbs', newThumbs);
    thumbUpBtn.classList.toggle('active', newThumbs === 'up');
    thumbDownBtn.classList.remove('active');
  });

  // Thumbs down toggle
  thumbDownBtn.addEventListener('click', () => {
    const current   = getSavedMovies().find(m => m.imdbId === movie.imdbId);
    const newThumbs = current?.thumbs === 'down' ? null : 'down';
    updateMovieField(movie.imdbId, 'thumbs', newThumbs);
    thumbDownBtn.classList.toggle('active', newThumbs === 'down');
    thumbUpBtn.classList.remove('active');
  });

  // Comment — auto-save on input (debounced)
  const textarea = card.querySelector('.completed-card__comment');
  let commentTimer;
  textarea.addEventListener('input', () => {
    clearTimeout(commentTimer);
    commentTimer = setTimeout(() => {
      updateMovieField(movie.imdbId, 'comment', textarea.value);
    }, 500);
  });

  // Move back to active list
  card.querySelector('.completed-card__unwatch').addEventListener('click', () => {
    updateMovieField(movie.imdbId, 'watched', false);
    card.remove();

    const watched = getSavedMovies().filter(m => m.watched);
    if (!watched.length) {
      completedSection.hidden = true;
    } else {
      updateCompletedCount(watched.length);
    }

    const updated = getSavedMovies().find(m => m.imdbId === movie.imdbId);
    gallery.appendChild(buildCard(updated || movie));

    const unwatched = getSavedMovies().filter(m => !m.watched);
    emptyState.hidden  = true;
    clearAllBtn.hidden = false;
    updateCount(unwatched.length);
  });

  // Remove from list entirely
  card.querySelector('.completed-card__remove').addEventListener('click', () => {
    removeSavedMovie(movie.imdbId);
    card.remove();
    const watched = getSavedMovies().filter(m => m.watched);
    if (!watched.length) {
      completedSection.hidden = true;
    } else {
      updateCompletedCount(watched.length);
    }
  });

  return card;
}

// ── Render the full page ──────────────────────────────
function render() {
  let saved = [];
  try {
    saved = getSavedMovies();
    console.log('[CineSwipe] mylist loaded:', saved.length, 'movies', saved);
  } catch (err) {
    console.error('[CineSwipe] Failed to read localStorage:', err);
  }

  gallery.innerHTML          = '';
  completedGallery.innerHTML = '';

  const unwatched = saved.filter(m => !m.watched);
  const watched   = saved.filter(m =>  m.watched);

  // Unwatched gallery
  if (!unwatched.length) {
    showEmpty();
  } else {
    emptyState.hidden  = true;
    clearAllBtn.hidden = false;
    updateCount(unwatched.length);
    unwatched.forEach(movie => gallery.appendChild(buildCard(movie)));
  }

  // Completed section
  if (watched.length) {
    completedSection.hidden = false;
    updateCompletedCount(watched.length);
    watched.forEach(movie => completedGallery.appendChild(buildCompletedCard(movie)));
  } else {
    completedSection.hidden = true;
  }
}

// ── Clear all handler ─────────────────────────────────
clearAllBtn.addEventListener('click', () => {
  if (!confirm('Remove all movies from your list?')) return;
  clearAllMovies();
  gallery.innerHTML          = '';
  completedGallery.innerHTML = '';
  completedSection.hidden    = true;
  showEmpty();
});

// ── Init ──────────────────────────────────────────────
render();
