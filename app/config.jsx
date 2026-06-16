/* ============================================================
   config.jsx — app config. Loaded first. No top-level consts
   (Babel standalone shares one global scope across scripts).
   ============================================================ */

window.APP_CONFIG = {
  /* Optional: raw Google OAuth Web Client ID (Google Identity Services).
     Only used if FIREBASE_CONFIG below is empty. Leave "" to skip. */
  GOOGLE_CLIENT_ID: "",
};

/* ---------- Firebase Auth ----------
   Paste your firebaseConfig from:
   Firebase console → Project settings → Your apps → Web app.
   Leave apiKey "" to disable Firebase (falls back to GIS / guest).
   Enable Google sign-in: Authentication → Sign-in method → Google. */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBi4_r6CdmBrXh2m1Y790cI67nTOKoyqJs",
  authDomain: "invoice-management-syste-9c4a8.firebaseapp.com",
  projectId: "invoice-management-syste-9c4a8",
  storageBucket: "invoice-management-syste-9c4a8.firebasestorage.app",
  messagingSenderId: "664767325519",
  appId: "1:664767325519:web:4c6474518cd8442210913a",
  measurementId: "G-X4L4N5L4MQ",
};

/* Supported invoice currencies */
window.CURRENCIES = [
  { code: "USD", label: "US Dollar", sym: "$" },
  { code: "EUR", label: "Euro", sym: "€" },
  { code: "GBP", label: "British Pound", sym: "£" },
  { code: "AUD", label: "Australian Dollar", sym: "A$" },
  { code: "CAD", label: "Canadian Dollar", sym: "C$" },
  { code: "SGD", label: "Singapore Dollar", sym: "S$" },
  { code: "AED", label: "UAE Dirham", sym: "د.إ" },
  { code: "INR", label: "Indian Rupee", sym: "₹" },
  { code: "BDT", label: "Bangladeshi Taka", sym: "৳" },
  { code: "JPY", label: "Japanese Yen", sym: "¥" },
];

/* Default payment methods seeded for a fresh account */
window.DEFAULT_PAYMENT_METHODS = ["Stripe", "Bank transfer", "PayPal", "Cash", "Wise"];
