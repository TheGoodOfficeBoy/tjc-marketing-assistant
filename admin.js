import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection, doc, query, where, getDocs, getDoc, setDoc, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const msg = $("msg");

function setMessage(t){ if(msg) msg.textContent = t || ""; }

// ✅ ใส่ username ของ “คุณ” ที่เป็น admin ได้คนเดียว
const ADMIN_USERNAMES = ["plynoiiz"]; // เปลี่ยนเป็นของคุณ

async function getMyProfile(uid){
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

function isSuperAdmin(profile){
  const u = (profile?.username || "").toLowerCase();
  return ADMIN_USERNAMES.includes(u);
}

async function renderRecentUsers(){
  const box = $("users");
  if(!box) return;

  const qy = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(20));
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
}

$("btnLogout")?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

$("btnSetRole")?.addEventListener("click", async () => {
  try{
    setMessage("กำลังบันทึกสิทธิ์...");

    const username = ($("targetUsername").value || "").trim().toLowerCase();
    const role = $("targetRole").value;

    if(!username){
      setMessage("กรุณากรอก Username");
      return;
    }
    if(username === ADMIN_USERNAMES[0] && role !== "admin"){
      setMessage("ไม่อนุญาตให้ลดสิทธิ์ Super Admin");
      return;
    }

    // หา user doc ด้วย username
    const qy = query(collection(db, "users"), where("username", "==", username));
    const snaps = await getDocs(qy);

    if (snaps.empty) {
      setMessage("ไม่พบผู้ใช้นี้ (ให้ผู้ใช้นั้น Register/Login อย่างน้อย 1 ครั้งก่อน)");
      return;
    }

    const userDoc = snaps.docs[0];
    await setDoc(doc(db, "users", userDoc.id), { role }, { merge:true });

    setMessage(`สำเร็จ: ตั้ง role ของ ${username} เป็น ${role}`);
    await renderRecentUsers();
  }catch(e){
    setMessage("ทำรายการไม่สำเร็จ: " + (e?.message || e));
  }
});

// Guard: ต้องเป็น Super Admin เท่านั้น
onAuthStateChanged(auth, async (user) => {
  if(!user){
    window.location.href = "index.html";
    return;
  }

  const profile = await getMyProfile(user.uid);
  if(!isSuperAdmin(profile)){
    alert("หน้านี้สำหรับ Admin เท่านั้น");
    window.location.href = "app.html";
    return;
  }

  // บังคับให้ role ใน Firestore เป็น admin เสมอสำหรับ super admin
  if(profile?.role !== "admin"){
    await setDoc(doc(db, "users", user.uid), { role: "admin" }, { merge:true });
  }

  await renderRecentUsers();
});

