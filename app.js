import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

function showModal(show){
  const m = $("profileModal");
  if (!m) return;
  if (show) m.classList.add("show");
  else m.classList.remove("show");
}

function fmtDate(ms){
  if(!ms) return "-";
  try{
    return new Date(ms).toLocaleString("th-TH");
  }catch{ return String(ms); }
}

// ====== หน้า app.html ======
if ($("btnLogout")) {
  const logoutAll = async () => {
    await signOut(auth);
    window.location.href = "index.html";
  };

  $("btnLogout").addEventListener("click", logoutAll);
  $("btnLogout2")?.addEventListener("click", logoutAll);

  // modal close
  $("btnProfile")?.addEventListener("click", () => showModal(true));
  $("profileClose")?.addEventListener("click", () => showModal(false));
  $("profileX")?.addEventListener("click", () => showModal(false));

  onAuthStateChanged(auth, async (user) => {
    if(!user){
      window.location.href = "index.html";
      return;
    }

    // โหลดโปรไฟล์จาก Firestore
    const snap = await getDoc(doc(db, "users", user.uid));
    const profile = snap.exists() ? snap.data() : {};

    // subtitle บน header
    const who = $("whoami");
    if (who) who.textContent = `${profile.username || user.email} • role: ${profile.role || "user"}`;

    // admin link เฉพาะ admin
    const adminLink = $("adminLink");
    if (adminLink && profile.role === "admin") adminLink.style.display = "inline-flex";

    // เติมข้อมูลใน Profile Modal
    $("pfUsername") && ($("pfUsername").textContent = profile.username || "-");
    $("pfRole") && ($("pfRole").textContent = profile.role || "user");
    $("pfEmail") && ($("pfEmail").textContent = user.email || "-");
    $("pfCreated") && ($("pfCreated").textContent = fmtDate(profile.createdAt));

    // Reset password (จะส่งไป email จำลอง)
    $("btnResetPassword")?.addEventListener("click", async () => {
      try{
        $("pfMsg").textContent = "กำลังส่งลิงก์รีเซ็ตรหัสผ่าน...";
        await sendPasswordResetEmail(auth, user.email);
        $("pfMsg").textContent = "ส่งลิงก์ Reset Password แล้ว (ตรวจกล่องจดหมายของ email ภายในระบบ)";
      }catch(e){
        $("pfMsg").textContent = `ส่งไม่สำเร็จ: ${e?.message || e}`;
      }
    });
  });
}
