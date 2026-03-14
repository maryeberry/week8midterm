// =====================
// CINESWIPE — AUTH
// Firebase Email/Password Authentication
// =====================

// ── Firebase config ───────────────────────────────────
// REPLACE these values with your Firebase project's config
// (Firebase Console → Project Settings → Your apps → SDK setup)
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ── Username ↔ email helpers ──────────────────────────
// Firebase requires email format, so we map username → internal email
function toEmail(username) {
  return `${username.trim().toLowerCase()}@cineswipe.app`;
}

function toUsername(email) {
  return email.replace('@cineswipe.app', '');
}

// ── DOM refs ──────────────────────────────────────────
const heroLoggedOut  = document.getElementById('heroLoggedOut');
const heroLoginForm  = document.getElementById('heroLoginForm');
const heroLoggedIn   = document.getElementById('heroLoggedIn');
const heroLoginBtn   = document.getElementById('heroLoginBtn');
const authUsername   = document.getElementById('authUsername');
const authPassword   = document.getElementById('authPassword');
const authError      = document.getElementById('authError');
const authSignInBtn  = document.getElementById('authSignInBtn');
const authSignUpBtn  = document.getElementById('authSignUpBtn');
const authCancelBtn  = document.getElementById('authCancelBtn');
const heroWelcome    = document.getElementById('heroWelcome');
const heroLogoutBtn  = document.getElementById('heroLogoutBtn');

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

// ── Firebase auth state listener ──────────────────────
auth.onAuthStateChanged(user => {
  if (user) {
    heroWelcome.textContent = `Hi, ${toUsername(user.email)} 👋`;
    showState('in');
  } else {
    showState('out');
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
  try {
    await auth.signInWithEmailAndPassword(toEmail(u), p);
  } catch (err) {
    showError(friendlyError(err.code));
    authSignInBtn.disabled = false;
  }
});

// ── Sign Up ───────────────────────────────────────────
authSignUpBtn.addEventListener('click', async () => {
  const u = authUsername.value.trim();
  const p = authPassword.value;
  if (!u || !p) { showError('Please enter a username and password.'); return; }
  if (p.length < 6) { showError('Password must be at least 6 characters.'); return; }

  authSignUpBtn.disabled = true;
  try {
    await auth.createUserWithEmailAndPassword(toEmail(u), p);
  } catch (err) {
    showError(friendlyError(err.code));
    authSignUpBtn.disabled = false;
  }
});

// Allow pressing Enter to submit
authPassword.addEventListener('keydown', e => {
  if (e.key === 'Enter') authSignInBtn.click();
});

// ── Log Out ───────────────────────────────────────────
heroLogoutBtn.addEventListener('click', () => auth.signOut());

// ── Friendly error messages ───────────────────────────
function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Incorrect username or password.';
    case 'auth/email-already-in-use': return 'That username is already taken.';
    case 'auth/weak-password':        return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':    return 'Too many attempts. Try again later.';
    default:                          return 'Something went wrong. Please try again.';
  }
}
