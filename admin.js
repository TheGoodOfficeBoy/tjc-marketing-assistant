import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection, doc, query, where, getDocs, getDoc, setDoc, orderBy, limit
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);
const msg = $("msg");

function setMessage(t){ if(msg) msg.textContent = t || ""; }

async function getMyRole(uid){
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().role : "user";
}

async function renderRecentUsers(){
  const box = $("users");
  if(!box) return;

  const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(10));
  const snaps = await getDocs(q);

  box.innerHTML = "";
  snaps.forEach(s => {
    const d = s.data();
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div>
        <div style="font-weight:800">${d.email || "-"}</div>
        <div style="opacity:.75;font-size:12px">uid: ${s.id}</div>
      </div>
      <div class="badge">${d.role || "user"}</div>
    `;
    box.appendChild(row);
  });
}

if ($("btnLogout")) {
  $("btnLogout").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

if ($("btnSetRole")) {
  $("btnSetRole").addEventListener("click", async () => {
    try{
      setMessage("กำลังบันทึกสิทธิ์...");
      const email = $("targetEmail").value.trim().toLowerCase();
      const role = $("targetRole").value;

      // หา user doc ด้วย email
      const q = query(collection(db, "users"), where("email", "==", email));
      const snaps = await getDocs(q);

      if (snaps.empty) {
        setMessage("ไม่พบผู้ใช้นี้ในระบบ (ให้ผู้ใช้นั้น Register/Login อย่างน้อย 1 ครั้งก่อน)");
        return;
      }

      // ปรับ role ให้ doc ที่เจอ
      const docSnap = snaps.docs[0];
      await setDoc(doc(db, "users", docSnap.id), { role }, { merge:true });

      setMessage(`สำเร็จ: ตั้ง role ของ ${email} เป็น ${role}`);
      await renderRecentUsers();
    }catch(e){
      setMessage("ทำรายการไม่สำเร็จ: " + (e?.message || e));
    }
  });
}

// Guard: ต้องเป็น admin เท่านั้น
onAuthStateChanged(auth, async (user) => {
  if(!user){
    window.location.href = "index.html";
    return;
  }
  const role = await getMyRole(user.uid);
  if(role !== "admin"){
    alert("หน้านี้สำหรับ Admin เท่านั้น");
    window.location.href = "app.html";
    return;
  }
  await renderRecentUsers();
});