// =====================
// CINESWIPE — AUTH
// Supabase Email/Password Authentication
// =====================

// ── Supabase config ───────────────────────────────────
// REPLACE these with your Supabase project values:
// Supabase Dashboard → Project Settings → API
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Username ↔ email helpers ──────────────────────────
function toEmail(username) {
  return `${username.trim().toLowerCase()}@cineswipe.app`;
}

function toUsername(email) {
  return email.replace('@cineswipe.app', '');
}

// ── DOM refs ──────────────────────────────────────────
const heroLoggedOut = document.getElementById('heroLoggedOut');
const heroLoginForm = document.getElementById('heroLoginForm');
const heroLoggedIn  = document.getElementById('heroLoggedIn');
const heroLoginBtn  = document.getElementById('heroLoginBtn');
const authUsername  = document.getElementById('authUsername');
const authPassword  = document.getElementById('authPassword');
const authError     = document.getElementById('authError');
const authSignInBtn = document.getElementById('authSignInBtn');
const authSignUpBtn = document.getElementById('authSignUpBtn');
const authCancelBtn = document.getElementById('authCancelBtn');
const heroWelcome   = document.getElementById('heroWelcome');
const heroLogoutBtn = document.getElementById('heroLogoutBtn');

// ── UI state ──────────────────────────────────────────
function showState(state) {
  heroLoggedOut.hidden = state !== 'out';
  heroLoginForm.hidden = state !== 'form';
  heroLoggedIn.hidden  = state !== 'in';
  authError.hidden     = true;
  if (state === 'form') {
    authUsername.value = '';
    authPassword.value = '';
    setTimeout(() => authUsername.focus(), 50);
  }
}

function showError(msg) {
  authError.textContent = msg;
  authError.hidden      = false;
}

// ── Auth state listener ───────────────────────────────
sb.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    heroWelcome.textContent = `Hi, ${toUsername(session.user.email)} 👋`;
    showState('in');
  } else {
    showState('out');
  }
});

// On page load, restore session if one exists
sb.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    heroWelcome.textContent = `Hi, ${toUsername(session.user.email)} 👋`;
    showState('in');
  }
});

// ── Log In button → show form ─────────────────────────
heroLoginBtn.addEventListener('click', () => showState('form'));

// ── Cancel ────────────────────────────────────────────
authCancelBtn.addEventListener('click', () => showState('out'));

// ── Sign In ───────────────────────────────────────────
authSignInBtn.addEventListener('click', async () => {
  const u = authUsername.value.trim();
  const p = authPassword.value;
  if (!u || !p) { showError('Please enter a username and password.'); return; }

  authSignInBtn.disabled = true;
  const { error } = await sb.auth.signInWithPassword({ email: toEmail(u), password: p });
  if (error) {
    console.error('[CineSwipe] Sign in error:', error.message);
    showError(friendlyError(error.message));
    authSignInBtn.disabled = false;
  }
});

// ── Sign Up ───────────────────────────────────────────
authSignUpBtn.addEventListener('click', async () => {
  const u = authUsername.value.trim();
  const p = authPassword.value;
  if (!u || !p) { showError('Please enter a username and password.'); return; }

  authSignUpBtn.disabled = true;
  const { error } = await sb.auth.signUp({ email: toEmail(u), password: p });
  if (error) {
    console.error('[CineSwipe] Sign up error:', error.message);
    showError(friendlyError(error.message));
    authSignUpBtn.disabled = false;
  }
});

// Allow pressing Enter to submit
authPassword.addEventListener('keydown', e => {
  if (e.key === 'Enter') authSignInBtn.click();
});

// ── Log Out ───────────────────────────────────────────
heroLogoutBtn.addEventListener('click', () => sb.auth.signOut());

// ── Friendly error messages ───────────────────────────
function friendlyError(msg) {
  const m = msg.toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials') || m.includes('user not found')) {
    return 'Incorrect username or password.';
  }
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'That username is already taken.';
  }
  if (m.includes('password') && m.includes('characters')) {
    return msg; // pass Supabase's own password length message through
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Try again later.';
  }
  return `Error: ${msg}`;
}
