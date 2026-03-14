// =====================
// CINESWIPE — EXPLORE
// Phase 3: Card UI
// Phase 4 will add drag/touch swipe
// =====================

const VISIBLE   = 3;    // cards shown in stack at once
const LOW_WATER = 4;    // refetch when deck drops below this

const QUERIES = ['thriller', 'adventure', 'comedy', 'drama', 'mystery'];
let queryIdx  = 0;

let deck = []; // movies not yet shown

// DOM
const cardStack   = document.getElementById('cardStack');
const stackLoading = document.getElementById('stackLoading');
const stackEmpty  = document.getElementById('stackEmpty');
const btnYes      = document.getElementById('btnYes');
const btnNo       = document.getElementById('btnNo');
const btnReload   = document.getElementById('btnReload');
const savedToast  = document.getElementById('savedToast');

// ── localStorage helpers ──────────────────────────────
function getSavedMovies() {
  return JSON.parse(localStorage.getItem('savedMovies') || '[]');
}

function saveMovie(movie) {
  const saved = getSavedMovies();
  if (!saved.find(m => m.imdbId === movie.imdbId)) {
    saved.push(movie);
    localStorage.setItem('savedMovies', JSON.stringify(saved));
  }
}

// ── Toast notification ────────────────────────────────
let toastTimer;
function showToast(msg) {
  savedToast.textContent = msg;
  savedToast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => savedToast.classList.remove('show'), 2200);
}

// ── Fetch a batch of movies ───────────────────────────
async function fetchMore() {
  const query = QUERIES[queryIdx++ % QUERIES.length];
  try {
    const movies = await searchMovies(query);
    const existingIds = new Set(deck.map(m => m.imdbId));
    const fresh = movies.filter(m => m.imdbId && !existingIds.has(m.imdbId));
    deck.push(...fresh);
  } catch (err) {
    console.error('fetchMore failed:', err);
  }
}

// ── Build one card element ────────────────────────────
function buildCard(movie) {
  const card = document.createElement('div');
  card.className = 'swipe-card';
  card._movie = movie;

  const poster = movie.poster || 'img/card-placeholder.jpg';
  const year   = movie.year   ? `<span class="swipe-card__year">${movie.year}</span>` : '';
  card.innerHTML = `
    <div class="swipe-card__stamp swipe-card__stamp--yes">YES</div>
    <div class="swipe-card__stamp swipe-card__stamp--no">NO</div>
    <img class="swipe-card__poster" src="${poster}" alt="${movie.title}"
         onerror="this.src='img/card-placeholder.jpg'" />
    <div class="swipe-card__info">
      <h3 class="swipe-card__title">${movie.title}</h3>
      <div class="swipe-card__meta">
        ${year}
        <span class="swipe-card__rating"></span>
      </div>
      <span class="swipe-card__genre"></span>
    </div>
  `;

  // Fetch rating + genre from detail endpoint in the background
  if (movie.imdbId) {
    const ratingEl = card.querySelector('.swipe-card__rating');
    const genreEl  = card.querySelector('.swipe-card__genre');
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

// ── Assign depth position to each active card ─────────
function updatePositions() {
  getActiveCards().forEach((card, i) => {
    card.dataset.pos = i < VISIBLE ? i : VISIBLE; // cap at VISIBLE so extras stay hidden
  });
}

function getActiveCards() {
  return [...cardStack.querySelectorAll('.swipe-card:not(.exit-right):not(.exit-left)')];
}

// ── Add a card to the back of the visual stack ────────
function addCardToBack(movie) {
  const card = buildCard(movie);
  cardStack.insertBefore(card, cardStack.firstChild); // insert before = lowest z-index
  updatePositions();
}

// ── Fill the visible stack from deck ─────────────────
function fillStack() {
  const active = getActiveCards().length;
  const needed = Math.min(VISIBLE, deck.length) - active;
  for (let i = 0; i < needed; i++) {
    addCardToBack(deck[active + i]);
  }
}

// ── Perform a swipe (direction: 'left' | 'right') ─────
function swipe(direction) {
  const activeCards = getActiveCards();
  if (!activeCards.length) return;

  const topCard = activeCards[activeCards.length - 1]; // last child = highest z-index
  const movie   = topCard._movie;

  // Show stamp briefly
  topCard.classList.add(direction === 'right' ? 'stamp-yes' : 'stamp-no');

  if (direction === 'right') {
    saveMovie(movie);
    showToast(`"${movie.title}" saved to My List!`);
  }

  // Short delay so stamp is visible before card flies out
  setTimeout(() => {
    topCard.classList.remove('stamp-yes', 'stamp-no');
    topCard.classList.add(direction === 'right' ? 'exit-right' : 'exit-left');
    topCard.addEventListener('transitionend', () => topCard.remove(), { once: true });

    // Remove movie from deck
    deck.shift();

    // Promote remaining cards forward
    updatePositions();

    // Add the next unseen movie to the back
    const shownCount = getActiveCards().length;
    if (deck.length > shownCount) {
      addCardToBack(deck[shownCount]);
    }

    // Show empty state if nothing left
    if (!deck.length && getActiveCards().length === 0) {
      stackEmpty.hidden = false;
      btnYes.disabled = true;
      btnNo.disabled  = true;
    }

    // Fetch more if running low
    if (deck.length < LOW_WATER) {
      fetchMore();
    }
  }, 160);
}

// ── Button handlers ───────────────────────────────────
btnYes.addEventListener('click', () => swipe('right'));
btnNo.addEventListener('click',  () => swipe('left'));

btnReload.addEventListener('click', async () => {
  stackEmpty.hidden = true;
  stackLoading.hidden = false;
  btnYes.disabled = false;
  btnNo.disabled  = false;
  await fetchMore();
  await fetchMore();
  stackLoading.hidden = true;
  fillStack();
});

// ── Init ──────────────────────────────────────────────
async function init() {
  // Load two query batches for a healthy starting deck
  await Promise.all([fetchMore(), fetchMore()]);

  stackLoading.hidden = true;

  if (!deck.length) {
    stackEmpty.hidden = false;
    return;
  }

  fillStack();
}

init();
