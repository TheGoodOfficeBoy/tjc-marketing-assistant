import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getDatabase, ref, set, push, get } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuYStMuXj-S9kItbQASZUKJ5NvhokpeVc",
  authDomain: "tjc-marketing-console.firebaseapp.com",
  projectId: "tjc-marketing-console",
  storageBucket: "tjc-marketing-console.firebasestorage.app",
  messagingSenderId: "896679016286",
  appId: "1:896679016286:web:599a88c1ad32943f1cc1cf",
  measurementId: "G-LK4CG6NJD0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);  // For Realtime Database
const firestore = getFirestore(app);  // For Firestore (if you need it later)

// Set login session to persist in local storage
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Function to save score to Firebase Realtime Database
export const saveScore = (name, score) => {
  const leaderboardRef = ref(db, 'leaderboard/');  // Reference to 'leaderboard' node
  const newScoreRef = push(leaderboardRef);  // Using push to add new data
  set(newScoreRef, {
    name: name,  // Player's name
    score: score,  // Player's score
  }).then(() => {
    console.log('Score saved successfully!');
  }).catch((error) => {
    console.error("Error saving score: ", error);
  });
};

// Function to get leaderboard data from Firebase Realtime Database
export const getLeaderboard = async () => {
  const leaderboardRef = ref(db, 'leaderboard/');  // Reference to 'leaderboard' node
  const snapshot = await get(leaderboardRef);  // Fetch data from the database
  if (snapshot.exists()) {
    return snapshot.val();  // Return the data
  } else {
    console.log("No data available");
    return {};  // Return empty object if no data
  }
};

// Function to get user details from Firebase Authentication
export const getUserDetails = () => {
  const user = auth.currentUser;  // Get the current user
  if (user) {
    return { uid: user.uid, name: user.displayName || "Anonymous" };  // Return user details
  }
  return null;  // Return null if no user is logged in
};

// Function to log in a user anonymously (if not using authentication system)
export const loginAnonymously = async () => {
  try {
    await auth.signInAnonymously();  // Sign in as anonymous user
    console.log("Logged in anonymously");
  } catch (error) {
    console.error("Error logging in anonymously: ", error);
  }
};

// Function to logout user
export const logout = async () => {
  try {
    await auth.signOut();  // Sign out user
    console.log("User signed out");
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};
