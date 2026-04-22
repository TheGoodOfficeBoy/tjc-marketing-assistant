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
export const saveScore = async (name, role, score, stage = "1-1") => {
  // สร้าง Key ที่ปลอดภัยสำหรับ Realtime Database
  const safeKey = encodeURIComponent(name)
    .replace(/[.#$\/\[\]%]/g, '_')
    .substring(0, 60);

  const playerRef = ref(rtdb, 'Leaderboard/leaderboard/' + safeKey);
  console.log('[TD] saveScore →', name, role, score, stage, '| key:', safeKey);

  try {
    const snapshot = await get(playerRef);
    // ตรวจสอบว่าถ้าเคยมีคะแนนอยู่แล้ว และคะแนนใหม่ไม่เยอะกว่าเดิม ให้ข้ามไปไม่ต้องเซฟทับ
    if (snapshot.exists() && snapshot.val().score >= score) {
      console.log('[TD] Not a new high score, skip. existing:', snapshot.val().score, 'new:', score);
      return;
    }
    
    // บันทึกคะแนนใหม่ + ด่านที่ผ่าน
    await set(playerRef, {
      name: name,
      role: role || 'user',
      score: score,
      stage: stage, 
      updatedAt: Date.now()
    });
    console.log('[TD] Score saved ✅', name, score, stage);
  } catch (err) {
    console.error('[TD] saveScore error:', err.code, err.message);
  }
};

/* ─── subscribeLeaderboard ───────────────────────────────────── */
export const subscribeLeaderboard = (callback) => {
  // ดึงข้อมูล 50 อันดับแรก เรียงตามคะแนน
  const lbRef = query(ref(rtdb, 'Leaderboard/leaderboard'), orderByChild('score'), limitToLast(50));
  
  onValue(lbRef, (snapshot) => {
    const entries = [];
    snapshot.forEach((childSnapshot) => {
      entries.push(childSnapshot.val());
    });
    
    // เรียงคะแนนจากมากไปน้อย (Firebase ส่งมาเป็นน้อยไปมาก)
    entries.reverse(); 
    callback(entries);
  }, (error) => {
    console.error("[TD] Leaderboard sync error:", error);
  });
};

export { auth, db, rtdb };
