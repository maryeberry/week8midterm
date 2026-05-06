// =====================
// HAMBURGER MENU
// =====================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mainNav = document.getElementById('mainNav');

hamburgerBtn.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

mainNav.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
  });
});

// =====================
// CAROUSEL ARROWS
// =====================
document.querySelectorAll('.carousel').forEach(carousel => {
  const track    = carousel.querySelector('.carousel__track');
  const leftBtn  = carousel.querySelector('.carousel__arrow--left');
  const rightBtn = carousel.querySelector('.carousel__arrow--right');

  leftBtn.addEventListener('click', () => {
    track.scrollBy({ left: -320, behavior: 'smooth' });
  });
  rightBtn.addEventListener('click', () => {
    track.scrollBy({ left: 320, behavior: 'smooth' });
  });
});

// =====================
// MOVIE CARD BUILDER
// =====================
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

// =====================
// LOAD A CAROUSEL
// Accepts an array of queries, fetches all in parallel, combines + deduplicates + shuffles
// =====================
async function loadCarousel(trackId, queries, label) {
  const track = document.getElementById(trackId);
  if (!track) return;

  track.innerHTML = Array(6).fill(`
    <div class="movie-card movie-card--skeleton">
      <div class="movie-card__poster movie-card__poster--skeleton"></div>
      <p class="movie-card__title movie-card__title--skeleton"></p>
      <span class="movie-card__tag movie-card__tag--skeleton"></span>
    </div>
  `).join('');

  try {
    const batches = await Promise.all(queries.map(q => searchMovies(q).catch(() => [])));
    const seen = new Set();
    const movies = shuffleArray(
      batches.flat().filter(m => {
        if (!m.imdbId || seen.has(m.imdbId)) return false;
        seen.add(m.imdbId);
        return true;
      })
    );
    if (!movies.length) {
      track.innerHTML = '<p class="carousel__empty">No results found.</p>';
      return;
    }
    track.innerHTML = '';
    movies.forEach(movie => track.appendChild(buildCard(movie, label)));
  } catch (err) {
    console.error(`Carousel "${trackId}" failed:`, err);
    track.innerHTML = '<p class="carousel__empty">Could not load movies. Please try again later.</p>';
  }
}

// =====================
// INIT ALL CAROUSELS
// =====================
const TRENDING_POOL = [
  'the', 'man', 'dark', 'last', 'black', 'dead', 'rise', 'shadow', 'blood', 'fire',
  'night', 'king', 'star', 'gold', 'lost', 'wild', 'red', 'iron', 'evil', 'storm',
  'city', 'end', 'cold', 'fear', 'run', 'fall', 'edge', 'blue', 'zero', 'one',
  'broken', 'deep', 'beyond', 'ghost', 'white', 'gone', 'truth', 'bad', 'dream', 'return'
];
const ACTION_POOL = [
  'mission', 'war', 'battle', 'operation', 'strike', 'agent', 'force', 'soldier',
  'combat', 'siege', 'fury', 'lethal', 'danger', 'target', 'commando', 'warrior',
  'fighter', 'hunter', 'revenge', 'rogue', 'assassin', 'mercenary', 'sniper',
  'ranger', 'raid', 'ambush', 'pursuit', 'outlaw', 'fugitive', 'threat',
  'breach', 'lockdown', 'patrol', 'recon', 'gunshot'
];
const ADVENTURE_POOL = [
  'quest', 'journey', 'island', 'treasure', 'expedition', 'voyage', 'sea', 'mountain',
  'jungle', 'lost', 'discover', 'horizon', 'trail', 'escape', 'survivor', 'wonder',
  'legend', 'ancient', 'atlas', 'passage', 'odyssey', 'nomad', 'pilgrim', 'safari',
  'canyon', 'river', 'cave', 'temple', 'relic', 'compass', 'explorer', 'guide',
  'frontier', 'wilderness', 'portal'
];

function pick2(arr) { return shuffleArray([...arr]).slice(0, 2); }

loadCarousel('trackTrending', pick2(TRENDING_POOL),  'Trending');
loadCarousel('trackAction',   pick2(ACTION_POOL),    'Action');
loadCarousel('trackStaff',    pick2(ADVENTURE_POOL), 'Adventure');
