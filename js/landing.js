// =====================
// HAMBURGER MENU
// =====================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mainNav = document.getElementById('mainNav');

hamburgerBtn.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

// Close nav when a link is clicked (mobile)
mainNav.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('open');
  });
});

// =====================
// CAROUSEL ARROWS
// =====================
const carousels = document.querySelectorAll('.carousel');

carousels.forEach(carousel => {
  const track = carousel.querySelector('.carousel__track');
  const leftBtn = carousel.querySelector('.carousel__arrow--left');
  const rightBtn = carousel.querySelector('.carousel__arrow--right');
  const scrollAmount = 320;

  leftBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  rightBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
});
