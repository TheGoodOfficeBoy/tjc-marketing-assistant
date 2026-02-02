import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const msg = $("msg");

function setMessage(t){ if(msg) msg.textContent = t || ""; }

// ✅ สร้าง user profile ใน Firestore
async function ensureUserProfile(user){
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref, {
      email: user.email,
      role: "user",
      createdAt: Date.now()
    });
  }
  return await getDoc(ref);
}

// ====== หน้า index.html ======
if ($("btnLogin")) {
  $("btnLogin").addEventListener("click", async () => {
    try{
      setMessage("กำลังเข้าสู่ระบบ...");
      const email = $("email").value.trim();
      const password = $("password").value;
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged จะพาไป app.html เอง
    }catch(e){
      setMessage("Login ไม่สำเร็จ: " + (e?.message || e));
    }
  });

  $("btnRegister").addEventListener("click", async () => {
    try{
      setMessage("กำลังสมัครสมาชิก...");
      const email = $("email").value.trim();
      const password = $("password").value;
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(cred.user);
      setMessage("สมัครสำเร็จ! กำลังพาไปหน้าเมนู...");
      window.location.href = "app.html";
    }catch(e){
      setMessage("Register ไม่สำเร็จ: " + (e?.message || e));
    }
  });

  onAuthStateChanged(auth, async (user) => {
    if(user){
      await ensureUserProfile(user);
      window.location.href = "app.html";
    }
  });
}

// ====== หน้า app.html ======
if ($("btnLogout")) {
  $("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });

  onAuthStateChanged(auth, async (user) => {
    if(!user){
      window.location.href = "index.html";
      return;
    }

    const profileSnap = await ensureUserProfile(user);
    const profile = profileSnap.data();

    const who = $("whoami");
    if (who) who.textContent = `${user.email} • role: ${profile.role}`;

    // show admin link if admin
    const adminLink = $("adminLink");
    if (adminLink && profile.role === "admin") adminLink.style.display = "inline-flex";
  });
}