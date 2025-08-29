// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LoadingOverlay from "../components/common/LoadingOverlay";
import type { ReactElement } from "react";

export default function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingOverlay message="認証中です…" />;
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}
