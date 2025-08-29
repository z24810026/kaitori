import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";   
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
// （選用）如果你要做角色判斷：
// import { db } from "../firebase";
// import { doc, getDoc } from "firebase/firestore";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // isAdmin?: boolean; // 需要角色時再打開
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const navigate = useNavigate();
  // const [isAdmin, setIsAdmin] = useState<boolean>(false); // 需要角色時再打開

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      // （選用）角色邏輯：users/{uid}.role === "admin"
      // if (u) {
      //   const snap = await getDoc(doc(db, "users", u.uid));
      //   setIsAdmin(snap.exists() && snap.data().role === "admin");
      // } else {
      //   setIsAdmin(false);
      // }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/admin/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout /*, isAdmin*/ }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
