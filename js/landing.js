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

  const posterSrc = movie.poster || 'img/card-placeholder.jpg';
  const tag       = label || 'Movie';
  const year      = movie.year ? ` (${movie.year})` : '';

  card.innerHTML = `
    <div class="movie-card__poster">
      <img src="${posterSrc}" alt="${movie.title}"
           onerror="this.src='img/card-placeholder.jpg'" />
    </div>
    <p class="movie-card__title">${movie.title}${year}</p>
    <span class="movie-card__tag">${tag}</span>
  `;
  return card;
}

// =====================
// LOAD A CAROUSEL
// =====================
async function loadCarousel(trackId, query, label) {
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
    const movies = await searchMovies(query);
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
loadCarousel('trackTrending', 'night',    'Trending');
loadCarousel('trackAction',   'warrior',  'Action');
loadCarousel('trackStaff',    'journey',  'Adventure');
