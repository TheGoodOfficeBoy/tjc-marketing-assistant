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
const db   = getFirestore(app);
const rtdb = getDatabase(app);

setPersistence(auth, browserLocalPersistence).catch(console.error);

/* ─── saveScore ─────────────────────────────────────────────── */
export const saveScore = async (name, role, score) => {
  const safeKey = encodeURIComponent(name)
    .replace(/[.#$\/\[\]%]/g, '_')
    .substring(0, 60);

  const playerRef = ref(rtdb, 'Leaderboard/leaderboard/' + safeKey);
  console.log('[TD] saveScore →', name, role, score, '| key:', safeKey);

  try {
    const snapshot = await get(playerRef);
    if (snapshot.exists() && snapshot.val().score >= score) {
      console.log('[TD] Not a new high score, skip. existing:', snapshot.val().score, 'new:', score);
      return;
    }
    await set(playerRef, {
      name,
      role: role || 'user',
      score,
      updatedAt: Date.now()
    });
    console.log('[TD] Score saved ✅', name, score);
  } catch (err) {
    console.error('[TD] saveScore error:', err.code, err.message);
  }
};

/* ─── subscribeLeaderboard ───────────────────────────────────── */
// ในไฟล์ firebase.js
export async function saveScore(name, role, score, stage) { // <--- เพิ่มตัวแปร stage
  try {
    // โค้ดเดิมของคุณ (อาจจะเป็นการอ้างอิง User ID)
    const userId = name; // หรือ UID ของระบบคุณ
    
    // อัปเดตการบันทึกลง Realtime Database
    // ค้นหาคำสั่ง set() หรือ update() แล้วเติม stage: stage เข้าไป
    await set(ref(db, 'leaderboard/' + userId), {
      name: name,
      role: role,
      score: score,
      stage: stage, // <--- บรรทัดที่ต้องเพิ่มเข้าไปใน Database
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving score: ", error);
  }
}

export { auth, db, rtdb };
