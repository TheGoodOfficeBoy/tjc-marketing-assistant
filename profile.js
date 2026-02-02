import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  updatePassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

function setMessage(t) {
  const el = $("msg");
  if (el) el.textContent = t || "";
}

function fmtDate(ms){
  if(!ms) return "-";
  try{ return new Date(ms).toLocaleString("th-TH"); }
  catch{ return String(ms); }
}

// ✅ Logout (ผูกครั้งเดียวแบบชัวร์)
async function doLogout(){
  try{
    setMessage("กำลังออกจากระบบ...");
    await signOut(auth);
    window.location.href = "index.html";
  }catch(e){
    setMessage("Logout ไม่สำเร็จ: " + (e?.message || e));
  }
}

$("btnLogout")?.addEventListener("click", doLogout);

onAuthStateChanged(auth, async (user) => {
  if(!user){
    window.location.href = "index.html";
    return;
  }

  // โหลด profile
  const snap = await getDoc(doc(db, "users", user.uid));
  const profile = snap.exists() ? snap.data() : {};

  // header subtitle
  const who = $("whoami");
  if (who) who.textContent = `${profile.username || user.email} • role: ${profile.role || "user"}`;

  // admin link
  const adminLink = $("adminLink");
  if (adminLink && profile.role === "admin") adminLink.style.display = "inline-flex";

  // fill fields
  $("pfUsername") && ($("pfUsername").textContent = profile.username || "-");
  $("pfRole") && ($("pfRole").textContent = profile.role || "user");
  $("pfEmail") && ($("pfEmail").textContent = user.email || "-");
  $("pfCreated") && ($("pfCreated").textContent = fmtDate(profile.createdAt));

  // Change password (ในหน้าเว็บทันที)
  $("btnChangePassword")?.addEventListener("click", async () => {
    const newPass = prompt("ตั้งรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร):");
    if(!newPass) return;
    if(newPass.length < 6){
      setMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    try{
      setMessage("กำลังเปลี่ยนรหัสผ่าน...");
      await updatePassword(user, newPass);
      setMessage("เปลี่ยนรหัสผ่านสำเร็จ ✅");
    }catch(e){
      setMessage("เปลี่ยนรหัสผ่านไม่สำเร็จ: " + (e?.message || e));
    }
  });

  // Reset link (ส่งไป email ภายในระบบ)
  $("btnResetPassword")?.addEventListener("click", async () => {
    try{
      setMessage("กำลังส่งลิงก์รีเซ็ต...");
      await sendPasswordResetEmail(auth, user.email);
      setMessage("ส่งลิงก์รีเซ็ตแล้ว ✅ (ตรวจกล่องจดหมายของ email ภายในระบบ)");
    }catch(e){
      setMessage("ส่งไม่สำเร็จ: " + (e?.message || e));
    }
  });
});
