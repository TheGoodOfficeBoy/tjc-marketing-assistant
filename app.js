import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

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

async function logoutAll() {
  try {
    await signOut(auth);
    window.location.href = "index.html";
  } catch (e) {
    console.error("Logout failed:", e);
    alert("Logout ไม่สำเร็จ: " + (e?.message || e));
  }
}

function showModal(show) {
  const modal = $("profileModal");
  if (!modal) return;

  modal.style.display = show ? "flex" : "none";
  modal.setAttribute("aria-hidden", show ? "false" : "true");
}

$("btnLogout")?.addEventListener("click", logoutAll);
$("btnLogout2")?.addEventListener("click", logoutAll);

// modal open / close
$("btnProfile")?.addEventListener("click", () => showModal(true));
$("profileClose")?.addEventListener("click", () => showModal(false));
$("profileX")?.addEventListener("click", () => showModal(false));

// ปิด modal เมื่อคลิกพื้นหลัง
$("profileModal")?.addEventListener("click", (e) => {
  if (e.target?.id === "profileModal") {
    showModal(false);
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
    const username = profile.username || user.email || "-";

    // subtitle บน header
    const who = $("whoami");
    if (who) who.textContent = `${username} • role: ${role}`;

    // admin link สำหรับ admin + super_admin
    const adminLink = $("adminLink");
    if (adminLink) {
      adminLink.style.display = isAdmin(role) ? "inline-flex" : "none";
    }

    // เติมข้อมูลใน Profile Modal
    $("pfUsername") && ($("pfUsername").textContent = profile.username || "-");
    $("pfRole") && ($("pfRole").textContent = role);
    $("pfEmail") && ($("pfEmail").textContent = user.email || "-");
    $("pfCreated") && ($("pfCreated").textContent = fmtDate(profile.createdAt));

    // reset password
    const btnReset = $("btnResetPassword");
    if (btnReset && !btnReset.dataset.bound) {
      btnReset.dataset.bound = "true";

      btnReset.addEventListener("click", async () => {
        try {
          if (!$("pfMsg")) return;

          $("pfMsg").textContent = "กำลังส่งลิงก์รีเซ็ตรหัสผ่าน...";
          await sendPasswordResetEmail(auth, user.email);
          $("pfMsg").textContent =
            "ส่งลิงก์ Reset Password แล้ว กรุณาตรวจสอบอีเมลของคุณ";
        } catch (e) {
          $("pfMsg").textContent = `ส่งไม่สำเร็จ: ${e?.message || e}`;
        }
      });
    }
  } catch (e) {
    console.error("โหลด app ไม่สำเร็จ:", e);
    alert("โหลดข้อมูลผู้ใช้ไม่สำเร็จ: " + (e?.message || e));
  }
});
