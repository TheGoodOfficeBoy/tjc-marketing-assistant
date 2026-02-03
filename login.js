import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

async function ensureUserProfile(user, usernameGuess){
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref, {
      username: usernameGuess || (user.email || "").split("@")[0],
      email: user.email || "",
      role: "user",
      createdAt: Date.now()
    });
  }
}

function normalizeUsername(v) {
  return (v || "").trim().toLowerCase();
}

function isValidUsername(u) {
  return /^[a-z0-9._-]{3,20}$/.test(u);
}

function usernameToEmail(u) {
  return `${u}@tjc.local`;
}

function humanFirebaseError(e) {
  const code = e?.code || "";
  switch (code) {
    case "auth/weak-password": return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    case "auth/email-already-in-use": return "Username นี้ถูกใช้แล้ว";
    case "auth/user-not-found": return "ไม่พบ Username นี้";
    case "auth/wrong-password": return "รหัสผ่านไม่ถูกต้อง";
    case "auth/operation-not-allowed": return "ยังไม่ได้เปิด Email/Password ใน Firebase";
    case "auth/unauthorized-domain": return "โดเมนนี้ยังไม่ได้เพิ่มใน Authorized domains";
    default: return e?.message || "เกิดข้อผิดพลาด";
  }
}

async function ensureUserProfile(user, username) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      username,
      email: user.email,
      role: "user",
      createdAt: Date.now()
    });
  }
}

console.log("login.js loaded ✅");

$("btnLogin")?.addEventListener("click", async () => {
  console.log("Login clicked ✅");
  try {
    setMessage("");
    const username = normalizeUsername($("username")?.value);
    const password = $("password")?.value || "";

    if (!username || !password) return setMessage("กรุณากรอก Username และ Password");
    if (!isValidUsername(username)) return setMessage("Username ต้องเป็น a-z 0-9 และ . _ - ความยาว 3-20 ตัว");

    setMessage("กำลังเข้าสู่ระบบ...");
    await signInWithEmailAndPassword(auth, usernameToEmail(username), password);
    await ensureUserProfile(auth.currentUser, username);
    window.location.href = "app.html";


    window.location.href = "app.html";
  } catch (e) {
    setMessage(`Login ไม่สำเร็จ: ${humanFirebaseError(e)} (${e?.code || "-"})`);
    console.error(e);
  }
});

$("btnRegister")?.addEventListener("click", async () => {
  console.log("Register clicked ✅");
  try {
    setMessage("");
    const username = normalizeUsername($("username")?.value);
    const password = $("password")?.value || "";

    if (!username || !password) return setMessage("กรุณากรอก Username และ Password ก่อนสมัคร");
    if (!isValidUsername(username)) return setMessage("Username ต้องเป็น a-z 0-9 และ . _ - ความยาว 3-20 ตัว");
    if (password.length < 6) return setMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");

    setMessage("กำลังสมัครสมาชิก...");
    const cred = await createUserWithEmailAndPassword(auth, usernameToEmail(username), password);

    // ✅ สร้างโปรไฟล์ของตัวเอง (rules อนุญาต)
    await ensureUserProfile(cred.user, username);

    window.location.href = "app.html";
  } catch (e) {
    setMessage(`Register ไม่สำเร็จ: ${humanFirebaseError(e)} (${e?.code || "-"})`);
    console.error(e);
  }
});

// ถ้า login อยู่แล้วให้เด้งไป app.html
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "app.html";
});
