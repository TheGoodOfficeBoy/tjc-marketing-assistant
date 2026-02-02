import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc, setDoc, getDoc, query, collection, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

function setMessage(t) {
  const el = $("msg");
  if (el) el.textContent = t || "";
}

function setLoading(btnId, isLoading) {
  const btn = $(btnId);
  if (!btn) return;
  btn.disabled = isLoading;
  btn.style.opacity = isLoading ? "0.7" : "1";
  btn.style.pointerEvents = isLoading ? "none" : "auto";
}

function normalizeUsername(v) {
  return (v || "").trim().toLowerCase();
}

// ✅ ข้อกำหนด username แบบง่ายๆ (ปรับได้)
function isValidUsername(u) {
  // ตัวอักษรอังกฤษ/ตัวเลข/._- ยาว 3-20
  return /^[a-z0-9._-]{3,20}$/.test(u);
}

// ✅ แปลง username → email จำลอง (ผู้ใช้ไม่ต้องรู้)
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
    case "auth/invalid-email": return "Username ไม่ถูกต้อง";
    case "auth/operation-not-allowed": return "ยังไม่ได้เปิด Email/Password ใน Firebase";
    case "auth/unauthorized-domain": return "โดเมนนี้ยังไม่ได้เพิ่มใน Authorized domains";
    default: return "";
  }
}

// ✅ สร้าง/เช็ค user profile
async function ensureUserProfile(user, username) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,        // email จำลอง
      username: username || "", // username จริง
      role: "user",
      createdAt: Date.now()
    });
  }
  return await getDoc(ref);
}

// ✅ กันคนสมัคร username ซ้ำแบบชัวร์ (นอกจาก auth)
// (optional แต่ช่วยให้ชัวร์ขึ้น)
async function isUsernameTaken(username) {
  const qy = query(collection(db, "users"), where("username", "==", username));
  const snaps = await getDocs(qy);
  return !snaps.empty;
}

/* ===========================
   หน้า index.html (Login/Register)
=========================== */
if ($("btnLogin") || $("btnRegister")) {
  const btnLogin = $("btnLogin");
  const btnRegister = $("btnRegister");

  if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
      try {
        setMessage("");
        setLoading("btnLogin", true);
        setLoading("btnRegister", true);

        const username = normalizeUsername($("username")?.value);
        const password = $("password")?.value || "";

        if (!username || !password) {
          setMessage("กรุณากรอก Username และ Password");
          return;
        }
        if (!isValidUsername(username)) {
          setMessage("Username ต้องเป็น a-z 0-9 และ . _ - ความยาว 3-20 ตัว");
          return;
        }

        setMessage("กำลังเข้าสู่ระบบ...");
        const email = usernameToEmail(username);
        await signInWithEmailAndPassword(auth, email, password);
      } catch (e) {
        const nice = humanFirebaseError(e);
        setMessage(`Login ไม่สำเร็จ: ${nice || (e?.message || e)} (${e?.code || "no-code"})`);
      } finally {
        setLoading("btnLogin", false);
        setLoading("btnRegister", false);
      }
    });
  }

  if (btnRegister) {
    btnRegister.addEventListener("click", async () => {
      try {
        setMessage("");
        setLoading("btnRegister", true);
        setLoading("btnLogin", true);

        const username = normalizeUsername($("username")?.value);
        const password = $("password")?.value || "";

        if (!username || !password) {
          setMessage("กรุณากรอก Username และ Password ก่อนสมัคร");
          return;
        }
        if (!isValidUsername(username)) {
          setMessage("Username ต้องเป็น a-z 0-9 และ . _ - ความยาว 3-20 ตัว");
          return;
        }
        if (password.length < 6) {
          setMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
          return;
        }

        // ✅ เช็ค username ซ้ำ (ชัวร์ขึ้น)
        if (await isUsernameTaken(username)) {
          setMessage("Username นี้ถูกใช้แล้ว");
          return;
        }

        setMessage("กำลังสมัครสมาชิก...");
        const email = usernameToEmail(username);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(cred.user, username);

        setMessage("สมัครสำเร็จ! กำลังพาไปหน้าเมนู...");
        window.location.href = "app.html";
      } catch (e) {
        const nice = humanFirebaseError(e);
        setMessage(`Register ไม่สำเร็จ: ${nice || (e?.message || e)} (${e?.code || "no-code"})`);
      } finally {
        setLoading("btnRegister", false);
        setLoading("btnLogin", false);
      }
    });
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // ถ้าเข้ามาแล้วค่อย redirect
      window.location.href = "app.html";
    }
  });
}

/* ===========================
   หน้า app.html (Guard + Logout)
=========================== */
if ($("btnLogout")) {
  $("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    // โหลด profile เพื่อโชว์ role/username
    const profileSnap = await getDoc(doc(db, "users", user.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : {};

    const who = $("whoami");
    if (who) who.textContent = `${profile.username || user.email} • role: ${profile.role || "user"}`;

    const adminLink = $("adminLink");
    if (adminLink && profile.role === "admin") adminLink.style.display = "inline-flex";
  });
}
