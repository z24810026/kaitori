import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBQOCmyM9MEZMkR5mQhBJLsKrmlnTwpF8A",
  authDomain: "torekabasu.firebaseapp.com",
  projectId: "torekabasu",
  storageBucket: "torekabasu.firebasestorage.app",
  messagingSenderId: "213345193146",
  appId: "1:213345193146:web:e4625235f5917a375fc683",
  measurementId: "G-7DX0NXXKLX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
