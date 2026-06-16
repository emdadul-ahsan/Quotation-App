/* ============================================================
   auth.jsx — login. Priority: Firebase Google > GIS Google > guest.
   Data is namespaced per account.id (Firebase uid / google sub / "guest").
   Uses React.* explicitly to avoid global-scope name clashes.
   ============================================================ */

const ACCT_KEY = "mydesk_account_v1";

function _firebaseReady() {
  const c = window.FIREBASE_CONFIG;
  return !!(c && c.apiKey && window.firebase && firebase.auth);
}
function _initFirebase() {
  if (!_firebaseReady()) return false;
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(window.FIREBASE_CONFIG);
      /* Analytics — optional, only if SDK loaded + measurementId present */
      if (firebase.analytics && window.FIREBASE_CONFIG.measurementId) {
        try { firebase.analytics(); } catch (e) {}
      }
    }
    return true;
  } catch (e) { console.warn("Firebase init failed", e); return false; }
}
function _acctFromFirebaseUser(u) {
  return { id: u.uid, name: u.displayName || u.email || "User", email: u.email || "", picture: u.photoURL || "", provider: "firebase" };
}

function _decodeJwt(token) {
  try {
    const p = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(escape(atob(p))));
  } catch (e) { return null; }
}

const AuthCtx = React.createContext(null);
function useAuth() { return React.useContext(AuthCtx); }

function AuthProvider({ children }) {
  const [account, setAccount] = React.useState(() => {
    try { const r = localStorage.getItem(ACCT_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  });

  const persist = React.useCallback((acct) => {
    try { acct ? localStorage.setItem(ACCT_KEY, JSON.stringify(acct)) : localStorage.removeItem(ACCT_KEY); } catch (e) {}
    setAccount(acct);
  }, []);

  /* Firebase session restore + live auth state */
  React.useEffect(() => {
    if (!_initFirebase()) return;
    const unsub = firebase.auth().onAuthStateChanged((u) => {
      if (u) persist(_acctFromFirebaseUser(u));
      // if u is null we leave guest/local accounts untouched
    });
    return () => unsub && unsub();
  }, [persist]);

  const signIn = persist;

  const signInFirebaseGoogle = React.useCallback(() => {
    if (!_initFirebase()) return Promise.reject(new Error("Firebase not configured"));
    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider)
      .then((res) => persist(_acctFromFirebaseUser(res.user)))
      .catch((e) => { console.warn("Google sign-in failed", e); throw e; });
  }, [persist]);

  const signOut = React.useCallback(() => {
    if (_firebaseReady()) { try { firebase.auth().signOut(); } catch (e) {} }
    if (window.google && google.accounts && google.accounts.id) { try { google.accounts.id.disableAutoSelect(); } catch (e) {} }
    persist(null);
  }, [persist]);

  const value = React.useMemo(() => ({ account, signIn, signInFirebaseGoogle, signOut }), [account, signIn, signInFirebaseGoogle, signOut]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

/* ---------- Login screen ---------- */
function LoginScreen() {
  const { signIn, signInFirebaseGoogle } = useAuth();
  const gisRef = React.useRef(null);
  const fb = !!(window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey);
  const gisClientId = !fb ? ((window.APP_CONFIG && window.APP_CONFIG.GOOGLE_CLIENT_ID) || "") : "";
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  /* GIS button only when Firebase is not configured */
  React.useEffect(() => {
    if (!gisClientId) return;
    let tries = 0;
    const init = () => {
      if (window.google && google.accounts && google.accounts.id) {
        google.accounts.id.initialize({
          client_id: gisClientId,
          callback: (resp) => {
            const p = _decodeJwt(resp.credential);
            if (p) signIn({ id: p.sub, name: p.name || p.email, email: p.email || "", picture: p.picture || "", provider: "google" });
          },
        });
        if (gisRef.current) google.accounts.id.renderButton(gisRef.current, { theme: "filled_black", size: "large", width: 320, shape: "pill", text: "continue_with" });
        return;
      }
      if (tries++ < 40) setTimeout(init, 150);
    };
    init();
  }, [gisClientId, signIn]);

  const google = () => {
    setErr(""); setBusy(true);
    signInFirebaseGoogle().catch((e) => setErr(e && e.code === "auth/popup-blocked" ? "Pop-up blocked — allow pop-ups and retry." : "Sign-in failed. Check Firebase config.")).finally(() => setBusy(false));
  };
  const guest = () => signIn({ id: "guest", name: "Guest", email: "guest@local", picture: "", provider: "guest" });

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="logo">M</div>
          <div className="name">MyDesk <span>· Invoicing</span></div>
        </div>
        <h1 className="auth-h">Welcome back</h1>
        <p className="auth-sub">Sign in to access your invoices, clients and projects. Data is scoped to your account.</p>

        {fb && (
          <button className="btn google-btn" onClick={google} disabled={busy}>
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3c-.4.4 6.5-4.8 6.5-14.8 0-1.3-.1-2.3-.4-3.5z"/></svg>
            {busy ? "Signing in…" : "Continue with Google"}
          </button>
        )}
        {!fb && gisClientId && <div className="auth-google" ref={gisRef} />}
        {!fb && !gisClientId && <div className="auth-note"><Icon name="sparkle" size={14} /> Google login not configured. Add <span className="mono">FIREBASE_CONFIG</span> in <span className="mono">config.jsx</span> to enable it.</div>}
        {err && <div className="auth-err">{err}</div>}

        <div className="auth-or"><span>or</span></div>

        <button className="btn violet auth-guest" onClick={guest}><Icon name="arrow" size={15} /> Continue as guest</button>
        <p className="auth-fine muted tiny">Guest data stays in this browser. Sign in with Google for an account-scoped workspace.</p>
      </div>
      <div className="auth-foot muted tiny">MyDesk · Invoicing — data persists per account in localStorage.</div>
    </div>
  );
}

window.AuthProvider = AuthProvider;
window.useAuth = useAuth;
window.LoginScreen = LoginScreen;
