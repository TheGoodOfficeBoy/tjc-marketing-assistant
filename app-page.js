import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

console.log("app-page.js loaded ✅");

// ===== Logout (ผูกทันที) =====
$("btnLogout")?.addEventListener("click", async () => {
  console.log("Logout clicked ✅");
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (e) {
    alert("Logout ไม่สำเร็จ: " + (e?.message || e));
    console.error(e);
  }
});

// ===== Guard + load profile =====
async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      username: (user.email || "").split("@")[0],
      email: user.email || "",
      role: "user",
      createdAt: Date.now(),
    });
  }
  return (await getDoc(ref)).data();
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const profile = await ensureUserProfile(user);

  // แสดงชื่อผู้ใช้
  const who = $("whoami");
  if (who) {
    who.textContent = `${profile.username || user.email} • role: ${profile.role || "user"}`;
  }

  // แสดง Admin link ถ้าเป็น admin
  const adminLink = $("adminLink");
  if (adminLink && profile.role === "admin") {
    adminLink.style.display = "inline-flex";
  }
});
