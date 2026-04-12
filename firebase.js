import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, orderByChild, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Firebase config
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ให้ login ค้าง session
setPersistence(auth, browserLocalPersistence).catch(console.error);

/**
 * บันทึกคะแนน: เก็บแค่ high score ต่อคน (upsert)
 * key = base64(name) เพื่อหลีกเลี่ยง forbidden chars ใน Realtime DB path
 */
export const saveScore = async (name, role, score) => {
  // สร้าง safe key จากชื่อ
  const safeKey = btoa(unescape(encodeURIComponent(name)))
    .replace(/[.#$/[\]]/g, '_')
    .substring(0, 60);

  const playerRef = ref(db, 'Leaderboard/leaderboard/' + safeKey);

  try {
    // ดึงคะแนนเก่ามาเปรียบเทียบก่อน
    const snapshot = await get(playerRef);
    if (snapshot.exists()) {
      const existing = snapshot.val();
      if (score <= existing.score) return; // ไม่ได้ high score ใหม่ ไม่ต้อง update
    }

    await set(playerRef, {
      name,
      role: role || 'user',
      score,
      updatedAt: Date.now(),
    });
    console.log('Score saved:', name, score);
  } catch (error) {
    console.error('Error saving score:', error);
  }
};

/**
 * Subscribe real-time leaderboard (top 10 by score)
 * callback จะถูกเรียกทุกครั้งที่ข้อมูลเปลี่ยน
 * คืน unsubscribe function
 */
export const subscribeLeaderboard = (callback) => {
  const lbQuery = query(
    ref(db, 'Leaderboard/leaderboard'),
    orderByChild('score'),
    limitToLast(10)
  );

  const unsubscribe = onValue(lbQuery, (snapshot) => {
    const entries = [];
    snapshot.forEach((child) => {
      entries.push({ id: child.key, ...child.val() });
    });
    // Firebase orderByChild เรียงจากน้อยไปมาก → reverse
    entries.reverse();
    callback(entries);
  }, (error) => {
    console.error('Leaderboard subscription error:', error);
    callback([]);
  });

  return unsubscribe; // เรียกเพื่อ unsubscribe
};

export { auth, db };
