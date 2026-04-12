import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
console.log("app-page.js loaded ✅");

function isAdmin(role) {
  return role === "admin" || role === "super_admin";
}

async function logout() {
  console.log("Logout clicked ✅");
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (e) {
    alert("Logout ไม่สำเร็จ: " + (e?.message || e));
    console.error(e);
  }
}
$("btnLogout")?.addEventListener("click", logout);

// ===== Guard + load profile =====
async function ensureUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const username = (user.email || "").split("@")[0].toLowerCase();
    const data = {
      username,
      email: user.email || "",
      role: "user",
      createdAt: Date.now(),
    };
    await setDoc(userRef, data);
    return data;
  }
  return snap.data();
}

onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    const profile = await ensureUserProfile(user);
    const role     = profile?.role     || "user";
    const username = profile?.username || user.email || "-";

    // แสดงชื่อผู้ใช้
    const who = $("whoami");
    if (who) who.textContent = `${username} • role: ${role}`;

    // expose ให้ game script ใช้ได้ผ่าน window
    window.tdCurrentUser = { name: username, role };

    // แสดง Admin link
    const adminLink = $("adminLink");
    if (adminLink) adminLink.style.display = isAdmin(role) ? "inline-flex" : "none";

  } catch (e) {
    alert("โหลดข้อมูลผู้ใช้ไม่สำเร็จ: " + (e?.message || e));
    console.error(e);
  }
});
