import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

let currentProfile = null;

function setMessage(t) {
  const el = $("msg");
  if (el) el.textContent = t || "";
}

console.log("admin.js loaded ✅");

async function doLogout() {
  await signOut(auth);
  window.location.href = "index.html";
}
$("btnLogout")?.addEventListener("click", doLogout);

async function getMyProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

function isAdmin(role) {
  return role === "admin" || role === "super_admin";
}

function isSuperAdmin(role) {
  return role === "super_admin";
}

function canManageRoles() {
  return isSuperAdmin(currentProfile?.role);
}

function updateRoleUI() {
  const btn = $("btnSetRole");
  const roleSelect = $("targetRole");
  const usernameInput = $("targetUsername");

  if (!btn && !roleSelect && !usernameInput) return;

  if (canManageRoles()) {
    if (btn) btn.disabled = false;
    if (roleSelect) roleSelect.disabled = false;
    if (usernameInput) usernameInput.disabled = false;
    return;
  }

  if (btn) btn.disabled = true;
  if (roleSelect) roleSelect.disabled = true;
  if (usernameInput) usernameInput.disabled = true;
}

async function renderRecentUsers() {
  const box = $("users");
  if (!box) return;

  box.innerHTML = `<div class="muted">กำลังโหลดรายชื่อ...</div>`;

  const qy = query(
    collection(db, "users"),
    orderBy("createdAt", "desc"),
    limit(30)
  );

  const snaps = await getDocs(qy);

  box.innerHTML = "";

  snaps.forEach((s) => {
    const d = s.data();
    const row = document.createElement("div");
    row.className = "row";

    const role = d.role || "user";
    const isMe = auth.currentUser && s.id === auth.currentUser.uid;

    row.innerHTML = `
      <div>
        <div style="font-weight:800">
          ${d.username || "-"} ${isMe ? '<span style="opacity:.6;font-size:12px">(คุณ)</span>' : ""}
        </div>
        <div style="opacity:.75;font-size:12px">${d.email || ""}</div>
      </div>
      <div class="badge">${role}</div>
    `;

    box.appendChild(row);
  });

  if (snaps.empty) {
    box.innerHTML = `<div class="muted">ยังไม่มีผู้ใช้</div>`;
  }
}

$("btnReload")?.addEventListener("click", async () => {
  try {
    setMessage("");
    await renderRecentUsers();
    setMessage("รีเฟรชแล้ว ✅");
  } catch (e) {
    setMessage("รีเฟรชไม่สำเร็จ: " + (e?.message || e));
    console.error(e);
  }
});

$("btnSetRole")?.addEventListener("click", async () => {
  try {
    setMessage("");

    if (!currentProfile) {
      setMessage("ยังโหลดข้อมูลผู้ใช้ปัจจุบันไม่เสร็จ");
      return;
    }

    if (!canManageRoles()) {
      setMessage("เฉพาะ Super Admin เท่านั้นที่เปลี่ยนสิทธิ์ผู้ใช้ได้");
      return;
    }

    const username = ($("targetUsername")?.value || "").trim().toLowerCase();
    const role = $("targetRole")?.value || "user";

    if (!username) {
      setMessage("กรุณากรอก Username");
      return;
    }

    if (!["user", "admin", "super_admin"].includes(role)) {
      setMessage("Role ไม่ถูกต้อง");
      return;
    }

    setMessage("กำลังค้นหาผู้ใช้...");
    const qy = query(collection(db, "users"), where("username", "==", username));
    const snaps = await getDocs(qy);

    if (snaps.empty) {
      setMessage("ไม่พบผู้ใช้นี้ (ให้ผู้ใช้คนนั้น Register/Login อย่างน้อย 1 ครั้งก่อน)");
      return;
    }

    const userDoc = snaps.docs[0];
    const targetData = userDoc.data();
    const targetRole = targetData?.role || "user";

    if (auth.currentUser && userDoc.id === auth.currentUser.uid && role !== "super_admin") {
      const ok = confirm("คุณกำลังลดสิทธิ์บัญชีตัวเอง ต้องการดำเนินการต่อหรือไม่?");
      if (!ok) {
        setMessage("ยกเลิกการทำรายการ");
        return;
      }
    }

    setMessage("กำลังบันทึกสิทธิ์...");
    await setDoc(doc(db, "users", userDoc.id), { role }, { merge: true });

    setMessage(`สำเร็จ ✅ ตั้ง role ของ ${username} จาก ${targetRole} เป็น ${role}`);
    await renderRecentUsers();
  } catch (e) {
    setMessage("ทำรายการไม่สำเร็จ: " + (e?.message || e));
    console.error(e);
  }
});

// Guard: เข้าได้ทั้ง admin และ super_admin
onAuthStateChanged(auth, async (user) => {
  try {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    currentProfile = await getMyProfile(user.uid);

    const who = $("whoami");
    if (who) {
      who.textContent = `${currentProfile?.username || user.email} • role: ${currentProfile?.role || "user"}`;
    }

    if (!isAdmin(currentProfile?.role)) {
      alert("หน้านี้สำหรับ Admin หรือ Super Admin เท่านั้น");
      window.location.href = "app.html";
      return;
    }

    updateRoleUI();

    if (!canManageRoles()) {
      setMessage("คุณเป็น Admin: ดูรายชื่อผู้ใช้ได้ แต่เปลี่ยนสิทธิ์ไม่ได้");
    }

    await renderRecentUsers();
  } catch (e) {
    setMessage("โหลดหน้า Admin ไม่สำเร็จ: " + (e?.message || e));
    console.error(e);
  }
});
