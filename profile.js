import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

function setMessage(t) {
  const el = $("msg");
  if (el) el.textContent = t || "";
}

function fmtDate(ms) {
  if (!ms) return "-";
  try {
    return new Date(ms).toLocaleString("th-TH");
  } catch {
    return String(ms);
  }
}

function isAdmin(role) {
  return role === "admin" || role === "super_admin";
}

console.log("profile.js loaded ✅");

$("btnLogout")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (e) {
    setMessage("Logout ไม่สำเร็จ: " + (e?.message || e));
  }
});

onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const profile = snap.exists() ? snap.data() : {};

    const role = profile.role || "user";
    const username = profile.username || "-";

    $("whoami") && ($("whoami").textContent = `${username || user.email} • role: ${role}`);
    $("pfUsername") && ($("pfUsername").textContent = username);
    $("pfRole") && ($("pfRole").textContent = role);
    $("pfEmail") && ($("pfEmail").textContent = user.email || "-");
    $("pfCreated") && ($("pfCreated").textContent = fmtDate(profile.createdAt));

    const adminLink = $("adminLink");
    if (adminLink) {
      adminLink.style.display = isAdmin(role) ? "inline-flex" : "none";
    }
  } catch (e) {
    setMessage("โหลดข้อมูลโปรไฟล์ไม่สำเร็จ: " + (e?.message || e));
    console.error(e);
  }
});
