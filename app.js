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

function normalizeEmail(v) {
  return (v || "").trim().toLowerCase();
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function humanFirebaseError(e) {
  const code = e?.code || "";
  switch (code) {
    case "auth/invalid-email": return "อีเมลไม่ถูกต้อง";
    case "auth/missing-email": return "กรุณากรอกอีเมล";
    case "auth/missing-password": return "กรุณากรอกรหัสผ่าน";
    case "auth/weak-password": return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    case "auth/email-already-in-use": return "อีเมลนี้ถูกใช้สมัครแล้ว";
    case "auth/user-not-found": return "ไม่พบบัญชีนี้";
    case "auth/wrong-password": return "รหัสผ่านไม่ถูกต้อง";
    case "auth/operation-not-allowed": return "ยังไม่ได้เปิด Email/Password ใน Firebase";
    case "auth/unauthorized-domain": return "โดเมนนี้ยังไม่ได้เพิ่มใน Authorized domains";
    default: return "";
  }
}

// ✅ สร้าง/เช็ค user profile ใน Firestore
async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      role: "user",
      createdAt: Date.now()
    });
  }
  return await getDoc(ref);
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

        const email = normalizeEmail($("email")?.value);
        const password = $("password")?.value || "";

        if (!email || !password) {
          setMessage("กรุณากรอก Email และ Password");
          return;
        }
        if (!isValidEmail(email)) {
          setMessage("รูปแบบอีเมลไม่ถูกต้อง");
          return;
        }

        setMessage("กำลังเข้าสู่ระบบ...");
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged จะพาไป app.html
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

        const email = normalizeEmail($("email")?.value);
        const password = $("password")?.value || "";

        if (!email || !password) {
          setMessage("กรุณากรอก Email และ Password ก่อนสมัคร");
          return;
        }
        if (!isValidEmail(email)) {
          setMessage("รูปแบบอีเมลไม่ถูกต้อง");
          return;
        }
        if (password.length < 6) {
          setMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
          return;
        }

        setMessage("กำลังสมัครสมาชิก...");
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(cred.user);

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
      await ensureUserProfile(user);
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

    const profileSnap = await ensureUserProfile(user);
    const profile = profileSnap.data() || {};

    const who = $("whoami");
    if (who) who.textContent = `${user.email} • role: ${profile.role || "user"}`;

    const adminLink = $("adminLink");
    if (adminLink && profile.role === "admin") adminLink.style.display = "inline-flex";
  });
}
