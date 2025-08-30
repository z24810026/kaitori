import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQOCmyM9MEZMkR5mQhBJLsKrmlnTwpF8A",
  authDomain: "torekabasu.firebaseapp.com",
  projectId: "torekabasu",
  storageBucket: "torekabasu.firebasestorage.app", // ✅ 修正這裡
  messagingSenderId: "213345193146",
  appId: "1:213345193146:web:e4625235f5917a375fc683",
  measurementId: "G-7DX0NXXKLX",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ 加上這行
