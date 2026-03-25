// =====================
// CINESWIPE — EXPLORE
// Phase 3: Card UI
// Phase 4: Swipe mechanics
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
  try {
    console.log('[CineSwipe] Saving movie:', movie);
    const saved = getSavedMovies();
    if (!saved.find(m => m.imdbId === movie.imdbId)) {
      saved.push(movie);
      localStorage.setItem('savedMovies', JSON.stringify(saved));
      console.log('[CineSwipe] Saved. Total saved:', saved.length);
    } else {
      console.log('[CineSwipe] Movie already in list, skipping.');
    }
  } catch (err) {
    console.error('[CineSwipe] saveMovie failed:', err);
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

  const poster = movie.poster || 'img/card-placeholder.svg';
  const year   = movie.year   ? `<span class="swipe-card__year">${movie.year}</span>` : '';
  card.innerHTML = `
    <div class="swipe-card__stamp swipe-card__stamp--yes">YES</div>
    <div class="swipe-card__stamp swipe-card__stamp--no">NO</div>
    <img class="swipe-card__poster" src="${poster}" alt="${movie.title}"
         onerror="this.src='img/card-placeholder.svg'" />
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

  attachDragEvents(card);
  return card;
}

// ── Assign depth position to each active card ─────────
function updatePositions() {
  getActiveCards().forEach((card, i) => {
    card.dataset.pos = i < VISIBLE ? i : VISIBLE; // cap at VISIBLE so extras stay hidden
  });
}

function getActiveCards() {
  return [...cardStack.querySelectorAll('.swipe-card:not(.exit-right):not(.exit-left):not(.is-exiting)')];
}

// ── Add a card to the back of the visual stack ────────
function addCardToBack(movie) {
  const card = buildCard(movie);
  cardStack.appendChild(card); // append to end = lowest z-index (back of stack)
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
  if (dragState) return;                    // block during gesture
  const activeCards = getActiveCards();
  if (!activeCards.length) return;

  const topCard = activeCards[0]; // first child = highest z-index (data-pos="0")
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

// ── Keyboard shortcuts (n = yes, b = no) ──────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'n') swipe('right');
  if (e.key === 'b') swipe('left');
});

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

// =====================
// PHASE 4 — SWIPE MECHANICS
// =====================

const SWIPE_THRESHOLD = 100; // px needed to complete a swipe
const ROTATION_FACTOR = 0.08; // degrees per px of drag
const STAMP_THRESHOLD = 30;  // px before YES/NO stamp appears

let dragState = null;
// dragState = { card, startX, startY, currentX }

// ── Helpers ───────────────────────────────────────────
function getTopCard() {
  const active = getActiveCards();
  return active.length ? active[0] : null; // first child = data-pos="0" = top card
}

// ── Drag start ────────────────────────────────────────
function onDragStart(card, x, y) {
  if (card.classList.contains('is-exiting')) return;
  if (card !== getTopCard()) return; // only the top card is draggable

  dragState = { card, startX: x, startY: y, currentX: x };
  card.style.transition = 'none';
  document.body.classList.add('is-dragging');
}

// ── Drag move ─────────────────────────────────────────
function onDragMove(x, y) {
  if (!dragState) return;

  const dx = x - dragState.startX;
  dragState.currentX = x;

  dragState.card.style.transform =
    `translateX(${dx}px) rotate(${dx * ROTATION_FACTOR}deg)`;

  // Show directional stamp
  if (dx > STAMP_THRESHOLD) {
    dragState.card.classList.add('stamp-yes');
    dragState.card.classList.remove('stamp-no');
  } else if (dx < -STAMP_THRESHOLD) {
    dragState.card.classList.add('stamp-no');
    dragState.card.classList.remove('stamp-yes');
  } else {
    dragState.card.classList.remove('stamp-yes', 'stamp-no');
  }
}

// ── Drag end ──────────────────────────────────────────
function onDragEnd() {
  if (!dragState) return;

  const { card, startX, currentX } = dragState;
  const dx = currentX - startX;
  dragState = null;

  document.body.classList.remove('is-dragging');
  card.classList.remove('stamp-yes', 'stamp-no');

  if (Math.abs(dx) >= SWIPE_THRESHOLD) {
    gestureSwipe(card, dx > 0 ? 'right' : 'left');
  } else {
    // Snap back to center
    card.style.transition =
      'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    card.style.transform = '';
    setTimeout(() => { card.style.transition = ''; }, 400);
  }
}

// ── Complete a gesture swipe ──────────────────────────
function gestureSwipe(card, direction) {
  const movie = card._movie;
  card.classList.add('is-exiting');

  if (direction === 'right') {
    saveMovie(movie);
    showToast(`"${movie.title}" saved to My List!`);
  }

  // Animate from current drag position to off-screen
  card.style.transition =
    'transform 0.42s cubic-bezier(0.55, 0, 1, 0.45), opacity 0.42s ease';
  card.style.transform = direction === 'right'
    ? 'translateX(160%) rotate(25deg)'
    : 'translateX(-160%) rotate(-25deg)';
  card.style.opacity = '0';

  card.addEventListener('transitionend', () => card.remove(), { once: true });

  deck.shift();
  updatePositions();

  const shownCount = getActiveCards().length;
  if (deck.length > shownCount) {
    addCardToBack(deck[shownCount]);
  }

  if (!deck.length && !getActiveCards().length) {
    stackEmpty.hidden = false;
    btnYes.disabled = true;
    btnNo.disabled  = true;
  }

  if (deck.length < LOW_WATER) fetchMore();
}

// ── Attach drag listeners to a card ──────────────────
function attachDragEvents(card) {
  // Mouse
  card.addEventListener('mousedown', e => {
    e.preventDefault();
    onDragStart(card, e.clientX, e.clientY);
  });

  // Touch
  card.addEventListener('touchstart', e => {
    const t = e.touches[0];
    onDragStart(card, t.clientX, t.clientY);
  }, { passive: true });
}

// ── Global move / end listeners ───────────────────────
document.addEventListener('mousemove', e => {
  if (dragState) onDragMove(e.clientX, e.clientY);
});

document.addEventListener('mouseup', () => {
  if (dragState) onDragEnd();
});

// passive: false so we can preventDefault and block page scroll during horizontal swipe
document.addEventListener('touchmove', e => {
  if (!dragState) return;
  const t = e.touches[0];
  const dx = Math.abs(t.clientX - dragState.startX);
  const dy = Math.abs(t.clientY - dragState.startY);
  if (dx > dy) e.preventDefault(); // suppress vertical scroll while swiping
  onDragMove(t.clientX, t.clientY);
}, { passive: false });

document.addEventListener('touchend', () => {
  if (dragState) onDragEnd();
});

init();
