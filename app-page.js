import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

async function doLogout(){
  await signOut(auth);
  window.location.href = "index.html";
}

$("btnLogout")?.addEventListener("click", doLogout);

onAuthStateChanged(auth, async (user) => {
  if(!user){
    window.location.href = "index.html";
    return;
  }
  const snap = await getDoc(doc(db, "users", user.uid));
  const profile = snap.exists() ? snap.data() : {};

  $("whoami") && ($("whoami").textContent = `${profile.username || user.email} • role: ${profile.role || "user"}`);

  const adminLink = $("adminLink");
  if (adminLink && profile.role === "admin") adminLink.style.display = "inline-flex";
});
