import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getDatabase, ref, set, get, onValue, orderByChild, query, limitToLast
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuYStMuXj-S9kItbQASZUKJ5NvhokpeVc",
  authDomain: "tjc-marketing-console.firebaseapp.com",
  projectId: "tjc-marketing-console",
  storageBucket: "tjc-marketing-console.firebasestorage.app",
  messagingSenderId: "896679016286",
  appId: "1:896679016286:web:599a88c1ad32943f1cc1cf",
  measurementId: "G-LK4CG6NJD0",
  databaseURL: "https://tjc-marketing-console-default-rtdb.firebaseio.com"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);   // Firestore → app-page.js
const rtdb = getDatabase(app);    // Realtime DB → leaderboard

setPersistence(auth, browserLocalPersistence).catch(console.error);

/* ─── saveScore: upsert high score ─────────────────────────── */
export const saveScore = async (name, role, score) => {
  const safeKey = btoa(unescape(encodeURIComponent(name)))
    .replace(/[.#$\/\[\]]/g, '_')
    .substring(0, 60);

  const playerRef = ref(rtdb, 'Leaderboard/leaderboard/' + safeKey);
  console.log('[TD] saveScore →', name, role, score, '| key:', safeKey);

  try {
    const snapshot = await get(playerRef);
    if (snapshot.exists() && snapshot.val().score >= score) {
      console.log('[TD] Not a new high score, skip.');
      return;
    }
    await set(playerRef, { name, role: role || 'user', score, updatedAt: Date.now() });
    console.log('[TD] Score saved ✅');
  } catch (err) {
    console.error('[TD] saveScore error:', err.code, err.message);
  }
};

/* ─── subscribeLeaderboard: real-time top 10 ───────────────── */
export const subscribeLeaderboard = (callback) => {
  const lbQuery = query(
    ref(rtdb, 'Leaderboard/leaderboard'),
    orderByChild('score'),
    limitToLast(10)
  );

  console.log('[TD] subscribeLeaderboard start');

  return onValue(lbQuery, (snapshot) => {
    console.log('[TD] onValue fired, exists:', snapshot.exists());
    const entries = [];
    snapshot.forEach((child) => entries.push({ id: child.key, ...child.val() }));
    entries.reverse();
    callback(entries);
  }, (err) => {
    console.error('[TD] subscribeLeaderboard error:', err.code, err.message);
    callback([]);
  });
};

export { auth, db, rtdb };
