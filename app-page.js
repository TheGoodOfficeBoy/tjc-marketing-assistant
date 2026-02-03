import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

console.log("app-page.js loaded ✅");

async function doLogout(){
  try{
    await signOut(auth);
    window.location.href = "index.html";
  }catch(e){
    const el = $("pageMsg");
    if(el) el.textContent = "Logout ไม่สำเร็จ: " + (e?.message || e);
    console.error(e);
  }
}

$("btnLogout")?.addEventListener("click", doLogout);

onAuthStateChanged(auth, async (user) => {
  try{
    if(!user){
      window.location.href = "index.html";
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const profile = snap.exists() ? snap.data() : {};

    const who = $("whoami");
    if (who) who.textContent = `${profile.username || user.email} • role: ${profile.role || "user"}`;

    const adminLink = $("adminLink");
    if (adminLink && profile.role === "admin") adminLink.style.display = "inline-flex";
  }catch(e){
    const who = $("whoami");
    if (who) who.textContent = "โหลดข้อมูลไม่สำเร็จ (ดู Console)";
    const el = $("pageMsg");
    if(el) el.textContent = "Error: " + (e?.message || e);
    console.error(e);
  }
});
