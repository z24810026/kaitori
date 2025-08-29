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
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
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
            {/* /admin の初期ページ */}
            <Route index element={<AdminDashboard />} />
            {/* 買取表 */}
            <Route path="kaitori" element={<KaitoriPage />} />
            {/* セッティング */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div style={{ padding: 24 }}>ページが見つかりません（404）</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
