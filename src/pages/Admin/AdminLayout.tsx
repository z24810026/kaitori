import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./CSS/AdminLayout.css";

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    // logout 裡面已經 navigate 到 /admin/login，如果你想回首頁也可：
    // navigate("/");
  };

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-logo">🪪</span>
          <span className="brand-name">Admin</span>
        </div>

        <nav className="admin-nav">
          <NavLink
            to="/admin/kaitori"
            className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          >
            <i className="bx bx-card"></i>
            <span>買取表</span>
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          >
            <i className="bx bx-cog"></i>
            <span>セッティング</span>
          </NavLink>

          <button type="button" className="nav-item logout" onClick={onLogout}>
            <i className="bx bx-log-out"></i>
            <span>ログアウト</span>
          </button>
        </nav>

        <div className="admin-user">
          <div className="user-mail">{user?.email}</div>
          <div className="user-status">オンライン</div>
        </div>
      </aside>

      <main className="admin-content">
        {/* 右側內容會由巢狀路由渲染 */}
        <Outlet />
      </main>
    </div>
  );
}
