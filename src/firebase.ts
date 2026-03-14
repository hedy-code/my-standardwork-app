import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCnCOtnmvRzUVGoAavHTe9XLhC05hszkJo",
  authDomain: "tedycode-standard-work.firebaseapp.com",
  projectId: "tedycode-standard-work",
  storageBucket: "tedycode-standard-work.firebasestorage.app",
  messagingSenderId: "219063615102",
  appId: "1:219063615102:web:fcdf2098fc84ee2313e22f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
