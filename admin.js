import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection, doc, query, where, getDocs, getDoc, setDoc, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

function setMessage(t){ const el = $("msg"); if(el) el.textContent = t || ""; }

console.log("admin.js loaded ✅");

async function doLogout(){
  await signOut(auth);
  window.location.href = "index.html";
}
$("btnLogout")?.addEventListener("click", doLogout);

async function getMyProfile(uid){
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

async function renderRecentUsers(){
  const box = $("users");
  if(!box) return;

  box.innerHTML = `<div class="muted">กำลังโหลดรายชื่อ...</div>`;
  const qy = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(30));
  const snaps = await getDocs(qy);

  box.innerHTML = "";
  snaps.forEach(s => {
    const d = s.data();
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div>
        <div style="font-weight:800">${d.username || "-"}</div>
        <div style="opacity:.75;font-size:12px">${d.email || ""}</div>
      </div>
      <div class="badge">${d.role || "user"}</div>
    `;
    box.appendChild(row);
  });

  if (snaps.empty) {
    box.innerHTML = `<div class="muted">ยังไม่มีผู้ใช้</div>`;
  }
}

$("btnReload")?.addEventListener("click", async () => {
  try{
    setMessage("");
    await renderRecentUsers();
    setMessage("รีเฟรชแล้ว ✅");
  }catch(e){
    setMessage("รีเฟรชไม่สำเร็จ: " + (e?.message || e));
    console.error(e);
  }
});

$("btnSetRole")?.addEventListener("click", async () => {
  try{
    setMessage("");

    const username = ($("targetUsername")?.value || "").trim().toLowerCase();
    const role = $("targetRole")?.value || "user";

    if(!username){
      setMessage("กรุณากรอก Username");
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

    setMessage("กำลังบันทึกสิทธิ์...");
    await setDoc(doc(db, "users", userDoc.id), { role }, { merge:true });

    setMessage(`สำเร็จ ✅ ตั้ง role ของ ${username} เป็น ${role}`);
    await renderRecentUsers();
  }catch(e){
    setMessage("ทำรายการไม่สำเร็จ: " + (e?.message || e));
    console.error(e);
  }
});

// Guard: ต้องเป็น admin เท่านั้น
onAuthStateChanged(auth, async (user) => {
  try{
    if(!user){
      window.location.href = "index.html";
      return;
    }

    const profile = await getMyProfile(user.uid);
    const who = $("whoami");
    if (who) who.textContent = `${profile?.username || user.email} • role: ${profile?.role || "user"}`;

    if(profile?.role !== "admin"){
      alert("หน้านี้สำหรับ Admin เท่านั้น");
      window.location.href = "app.html";
      return;
    }

    await renderRecentUsers();
  }catch(e){
    setMessage("โหลดหน้า Admin ไม่สำเร็จ: " + (e?.message || e));
    console.error(e);
  }
});
