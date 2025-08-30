// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import Home from "./pages/Home/Home";
import AdminLogin from "./pages/Admin/AdminLogin";
import Register from "./pages/Admin/Register";
import AdminDashboard from "./pages/Admin/AdminDashboard/AdminDashboard";
import AdminLayout from "./pages/Admin/AdminLayout";
import KaitoriPage from "./pages/Admin/KaitoriPage/KaitoriPage";
import SettingsPage from "./pages/Admin/SettingsPage/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import CardGameDetailPage from "./pages/Admin/KaitoriPage/CardGameDetailPage";
import VersionDetailPage from "./pages/Admin/KaitoriPage/VersionDetailPage";
import CardDetailPage from "./pages/Admin/KaitoriPage/CardDetailPage"; // ← 新增
import { ToastProvider } from "./components/common/Toast"; // ✅

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      {" "}
      {/* ✅ 讓全站都能用 useToast() */}
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* 公開サイト */}
            <Route path="/" element={<Home />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<Register />} />

            {/* 管理画面（要ログイン） */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="kaitori" element={<KaitoriPage />} />
              <Route path="kaitori/:id" element={<CardGameDetailPage />} />
              <Route
                path="kaitori/:id/version/:vid"
                element={<VersionDetailPage />}
              />
              <Route
                path="kaitori/:id/version/:vid/card/:cid"
                element={<CardDetailPage />}
              />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* 404 */}
            <Route
              path="*"
              element={
                <div style={{ padding: 24 }}>ページが見つかりません（404）</div>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  </React.StrictMode>,
);
