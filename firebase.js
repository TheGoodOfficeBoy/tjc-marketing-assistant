import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, set, push, get } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAuYStMuXj-S9kItbQASZUKJ5NvhokpeVc",
  authDomain: "tjc-marketing-console.firebaseapp.com",
  projectId: "tjc-marketing-console",
  storageBucket: "tjc-marketing-console.firebasestorage.app",
  messagingSenderId: "896679016286",
  appId: "1:896679016286:web:599a88c1ad32943f1cc1cf",
  measurementId: "G-LK4CG6NJD0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);  // For Realtime Database

// ให้ login ค้าง session
setPersistence(auth, browserLocalPersistence).catch(console.error);

// ฟังก์ชันเพิ่มข้อมูลลงใน Firebase Realtime Database (push)
export const saveScore = (name, score) => {
  const leaderboardRef = ref(db, 'leaderboard/');  // สร้าง reference ไปที่ leaderboard
  const newScoreRef = push(leaderboardRef);  // ใช้ push() เพื่อเพิ่มข้อมูลใหม่
  set(newScoreRef, {
    name: name,  // ชื่อของผู้เล่น
    score: score,  // คะแนนของผู้เล่น
  }).then(() => {
    console.log('New score added successfully!');
  }).catch((error) => {
    console.error("Error adding new score: ", error);
  });
};

// ฟังก์ชันอัปเดตข้อมูลคะแนนผู้เล่น
export const updateScore = (playerId, name, score) => {
  const playerRef = ref(db, 'leaderboard/' + playerId);  // ใช้ ID ของผู้เล่นในการอัปเดตข้อมูล
  set(playerRef, {
    name: name,  // ชื่อของผู้เล่น
    score: score,  // คะแนนใหม่
  }).then(() => {
    console.log('Score updated successfully!');
  }).catch((error) => {
    console.error("Error updating score: ", error);
  });
};

// ฟังก์ชันดึงข้อมูล leaderboard จาก Firebase Realtime Database
export const getLeaderboard = async () => {
  const leaderboardRef = ref(db, 'leaderboard/');  // สร้าง reference ไปยัง leaderboard
  const snapshot = await get(leaderboardRef);  // ดึงข้อมูลจาก Firebase
  if (snapshot.exists()) {
    return snapshot.val();  // คืนค่าข้อมูล
  } else {
    console.log("No data available");
    return {};  // คืนค่าผลลัพธ์เป็น object ว่าง
  }
};
