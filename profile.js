import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

function setMessage(t){ const el = $("msg"); if(el) el.textContent = t || ""; }
function fmtDate(ms){ if(!ms) return "-"; try{ return new Date(ms).toLocaleString("th-TH"); }catch{ return String(ms); } }

console.log("profile.js loaded ✅");

$("btnLogout")?.addEventListener("click", async () => {
  try{
    await signOut(auth);
    window.location.href = "index.html";
  }catch(e){
    setMessage("Logout ไม่สำเร็จ: " + (e?.message || e));
  }
});

onAuthStateChanged(auth, async (user) => {
  if(!user){
    window.location.href = "index.html";
    return;
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  const profile = snap.exists() ? snap.data() : {};

  $("whoami") && ($("whoami").textContent = `${profile.username || user.email} • role: ${profile.role || "user"}`);
  $("pfUsername") && ($("pfUsername").textContent = profile.username || "-");
  $("pfRole") && ($("pfRole").textContent = profile.role || "user");
  $("pfEmail") && ($("pfEmail").textContent = user.email || "-");
  $("pfCreated") && ($("pfCreated").textContent = fmtDate(profile.createdAt));

  const adminLink = $("adminLink");
  if (adminLink && profile.role === "admin") adminLink.style.display = "inline-flex";
});
